# Tavily JavaScript SDK

Tavily's JavaScript SDK allows for easy interaction with the Tavily API, offering the full range of our search and extract functionalities directly from your JavaScript and TypeScript programs. Easily integrate smart search and content extraction capabilities into your applications, harnessing the powerful Tavily Search and Tavily Extract APIs.

## Installing

```bash
npm i @tavily/core
```

# Tavily Search

Connect your LLM to the web using the Tavily Search API. Tavily Search is a powerful search engine tailored for use by LLMs in agentic applications.

## Usage

Below is a simple code snippet that shows you how to use Tavily Search. The different steps and components of this code are explained in more detail on the JavaScript [API Reference](https://docs.tavily.com/sdk/get-started/javascript) page.

```javascript
const { tavily } = require("@tavily/core");

// Step 1. Instantiating your Tavily client
const tvly = tavily({ apiKey: "tvly-YOUR_API_KEY" });

// Step 2. Executing a simple search query
const response = await tvly.search("Who is Leo Messi?");

// Step 3. That's it! You've done a Tavily Search!
console.log(response);
```

> To learn more about the different parameters, head to our [JavaScript API Reference](https://docs.tavily.com/sdk/reference/javascript).

# Tavily Extract

The Tavily Extract API allows you to effortlessly retrieve raw content from a list of websites, making it ideal for data collection, content analysis, and research. You can also combine Tavily Extract with our Search method: first, obtain a list of relevant documents, then perform further processing on selected links to gather additional information and use it as context for your research tasks.

## Usage

Below is a simple code snippet demonstrating how to use Tavily Extract. The different steps and components of this code are explained in more detail on the JavaScript [API Reference](https://docs.tavily.com/docs/javascript-sdk/tavily-extract/api-reference) page.

```javascript
const { tavily } = require("@tavily/core");

// Step 1. Instantiating your TavilyClient
const tvly = tavily({ apiKey: "tvly-YOUR_API_KEY" });

// Step 2. Defining the list of URLs to extract content from
const urls = [
  "https://en.wikipedia.org/wiki/Artificial_intelligence",
  "https://en.wikipedia.org/wiki/Machine_learning",
  "https://en.wikipedia.org/wiki/Data_science",
  "https://en.wikipedia.org/wiki/Quantum_computing",
  "https://en.wikipedia.org/wiki/Climate_change",
]; // You can provide up to 20 URLs simultaneously

// Step 3. Executing the extract request
response = await tvly.extract(urls);

// Step 4. Printing the extracted raw content
for (let result of response.results) {
  console.log(`URL: ${result["url"]}`);
  console.log(`Raw Content: ${result["raw_content"]}\n`);
}
// Note that URLs that could not be extracted will be stored in response.failedResults
```

> To learn more about the different parameters, head to our [JavaScript API Reference](https://docs.tavily.com/sdk/reference/javascript).

# Tavily Crawl (Currently in Invitational Beta)

Tavily Crawl is an agent‐first site explorer that leverages breadth‐first crawling to navigate websites. It uses natural-language goals to intelligently uncover deeply buried “needle-in-a-haystack” information or perform high-volume data retrieval across an entire site.

## Usage

Below is a simple code snippet demonstrating how to use Tavily Crawl. The different steps and components of this code are explained in more detail on the JavaScript [API Reference](https://docs.tavily.com/docs/javascript-sdk/tavily-crawl/api-reference) page.

```javascript
const { tavily } = require("@tavily/core");

// Step 1. Instantiating your TavilyClient
const tvly = tavily({ apiKey: "tvly-YOUR_API_KEY" });

// Step 2. Defining the starting URL to crawl
const base_url = "https://en.wikipedia.org/wiki/Artificial_intelligence"

// Step 3. Executing the extract request
response = await tvly.crawl(urls);

// Step 4. Printing the extracted raw content
response.results.forEach(({ url, raw_content }) => {
  console.log(`URL: ${url}`);
  console.log(`Raw Content: ${raw_content}\n`);
});
```

> To learn more about the different parameters, head to our [JavaScript API Reference](https://docs.tavily.com/sdk/reference/javascript).

## Proxies

If you want to use either client with specified HTTP or HTTPS proxies, you can do so by passing the proxies parameter as a dictionary in the format `{ http?: string, https?: string }`, where each key is optional, or by setting the `TAVILY_HTTP_PROXY` or `TAVILY_HTTPS_PROXY` environment variables.

## Cost

Head to the [API Credits Overview](https://docs.tavily.com/guides/api-credits) in our documentation to learn more about how many API Credits each request costs.

## License

This project is licensed under the terms of the MIT license.

## Contact

If you are encountering issues while using Tavily, please email us at [support@tavily.com](mailto:support@tavily.com). We'll be happy to help you.

If you want to stay updated on the latest Tavily news and releases, head to our [Developer Community](https://community.tavily.com) to learn more!
