/**
 * 1.Bring in LLM
 * 2.Build thee Graph
 */

import { ChatGroq } from "@langchain/groq";
import { END, MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { TavilySearch } from "@langchain/tavily";
import { tool } from "langchain";
import z from "zod";
import "dotenv/config";

/**
 * Tools
 */
const Search = new TavilySearch({
  maxResults: 5,
  topic: "general",
});
const calendarEvents = tool(
  async ({ query }) => {
    // Google calendar logic goes
    return JSON.stringify([
      {
        title: "Meeting with Sujoy",
        date: "9th Aug 2025",
        time: "2 PM",
        location: "Gmeet",
      },
    ]);
  },
  {
    name: "calendarEvents",
    description: "Call to get the calendar events.",
    schema: z.object({
      query: z.string().describe("The query to use in calendar event search."),
    }),
  },
);

const tools = [Search, calendarEvents];
const toolNode = new ToolNode(tools);

const llm = new ChatGroq({
  model: "openai/gpt-oss-120b",
  temperature: 0,
}).bindTools(tools);

async function callModel(state) {
  console.log("calling llm...");
  const resp = await llm.invoke(state.messages); //send all the message to llm
  // console.log("Response from model", resp);
  return { messages: [resp] };
}

/**conditional edge */
function shouldcontinue(state) {
  /**
   * check the previous ai messaage if toolcall return tool
   * else return __end__
   */
  // console.log(state.messages);

  const lastMessage = state.messages[state.messages.length - 1];

  // If the LLM wants to use a tool, go to the "Tools" node
  if (lastMessage.tool_calls?.length > 0) {
    return "Tools";
  }
  // Otherwise, stop
  return "END";
}
/**
 * Build the graph
 */
const graph = new StateGraph(MessagesAnnotation)
  .addNode("LLM", callModel)
  .addNode("Tools", toolNode)
  .addEdge("__start__", "LLM")
  .addEdge("Tools", "LLM")
  .addConditionalEdges("LLM", shouldcontinue);
const app = graph.compile();
async function main() {
  const result = await app.invoke({
    messages: [{ role: "user", content: "delhi current weather" }],
  });
  const message = result.messages;
  console.log("Ai:", message[message.length - 1].content);
}
main();
