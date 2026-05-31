param(
  [string]$ApiBaseUrl = "http://localhost:4000/api"
)

$ErrorActionPreference = "Stop"

function Invoke-JsonRequest {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Method,
    [Parameter(Mandatory = $true)]
    [string]$Uri,
    [hashtable]$Headers,
    [object]$Body
  )

  $request = @{
    Method = $Method
    Uri = $Uri
    ContentType = "application/json"
  }

  if ($Headers) {
    $request.Headers = $Headers
  }

  if ($null -ne $Body) {
    $request.Body = $Body | ConvertTo-Json -Depth 10
  }

  Invoke-RestMethod @request
}

function Invoke-RawJsonPost {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Uri,
    [Parameter(Mandatory = $true)]
    [hashtable]$Headers,
    [Parameter(Mandatory = $true)]
    [object]$Body
  )

  $request = [System.Net.WebRequest]::Create($Uri)
  $request.Method = "POST"
  $request.ContentType = "application/json"

  foreach ($header in $Headers.GetEnumerator()) {
    $request.Headers[$header.Key] = $header.Value
  }

  $payload = $Body | ConvertTo-Json -Depth 10
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($payload)
  $request.ContentLength = $bytes.Length

  $requestStream = $request.GetRequestStream()
  $requestStream.Write($bytes, 0, $bytes.Length)
  $requestStream.Close()

  try {
    $response = $request.GetResponse()
  } catch [System.Net.WebException] {
    $response = $_.Exception.Response
  }

  if (-not $response) {
    throw "No HTTP response was returned."
  }

  $reader = New-Object System.IO.StreamReader($response.GetResponseStream())
  $content = $reader.ReadToEnd()
  $reader.Close()

  [PSCustomObject]@{
    StatusCode = [int]$response.StatusCode
    Content = $content
  }
}

Push-Location (Join-Path $PSScriptRoot "..")

try {
  pnpm --filter "@pharmacy-pos/backend" prisma:seed

  $session = Invoke-JsonRequest `
    -Method "Post" `
    -Uri "$ApiBaseUrl/auth/login" `
    -Body @{
      email = "admin@admin.com"
      password = "admin"
    }

  $headers = @{
    Authorization = "Bearer $($session.token)"
  }

  $stamp = Get-Date -Format "yyyyMMddHHmmss"
  $category = Invoke-JsonRequest `
    -Method "Post" `
    -Uri "$ApiBaseUrl/product-categories" `
    -Headers $headers `
    -Body @{
      name = "Smoke Analgesics $stamp"
      description = "Smoke category for medicine supplier binding"
    }

  $units = Invoke-JsonRequest -Method "Get" -Uri "$ApiBaseUrl/units" -Headers $headers
  $baseUnit = $units | Where-Object { $_.abbreviation -eq "UND" } | Select-Object -First 1

  if (-not $baseUnit) {
    throw "Base unit UND was not found after seed."
  }

  $supplierA = Invoke-JsonRequest `
    -Method "Post" `
    -Uri "$ApiBaseUrl/suppliers" `
    -Headers $headers `
    -Body @{
      businessName = "Smoke Supplier A $stamp"
      nit = "SMA$stamp"
      phone = "70000001"
      address = "Smoke Avenue 1"
      contactName = "Smoke Contact A"
      status = "active"
    }

  $supplierB = Invoke-JsonRequest `
    -Method "Post" `
    -Uri "$ApiBaseUrl/suppliers" `
    -Headers $headers `
    -Body @{
      businessName = "Smoke Supplier B $stamp"
      nit = "SMB$stamp"
      phone = "70000002"
      address = "Smoke Avenue 2"
      contactName = "Smoke Contact B"
      status = "active"
    }

  $product = Invoke-JsonRequest `
    -Method "Post" `
    -Uri "$ApiBaseUrl/products" `
    -Headers $headers `
    -Body @{
      commercialName = "Paracetamol Smoke $stamp"
      genericName = "Paracetamol"
      type = "medicine"
      categoryId = $category.id
      baseUnitId = $baseUnit.id
      supplierId = $supplierA.id
      laboratoryName = "Smoke Laboratory"
      sanitaryRegistration = "RS-$stamp"
      isMedicine = $true
      isOverTheCounter = $true
      requiresPrescription = $false
      isInventoryTracked = $true
      requiresBatch = $true
      requiresExpiration = $true
      minimumStock = 5
      salePrice = 12.50
    }

  $productWithUnit = Invoke-JsonRequest `
    -Method "Put" `
    -Uri "$ApiBaseUrl/products/$($product.id)/units" `
    -Headers $headers `
    -Body @{
      units = @(
        @{
          unitId = $baseUnit.id
          conversionFactor = 1
        }
      )
    }

  $validPurchaseBody = @{
    supplierId = $supplierA.id
    purchaseDate = "2026-05-20"
    notes = "Smoke unique supplier per medicine"
    items = @(
      @{
        productId = $product.id
        unitId = $baseUnit.id
        quantity = 3
        unitCost = 8.25
        batchNumber = "LOT-$stamp"
        expirationDate = "2027-12-31"
      }
    )
  }

  $purchase = Invoke-JsonRequest `
    -Method "Post" `
    -Uri "$ApiBaseUrl/purchases" `
    -Headers $headers `
    -Body $validPurchaseBody

  $receivedPurchase = Invoke-JsonRequest `
    -Method "Post" `
    -Uri "$ApiBaseUrl/purchases/$($purchase.id)/receive" `
    -Headers $headers `
    -Body @{
      receiveNotes = "Smoke receipt completed"
    }

  $invalidPurchaseBody = @{
    supplierId = $supplierB.id
    purchaseDate = "2026-05-20"
    notes = "Smoke wrong supplier"
    items = $validPurchaseBody.items
  }

  $mismatchResponse = Invoke-RawJsonPost `
    -Uri "$ApiBaseUrl/purchases" `
    -Headers $headers `
    -Body $invalidPurchaseBody

  $mismatchContent = $mismatchResponse.Content
  $mismatchBody = $mismatchContent | ConvertFrom-Json
  $mismatchStatus = $mismatchResponse.StatusCode

  if ($mismatchStatus -ne 400) {
    throw "Expected status 400 for supplier mismatch, got $mismatchStatus."
  }

  if ($mismatchBody.code -ne "PRODUCT_SUPPLIER_MISMATCH") {
    throw "Expected PRODUCT_SUPPLIER_MISMATCH, got $($mismatchBody.code) with status $mismatchStatus. Raw response: $mismatchContent"
  }

  [PSCustomObject]@{
    category = $category.name
    supplierA = $supplierA.businessName
    supplierB = $supplierB.businessName
    product = $productWithUnit.commercialName
    productSupplierMatchesSupplierA = ($productWithUnit.supplierId -eq $supplierA.id)
    purchaseStatus = $purchase.status
    receivedStatus = $receivedPurchase.status
    mismatchStatus = $mismatchStatus
    mismatchCode = $mismatchBody.code
    totalAmount = $purchase.totalAmount
  } | ConvertTo-Json -Depth 5
} finally {
  Pop-Location
}
