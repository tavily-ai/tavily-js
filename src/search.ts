import { searchParameters } from "./parameters";
import {
  TavilySearchOptions,
  TavilySearchFuncton,
} from "./types";
import { TavilyTransport } from "./transport";
import { identityHeaders } from "./headers";

// Map declared Search fields only; explicit API names and unknown extras win.
function serializeSearchParameters(parameters: Record<string, unknown>) {
  const extras = { ...parameters };
  const body: Record<string, unknown> = {};
  for (const name of Object.keys(searchParameters)) {
    const apiName = name.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    body[apiName] = parameters[name];
    delete extras[name];
  }
  return { ...body, ...extras };
}

export function _search(transport: TavilyTransport): TavilySearchFuncton {
  return async function search(
    query: string,
    options: Partial<TavilySearchOptions> = {}
  ) {
    const { maxHours, timeout, sessionId, humanId, clientName, ...parameters } = options;

    const requestTimeout = timeout ?? 60; // Default to 60s

    const data: any = await transport.post(
      "search",
      serializeSearchParameters({
        query,
        ...parameters,
        maxAgeHours: parameters.maxAgeHours ?? maxHours,
      }),
      { timeoutSeconds: requestTimeout, headers: identityHeaders({ sessionId, humanId, clientName }) }
    );

    return {
      query,
      responseTime: data.response_time,
      images: data.images.map((image: any) => {
        return {
          url: image?.url || image,
          description: image.description,
        };
      }),
      results: data.results.map((result: any) => {
        return {
          title: result.title,
          url: result.url,
          content: result.content,
          rawContent: result.raw_content,
          score: result.score,
          publishedDate: result.published_date,
          favicon: result.favicon,
          id: result.id,
          images: (Array.isArray(result.images) ? result.images : [])
            .map((image: any) => ({
              url: typeof image === "string" ? image : image?.url,
              description:
                typeof image?.description === "string"
                  ? image.description
                  : undefined,
            }))
            .filter(({ url }: { url: unknown }) =>
              typeof url === "string" && url.trim().length > 0
            ),
        };
      }),
      answer: data.answer,
      requestId: data.request_id,
      ...(data.usage !== undefined && { usage: data.usage }),
      ...(data.auto_parameters && {
        autoParameters: {
          includeDomains: data.auto_parameters?.include_domains,
          excludeDomains: data.auto_parameters?.exclude_domains,
          topic: data.auto_parameters?.topic,
          timeRange: data.auto_parameters?.time_range,
          searchDepth: data.auto_parameters?.search_depth,
        },
      }),
    };
  };
}
