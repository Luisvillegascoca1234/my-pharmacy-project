import { prisma } from "../../infrastructure/prisma/prisma.client.js";

export class RolesRepository {
  listRoles() {
    return prisma.role.findMany({
      orderBy: {
        displayName: "asc"
      }
    });
  }
}
