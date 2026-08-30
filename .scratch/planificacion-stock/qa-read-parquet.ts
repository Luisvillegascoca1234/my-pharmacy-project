import { readFile } from "node:fs/promises";
import { tableFromIPC } from "apache-arrow";
import { ParquetFile, readParquet } from "parquet-wasm";

async function main() {
  for (const fileName of process.argv.slice(2)) {
    const bytes = new Uint8Array(await readFile(fileName));
    const parquetFile = await ParquetFile.fromFile(new Blob([bytes]));
    const parquetMetadata = parquetFile.metadata();
    const metadata = Object.fromEntries(
      parquetMetadata.fileMetadata().keyValueMetadata() as Map<string, string>
    );
    const compressions = [...new Set(
      parquetMetadata.rowGroups().flatMap((group) =>
        group.columns().map((column) => column.compression())
      )
    )];
    const table = tableFromIPC(readParquet(bytes).intoIPCStream());
    console.log(JSON.stringify({
      fileName,
      rows: table.numRows,
      schema: table.schema.fields.map((field) => ({
        name: field.name,
        type: field.type.toString(),
        nullable: field.nullable
      })),
      metadata,
      compressions
    }, null, 2));
    parquetFile.free();
  }
}

void main();
