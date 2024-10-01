# Tavily JavaScript SDK

> We're excited to announce the release of our JavaScript SDK! Please keep in mind that this package is still in Beta, and is therefore subject to change in the future. Please report any bugs and send all feedback to [support@tavily.com](mailto:support@tavily.com) or our [Developer Community](https://community.tavily.com). We're excited to see what you build with Tavily!

Tavily.js allows for easy interaction with the Tavily API, offering the full range of our search and extract functionalities directly from your JavaScript and TypeScript programs. Easily integrate smart search and content extraction capabilities into your applications, harnessing Tavily's powerful search and extract features.

## Installing
```bash
npm i @tavily/core
```

# Tavily Search
Connect your LLM to the web using the Tavily Search API.

## Usage
Below are some code snippets that show you how to interact with our search API. The different steps and components of this code are explained in more detail on the JavaScript [API Reference](https://docs.tavily.com/docs/javascript-sdk/tavily-search/api-reference) page.

### Getting and printing the full Search API response

```javascript
const { tavily } = require("@tavily/core");

// Step 1. Instantiating your Tavily client
const tvly = tavily({ apiKey: "tvly-YOUR_API_KEY" });

// Step 2. Executing a simple search query
const response = await tvly.search("Who is Leo Messi?");

// Step 3. That's it! You've done a Tavily Search!
console.log(response);
```
This is equivalent to directly querying our REST API.


### Generating context for a RAG Application

```javascript
const { tavily } = require("@tavily/core");

// Step 1. Instantiating your Tavily client
const tvly = tavily({ apiKey: "tvly-YOUR_API_KEY" });

// Step 2. Executing a context search query
const context = tvly.searchContext("What happened during the Burning Man floods?");

// Step 3. That's it! You now have a context string that you can feed directly into your RAG Application
console.log(response);
```
This is how you can generate precise and fact-based context for your RAG application in one line of code.

### Getting a quick answer to a question
```javascript
const { tavily } = require("@tavily/core");

// Step 1. Instantiating your Tavily client
const tvly = tavily({ apiKey: "tvly-YOUR_API_KEY" });

// Step 2. Executing a Q&A search query
const answer = tvly.searchQNA("Who is Leo Messi?");

// Step 3. That's it! Your question has been answered!
console.log(answer);
```
This is how you get accurate and concise answers to questions, in one line of code. Perfect for usage by LLMs!

# Tavily Extract

> We’re excited to announce the release of the Tavily Extract feature! This feature is still in beta, so please report any bugs or send feedback to [support@tavily.com](mailto:support@tavily.com). 

The Tavily Extract API allows you to effortlessly retrieve raw content from a list of websites, making it ideal for data collection, content analysis, and research. You can also combine Tavily Extract with our Search method: first, obtain a list of relevant documents, then perform further processing on selected links to gather additional information and use it as context for your research tasks.

Please note that for every 5 successful URL extractions, 1 API credit is deducted from your account. We look forward to seeing what you build with it!


## Usage
Below are some code snippets demonstrating how to interact with the Tavily Extract API. The different steps and components of this code are explained in more detail on the JavaScript [API Reference](https://docs.tavily.com/docs/javascript-sdk/tavily-extract/api-reference) page.

### Extracting Raw Content from Multiple URLs using Tavily Extract API

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
    "https://en.wikipedia.org/wiki/Climate_change"
] // You can provide up to 20 URLs simultaneously

// Step 3. Executing the extract request
response = await tvly.extract(urls)

// Step 4. Printing the extracted raw content
for (let result of response.results) {
    console.log(`URL: ${result['url']}`)
    console.log(`Raw Content: ${result['raw_content']}\n`)
}
// Note that URLs that could not be extracted will be stored in response.failedResults
```

## 📝 License

This project is licensed under the terms of the MIT license.

## 💌 Contact

If you are encountering issues while using Tavily, please email us at [support@tavily.com](mailto:support@tavily.com). We'll be happy to help you.

If you want to stay updated on the latest Tavily news and releases, head to our [Developer Community](https://community.tavily.com) to learn more!