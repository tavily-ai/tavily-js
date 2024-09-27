import axios, { AxiosResponse } from "axios";

const BASE_URL = "https://api.tavily.com";

export async function post(
  endpoint: string,
  body: any
): Promise<AxiosResponse> {
  const url = `${BASE_URL}/${endpoint}`;
  return axios.post(url, body);
}
