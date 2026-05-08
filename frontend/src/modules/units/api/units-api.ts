import { CreateUnitSchema, UnitSchema, type CreateUnit, type Unit } from "@pharmacy-pos/shared";
import { apiRequest } from "@/api/client";

export async function listUnits(token: string, signal?: AbortSignal): Promise<Unit[]> {
  const payload = await apiRequest<Unit[]>("/units", {
    token,
    signal
  });

  return UnitSchema.array().parse(payload);
}

export async function createUnit(token: string, input: CreateUnit): Promise<Unit> {
  const payload = await apiRequest<Unit>("/units", {
    method: "POST",
    token,
    body: CreateUnitSchema.parse(input)
  });

  return UnitSchema.parse(payload);
}
