import { z } from "zod";
import { BASE_ROLES } from "../constants/roles.js";

export const ROLE_FACULTY_AREAS = [
  "counter_operations",
  "pharmaceutical_catalog",
  "inventory_traceability",
  "supply",
  "administrative_closure_analysis",
  "system_governance"
] as const;

export const ROLE_SCOPE_LEVELS = ["full_access", "operational_access", "own_records_only", "no_access"] as const;

export const RoleNameSchema = z.enum(BASE_ROLES);
export const RoleFacultyAreaSchema = z.enum(ROLE_FACULTY_AREAS);
export const RoleScopeLevelSchema = z.enum(ROLE_SCOPE_LEVELS);

export const RoleFacultySchema = z.object({
  area: RoleFacultyAreaSchema,
  areaLabel: z.string().min(1),
  level: RoleScopeLevelSchema,
  description: z.string().min(1)
});

export const RoleCatalogEntrySchema = z.object({
  id: z.string().min(1),
  name: RoleNameSchema,
  displayName: z.string().min(1),
  responsibility: z.string().min(1),
  faculties: z.array(RoleFacultySchema).length(ROLE_FACULTY_AREAS.length)
});

export const RolesCatalogResponseSchema = z
  .array(RoleCatalogEntrySchema)
  .length(BASE_ROLES.length)
  .superRefine((roles, context) => {
    roles.forEach((role, roleIndex) => {
      if (role.name !== BASE_ROLES[roleIndex]) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Role at index ${roleIndex} must be ${BASE_ROLES[roleIndex]}.`,
          path: [roleIndex, "name"]
        });
      }

      role.faculties.forEach((faculty, facultyIndex) => {
        if (faculty.area !== ROLE_FACULTY_AREAS[facultyIndex]) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Faculty at index ${facultyIndex} must be ${ROLE_FACULTY_AREAS[facultyIndex]}.`,
            path: [roleIndex, "faculties", facultyIndex, "area"]
          });
        }
      });
    });
  });

export type RoleName = z.infer<typeof RoleNameSchema>;
export type RoleFacultyArea = z.infer<typeof RoleFacultyAreaSchema>;
export type RoleScopeLevel = z.infer<typeof RoleScopeLevelSchema>;
export type RoleFaculty = z.infer<typeof RoleFacultySchema>;
export type RoleCatalogEntry = z.infer<typeof RoleCatalogEntrySchema>;
export type RolesCatalogResponse = z.infer<typeof RolesCatalogResponseSchema>;
