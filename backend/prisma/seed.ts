async function main() {
  console.log("Seed completed. No domain data is required for the foundation chunk.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
