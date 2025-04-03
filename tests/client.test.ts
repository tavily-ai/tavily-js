import { tavily } from "../src/client";

describe("Tavily Client", () => {
  const apiKey = "test-api-key";
  const mockProxies = {
    http: "http://proxy.com",
    https: "https://secure-proxy.com",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Client Instantiation", () => {
    test("should instantiate correctly with API key", () => {
      const client = tavily({ apiKey });
      expect(client).toHaveProperty("search");
      expect(client).toHaveProperty("extract");
      expect(client).toHaveProperty("searchQNA");
      expect(client).toHaveProperty("searchContext");
    });

    test("should throw an error when API key is missing", () => {
      delete process.env.TAVILY_API_KEY;
      expect(() => tavily()).toThrow(
        "No API key provided. Please provide the api_key attribute or set the TAVILY_API_KEY environment variable."
      );
    });

    test("should use proxies from options when provided", () => {
      const client = tavily({ apiKey, proxies: mockProxies });
      expect(client).toBeDefined();
    });

    test("should use proxies from environment variables if no options are given", () => {
      process.env.TAVILY_HTTP_PROXY = "http://env-http-proxy.com";
      process.env.TAVILY_HTTPS_PROXY = "https://env-https-proxy.com";

      const client = tavily({ apiKey });

      expect(client).toBeDefined();
    });
  });
});
