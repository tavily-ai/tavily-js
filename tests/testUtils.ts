import { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from "axios";

export function createAxiosError(
  message: string,
  code: string,
  status: number,
  data: any
): AxiosError {
  const mockResponse: AxiosResponse = {
    data,
    status,
    statusText: `${status} Error`,
    headers: {},
    config: {} as InternalAxiosRequestConfig,
  };

  const error = new AxiosError<unknown, any>(
    message,
    code,
    {} as InternalAxiosRequestConfig,
    null,
    mockResponse
  );

  return error;
}
