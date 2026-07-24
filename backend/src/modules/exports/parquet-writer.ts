import {
  Bool,
  DateDay,
  Decimal,
  Int32,
  Table as ArrowTable,
  TimestampMillisecond,
  Utf8,
  vectorFromArray,
  tableToIPC
} from "apache-arrow";
import {
  Compression,
  Table as WasmTable,
  WriterPropertiesBuilder,
  writeParquet
} from "parquet-wasm";
import { Prisma } from "@prisma/client";

type ParquetColumn =
  | { name: string; type: "string"; values: Array<string | null> }
  | { name: string; type: "boolean"; values: Array<boolean | null> }
  | { name: string; type: "date"; values: Array<Date | null> }
  | { name: string; type: "timestamp"; values: Array<Date | null> }
  | { name: string; type: "int32"; values: Array<number | null> }
  | {
      name: string;
      type: "decimal";
      precision: number;
      scale: number;
      values: Array<Prisma.Decimal.Value | null>;
    };

export function writeZstdParquet(input: {
  columns: ParquetColumn[];
  metadata: Record<string, string>;
}): Buffer {
  const vectors = Object.fromEntries(input.columns.map((column) => [
    column.name,
    toArrowVector(column)
  ]));
  const arrowTable = new ArrowTable(vectors);
  const wasmTable = WasmTable.fromIPCStream(tableToIPC(arrowTable, "stream"));
  const writerProperties = new WriterPropertiesBuilder()
    .setCompression(Compression.ZSTD)
    .setCreatedBy("pharmacy-pos stock-planning parquet exporter")
    .setKeyValueMetadata(new Map(Object.entries(input.metadata)))
    .build();

  // parquet-wasm consumes both handles while writing; calling free afterwards
  // attempts to release already-moved Rust values.
  return Buffer.from(writeParquet(wasmTable, writerProperties));
}

function toArrowVector(column: ParquetColumn) {
  switch (column.type) {
    case "string":
      return vectorFromArray(column.values, new Utf8());
    case "boolean":
      return vectorFromArray(column.values, new Bool());
    case "date":
      return vectorFromArray(column.values, new DateDay());
    case "timestamp":
      return vectorFromArray(column.values, new TimestampMillisecond("UTC"));
    case "int32":
      return vectorFromArray(column.values, new Int32());
    case "decimal":
      return vectorFromArray(
        column.values.map((value) => value === null ? null : decimalToArrow(value, column.scale)),
        new Decimal(column.scale, column.precision)
      );
  }
}

function decimalToArrow(value: Prisma.Decimal.Value, scale: number) {
  const scaled = new Prisma.Decimal(value)
    .mul(new Prisma.Decimal(10).pow(scale))
    .toDecimalPlaces(0)
    .toFixed(0);
  let bits = BigInt.asUintN(128, BigInt(scaled));
  const words = new Uint32Array(4);

  for (let index = 0; index < words.length; index += 1) {
    words[index] = Number(bits & 0xffff_ffffn);
    bits >>= 32n;
  }

  return words;
}
