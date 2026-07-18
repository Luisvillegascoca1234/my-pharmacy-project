import { prisma } from "../../infrastructure/prisma/prisma.client.js";

export class RolesRepository {
  listRoles() {
    return prisma.role.findMany({
      select: {
        id: true,
        name: true
      }
    });
  }
}
