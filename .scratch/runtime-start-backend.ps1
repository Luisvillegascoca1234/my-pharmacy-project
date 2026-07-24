$env:DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/pharmacy_pos_dev_current_20260723?schema=public'
Set-Location 'C:\Proyectos\my-pharmacy-project'
pnpm --filter @pharmacy-pos/backend dev
