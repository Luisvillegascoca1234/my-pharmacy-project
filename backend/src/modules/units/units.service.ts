import type { CreateUnit, Unit } from "@pharmacy-pos/shared";
import { HttpError } from "../../common/http/http-error.js";
import { UnitsRepository } from "./units.repository.js";

export class UnitsService {
  constructor(private readonly unitsRepository = new UnitsRepository()) {}

  async listUnits(): Promise<Unit[]> {
    const units = await this.unitsRepository.listUnits();

    return units.map(toUnit);
  }

  async createUnit(input: CreateUnit): Promise<Unit> {
    const [existingName, existingAbbreviation] = await Promise.all([
      this.unitsRepository.findUnitByName(input.name),
      this.unitsRepository.findUnitByAbbreviation(input.abbreviation)
    ]);

    if (existingName) {
      throw new HttpError(409, "Unit name is already in use.", "UNIT_NAME_IN_USE");
    }

    if (existingAbbreviation) {
      throw new HttpError(409, "Unit abbreviation is already in use.", "UNIT_ABBREVIATION_IN_USE");
    }

    const unit = await this.unitsRepository.createUnit({
      name: input.name,
      abbreviation: input.abbreviation,
      description: input.description
    });

    return toUnit(unit);
  }
}

function toUnit(unit: {
  id: string;
  name: string;
  abbreviation: string;
  description: string | null;
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}): Unit {
  return {
    id: unit.id,
    name: unit.name,
    abbreviation: unit.abbreviation,
    description: unit.description ?? undefined,
    status: unit.status,
    createdAt: unit.createdAt.toISOString(),
    updatedAt: unit.updatedAt.toISOString()
  };
}
