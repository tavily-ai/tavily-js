import {
  TavilyResearchOptions,
  TavilyResearchFunction,
  TavilyGetResearchFunction,
  TavilyRequestConfig,
  TavilyGetResearchIncompleteStatusResponse,
  TavilyGetResearchResponse,
} from "./types";
import { post, get, handleRequestError, handleTimeoutError } from "./utils";
import { AxiosError, AxiosResponse } from "axios";
import { Readable } from "stream";

export function _research(requestConfig: TavilyRequestConfig): TavilyResearchFunction {
  return async function research(
    input: string,
    options: Partial<TavilyResearchOptions> = {}
  ) {
    const { model, outputSchema, stream, citationFormat, timeout, sessionId, humanId, clientName, ...kwargs } =
      options;

    const callConfig: TavilyRequestConfig = {
      ...requestConfig,
      ...(sessionId !== undefined && { sessionId }),
      ...(humanId !== undefined && { humanId }),
      ...(clientName !== undefined && { clientName }),
    };

    if (stream) {
      try {
        const response = await post(
          "research",
          {
            input: input,
            model,
            output_schema: outputSchema,
            stream: stream,
            citation_format: citationFormat,
            ...kwargs,
          },
          callConfig,
          timeout,
          "stream"
        );

        async function* streamGenerator(): AsyncGenerator<
          Buffer,
          void,
          unknown
        > {
          const stream = response.data as Readable;
          try {
            for await (const chunk of stream) {
              if (chunk) {
                yield chunk;
              }
            }
          } finally {
            if (!stream.destroyed) {
              stream.destroy();
            }
          }
        }

        return streamGenerator();
      } catch (err) {
        if (err instanceof AxiosError) {
          if (err.code === "ECONNABORTED") {
            handleTimeoutError(timeout || 0);
          }
          if (err.response) {
            handleRequestError(err.response as AxiosResponse);
          }
        }
        throw new Error(
          `An unexpected error occurred while making the request. Error: ${err}`
        );
      }
    } else {
      try {
        const response = await post(
          "research",
          {
            input,
            model,
            output_schema: outputSchema,
            stream,
            citation_format: citationFormat,
            ...kwargs,
          },
          callConfig,
          timeout
        );

        return {
          requestId: response.data.request_id,
          createdAt: response.data.created_at,
          status: response.data.status,
          input: response.data.input,
          model: response.data.model,
          responseTime: response.data.response_time,
        };
      } catch (err) {
        if (err instanceof AxiosError) {
          if (err.code === "ECONNABORTED") {
            handleTimeoutError(timeout || 0);
          }
          if (err.response) {
            handleRequestError(err.response as AxiosResponse);
          }
        }
        throw new Error(
          `An unexpected error occurred while making the request. Error: ${err}`
        );
      }
    }
  };
}

export function _getResearch(requestConfig: TavilyRequestConfig): TavilyGetResearchFunction {
  return async function getResearch(requestId: string) {
    const requestTimeout = 60; // Default timeout for GET requests

    try {
      const response = await get(
        `research/${requestId}`,
        requestConfig,
        requestTimeout
      );
      return response.data as
        | TavilyGetResearchResponse
        | TavilyGetResearchIncompleteStatusResponse;
    } catch (err) {
      if (err instanceof AxiosError) {
        if (err.code === "ECONNABORTED") {
          handleTimeoutError(requestTimeout);
        }
        if (err.response) {
          handleRequestError(err.response as AxiosResponse);
        }
      }
      throw new Error(
        `An unexpected error occurred while making the request. Error: ${err}`
      );
    }
  };
}
