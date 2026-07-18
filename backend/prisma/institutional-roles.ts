import { FIXED_ROLE_CATALOG, type RoleName } from "@pharmacy-pos/shared";

export type InstitutionalRoleRecord = {
  id: string;
  name: RoleName;
  displayName: string;
};

export interface InstitutionalRoleClient {
  upsert(input: {
    where: { name: RoleName };
    update: { displayName: string };
    create: { name: RoleName; displayName: string };
  }): Promise<InstitutionalRoleRecord>;
}

export function synchronizeInstitutionalRoles(roleClient: InstitutionalRoleClient) {
  return Promise.all(
    FIXED_ROLE_CATALOG.map((role) =>
      roleClient.upsert({
        where: { name: role.name },
        update: { displayName: role.displayName },
        create: { name: role.name, displayName: role.displayName }
      })
    )
  );
}
