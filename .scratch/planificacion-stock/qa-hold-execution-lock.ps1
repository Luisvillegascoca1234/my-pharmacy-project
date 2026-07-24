$sql = @'
BEGIN;
SELECT pg_advisory_xact_lock(730120260723);
SELECT pg_sleep(12);
COMMIT;
'@

$sql | docker exec -i pharmacy_pos_postgres psql -U postgres -d pharmacy_pos_qa_planificacion_stock_019f9074
