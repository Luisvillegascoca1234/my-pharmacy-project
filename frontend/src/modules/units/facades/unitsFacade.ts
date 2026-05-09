import type { CreateUnit, Unit } from "@pharmacy-pos/shared";
import { unitsApi } from "../api/units-api";

export const unitsFacade = {
  create(input: CreateUnit): Promise<Unit> {
    return unitsApi.createUnit(input);
  },

  getAll(signal?: AbortSignal): Promise<Unit[]> {
    return unitsApi.listUnits(signal);
  }
};
