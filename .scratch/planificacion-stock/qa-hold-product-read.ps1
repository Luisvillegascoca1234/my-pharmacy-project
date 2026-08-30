$sql = @'
BEGIN;
LOCK TABLE "Product" IN ACCESS EXCLUSIVE MODE;
SELECT pg_sleep(8);
COMMIT;
'@

$sql | docker exec -i pharmacy_pos_postgres psql -U postgres -d pharmacy_pos_qa_planificacion_stock_019f9074
