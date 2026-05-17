import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, onBlur, onChange, onFocus, type, value, ...props }: React.ComponentProps<"input">) {
  const isControlledNumberInput = type === "number" && value !== undefined
  const [numberDisplayValue, setNumberDisplayValue] = React.useState(() => String(value ?? ""))
  const [isNumberFocused, setIsNumberFocused] = React.useState(false)

  React.useEffect(() => {
    if (!isControlledNumberInput) {
      return
    }

    if (isNumberFocused && numberDisplayValue === "") {
      return
    }

    setNumberDisplayValue(String(value ?? ""))
  }, [isControlledNumberInput, isNumberFocused, numberDisplayValue, value])

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (isControlledNumberInput) {
      setNumberDisplayValue(event.target.value)
    }

    onChange?.(event)
  }

  function handleBlur(event: React.FocusEvent<HTMLInputElement>) {
    setIsNumberFocused(false)

    if (isControlledNumberInput && event.target.value === "") {
      setNumberDisplayValue(String(value ?? ""))
    }

    onBlur?.(event)
  }

  function handleFocus(event: React.FocusEvent<HTMLInputElement>) {
    if (isControlledNumberInput) {
      setIsNumberFocused(true)
    }

    onFocus?.(event)
  }

  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      value={isControlledNumberInput ? numberDisplayValue : value}
      onBlur={handleBlur}
      onChange={handleChange}
      onFocus={handleFocus}
      {...props}
    />
  )
}

export { Input }
