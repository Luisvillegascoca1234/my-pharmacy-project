import type { CreateUnit, Unit } from "@pharmacy-pos/shared";
import { axiosApi } from "@/api";

export const unitsApi = {
  async listUnits(signal?: AbortSignal): Promise<Unit[]> {
    const response = await axiosApi.get<Unit[]>("/units", {
      signal
    });

    return response.data;
  },

  async createUnit(input: CreateUnit): Promise<Unit> {
    const response = await axiosApi.post<Unit>("/units", input);

    return response.data;
  }
};
