import { prisma } from "../../infrastructure/prisma/prisma.client.js";

export class HealthRepository {
  async checkDatabaseConnection(): Promise<void> {
    await prisma.$queryRaw`SELECT 1`;
  }
}
