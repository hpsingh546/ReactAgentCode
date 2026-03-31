import { ChatGroq } from "@langchain/groq";
import { createAgent } from "langchain";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import "dotenv/config";
import { TavilySearch } from "@langchain/tavily";

const Search = new TavilySearch({
  maxResults: 5,
  topic: "general",
});
async function main() {
  const model = new ChatGroq({
    model: "openai/gpt-oss-120b",
    temperature: 0,
    maxTokens: undefined,
    maxRetries: 2,
    // other params...
  });
  const agent = createAgent({
    model: model,
    tools: [Search],
  });
  const result = await agent.invoke({
    messages: [{ role: "user", content: "current dow future value" }],
  });
  console.log(result.messages[result.messages.length - 1].content);
}
main();
