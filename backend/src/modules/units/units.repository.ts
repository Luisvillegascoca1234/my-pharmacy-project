import type { Prisma } from "@prisma/client";
import { prisma } from "../../infrastructure/prisma/prisma.client.js";

export class UnitsRepository {
  listUnits() {
    return prisma.unit.findMany({
      orderBy: {
        name: "asc"
      }
    });
  }

  findUnitByName(name: string) {
    return prisma.unit.findFirst({
      where: {
        name: {
          equals: name,
          mode: "insensitive"
        }
      }
    });
  }

  findUnitByAbbreviation(abbreviation: string) {
    return prisma.unit.findFirst({
      where: {
        abbreviation: {
          equals: abbreviation,
          mode: "insensitive"
        }
      }
    });
  }

  createUnit(input: Prisma.UnitCreateInput) {
    return prisma.unit.create({
      data: input
    });
  }
}
