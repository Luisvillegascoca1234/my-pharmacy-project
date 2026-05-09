import axios, { AxiosHeaders, type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { ApiError } from "./ApiError";
import { getAccessToken, handleUnauthorized } from "./authTokenProvider";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

declare module "axios" {
  export interface AxiosRequestConfig {
    skipAuth?: boolean;
    skipDevErrorLog?: boolean;
    skipUnauthorizedRedirect?: boolean;
  }
}

type ApiErrorResponse = {
  code?: unknown;
  details?: unknown;
  message?: unknown;
};

export const axiosApi = axios.create({
  baseURL: API_URL,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json"
  }
});

function isApiErrorResponse(data: unknown): data is ApiErrorResponse {
  return typeof data === "object" && data !== null && "message" in data;
}

function transformError(error: AxiosError): ApiError | AxiosError {
  if (!error.response) {
    return new ApiError({
      code: "NETWORK_ERROR",
      message: "No se pudo conectar con el servidor.",
      statusCode: 0
    });
  }

  const data = error.response.data;

  if (isApiErrorResponse(data)) {
    return new ApiError({
      code: typeof data.code === "string" ? data.code : undefined,
      details: data.details,
      message: typeof data.message === "string" ? data.message : `La solicitud falló con estado ${error.response.status}`,
      statusCode: error.response.status
    });
  }

  return new ApiError({
    message: `La solicitud falló con estado ${error.response.status}`,
    statusCode: error.response.status
  });
}

axiosApi.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const headers = AxiosHeaders.from(config.headers);

    if (!config.skipAuth) {
      const token = await getAccessToken();

      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      } else {
        headers.delete("Authorization");
      }
    }

    config.headers = headers;

    return config;
  },
  (error) => Promise.reject(error)
);

axiosApi.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isCancel(error)) {
      return Promise.reject(new DOMException("Request aborted", "AbortError"));
    }

    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401 && !error.config?.skipUnauthorizedRedirect) {
        handleUnauthorized();
      }

      return Promise.reject(transformError(error));
    }

    return Promise.reject(error);
  }
);
