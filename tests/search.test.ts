import { tavily } from "../src/client";
import { post } from "../src/utils";
import { TavilyClient } from "../src/types";
import { createAxiosError } from "./testUtils";

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

describe("Tavily Search API", () => {
  let client: TavilyClient;
  const apiKey = "test-api-key";

  beforeEach(() => {
    client = tavily({ apiKey });
    jest.clearAllMocks();
  });

  it("search() should return formatted results", async () => {
    (post as jest.Mock).mockResolvedValue({
      data: {
        response_time: 200,
        images: [{ url: "http://image.com", description: "An image" }],
        results: [
          {
            title: "Example Title",
            url: "http://example.com",
            content: "Example content",
            raw_content: "Raw example content",
            score: 0.9,
            published_date: "2025-04-01",
          },
        ],
        answer: "This is a test answer",
      },
    });

    const client = tavily({ apiKey });
    const result = await client.search("test query", {});

    expect(post).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      query: "test query",
      responseTime: 200,
      images: [{ url: "http://image.com", description: "An image" }],
      results: [
        {
          title: "Example Title",
          url: "http://example.com",
          content: "Example content",
          rawContent: "Raw example content",
          score: 0.9,
          publishedDate: "2025-04-01",
        },
      ],
      answer: "This is a test answer",
    });
  });

  it("searchQNA() should return an answer", async () => {
    (post as jest.Mock).mockResolvedValue({
      data: { answer: "Sample QNA Answer" },
    });

    const client = tavily({ apiKey });
    const result = await client.searchQNA("test QNA query", {});

    expect(post).toHaveBeenCalledTimes(1);
    expect(result).toBe("Sample QNA Answer");
  });

  it("searchContext() should return processed context", async () => {
    (post as jest.Mock).mockResolvedValue({
      data: {
        results: [
          { url: "http://source1.com", content: "Content 1" },
          { url: "http://source2.com", content: "Content 2" },
        ],
      },
    });

    const client = tavily({ apiKey });
    const result = await client.searchContext("test context query", {});

    expect(post).toHaveBeenCalledTimes(1);
    expect(JSON.parse(result)).toEqual([
      { url: "http://source1.com", content: "Content 1" },
      { url: "http://source2.com", content: "Content 2" },
    ]);
  });

  it("should handle API errors correctly using handleRequestError", async () => {
    const mockErrorResponse = createAxiosError("Request failed", "400", 400, {
      detail: { error: "Invalid query parameter" },
    });

    (post as jest.Mock).mockRejectedValue(mockErrorResponse);

    await expect(client.search("test query", {})).rejects.toThrow(
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

    await expect(client.search("test query", {})).rejects.toThrow(
      "500 Error: {}"
    );
  });

  it("should throw an unexpected error for non-Axios errors", async () => {
    (post as jest.Mock).mockRejectedValue(new Error("Network Error"));

    await expect(client.search("test query", {})).rejects.toThrow(
      "An unexpected error occurred while making the request. Error: Error: Network Error"
    );
  });
});
