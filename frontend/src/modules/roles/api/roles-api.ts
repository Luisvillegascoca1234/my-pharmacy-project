import { axiosApi } from "@/api";

export const rolesApi = {
  async listRoles(signal?: AbortSignal): Promise<unknown> {
    const response = await axiosApi.get<unknown>("/roles", { signal });

    return response.data;
  }
};
