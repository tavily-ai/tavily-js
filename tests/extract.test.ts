import { tavily } from "../src/client";
import { TavilyClient } from "../src/types";
import { createAxiosError } from "./testUtils";
import { post } from "../src/utils";

jest.mock("../src/utils", () => {
  const originalUtils = jest.requireActual("../src/utils");
  return {
    ...originalUtils,
    post: jest.fn(),
    DEFAULT_MAX_TOKENS: 1000,
    getMaxTokensFromList: jest.fn((list) => list.slice(0, 5)),
    DEFAULT_CHUNKS_PER_SOURCE: 3,
    handleRequestError: originalUtils.handleRequestError,
  };
});

describe("Tavily Extract API", () => {
  let client: TavilyClient;
  const apiKey = "test-api-key";

  beforeEach(() => {
    client = tavily({ apiKey });
    jest.clearAllMocks();
  });

  it("should extract data successfully from given URLs", async () => {
    const mockResponse = {
      data: {
        response_time: 100,
        results: [
          {
            url: "https://example.com",
            raw_content: "Sample content",
            images: [],
          },
        ],
        failed_results: [],
      },
    };

    (post as jest.Mock).mockResolvedValueOnce(mockResponse);

    const urls = ["https://example.com"];
    const response = await client.extract(urls, { includeImages: true });

    expect(post as jest.Mock).toHaveBeenCalledWith(
      "extract",
      expect.objectContaining({ urls, include_images: true }),
      apiKey,
      undefined, //proxies
      60 //timeout
    );

    expect(response).toEqual({
      responseTime: 100,
      results: [
        {
          url: "https://example.com",
          rawContent: "Sample content",
          images: [],
        },
      ],
      failedResults: [],
    });
  });

  it("should handle failed extractions correctly", async () => {
    const mockResponse = {
      data: {
        response_time: 120,
        results: [],
        failed_results: [{ url: "https://invalid.com", error: "Invalid URL" }],
      },
    };

    (post as jest.Mock).mockResolvedValueOnce(mockResponse);

    const urls = ["https://invalid.com"];
    const response = await client.extract(urls, {});

    expect(response).toEqual({
      responseTime: 120,
      results: [],
      failedResults: [{ url: "https://invalid.com", error: "Invalid URL" }],
    });
  });

  it("should handle API errors correctly using handleRequestError", async () => {
    const mockErrorResponse = createAxiosError("Request failed", "400", 400, {
      detail: { error: "Invalid query parameter" },
    });

    (post as jest.Mock).mockImplementationOnce(() => {
      return Promise.reject(mockErrorResponse);
    });

    await expect(client.extract(["https://invalid.com"], {})).rejects.toThrow(
      "Invalid query parameter"
    );
  });

  it("should throw a generic error when no message is present", async () => {
    const mockErrorResponse = createAxiosError("Server Error", "500", 500, {
      detail: { error: "500 Error: {}" },
    });

    (post as jest.Mock).mockImplementationOnce(() => {
      return Promise.reject(mockErrorResponse);
    });

    await expect(client.extract(["https://invalid.com"], {})).rejects.toThrow(
      "500 Error: {}"
    );
  });

  it("should throw an unexpected error for non-Axios errors", async () => {
    (post as jest.Mock).mockRejectedValue(new Error("Network Error"));

    await expect(client.extract(["https://invalid.com"], {})).rejects.toThrow(
      "An unexpected error occurred while making the request. Error: Error: Network Error"
    );
  });
});
