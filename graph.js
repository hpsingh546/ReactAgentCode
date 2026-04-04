/**
 * 1.Bring in LLM
 * 2.Build thee Graph
 */

import { ChatGroq } from "@langchain/groq";
import {
  END,
  MemorySaver,
  MessagesAnnotation,
  StateGraph,
} from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { TavilySearch } from "@langchain/tavily";
import { tool } from "langchain";
import z from "zod";
import "dotenv/config";
import { printGraph } from "./utils.js";
import readline from "node:readline/promises";

/**
 * Tools
 */
const Search = new TavilySearch({
  maxResults: 5,
  topic: "general",
});
const calendarEvents = tool(
  async ({ query }) => {
    // Google calendar logicheck do i have meetingc goes
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

const tools = [Search, calendarEvents]; //ARRAY OF CUSTOME TOLL
const toolNode = new ToolNode(tools);

const llm = new ChatGroq({
  model: "openai/gpt-oss-120b",
  temperature: 0,
}).bindTools(tools);

async function callModel(state) {
  console.log("calling llm...");
  const resp = await llm.invoke(state.messages); //send all the message to llm
  // console.log("Response from model", resp);
  // console.log("LLm Response=>", resp); // Here, we are appending the LLM's response message to the 'messages' array.

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
  return "__end__";
}
/**
 * Build the graph
 */
const graph = new StateGraph(MessagesAnnotation)
  .addNode("LLM", callModel)
  .addNode("Tools", toolNode)
  .addEdge("__start__", "LLM") //1
  .addEdge("Tools", "LLM")
  .addConditionalEdges("LLM", shouldcontinue, {
    __end__: END,
    Tools: "Tools",
  }); //2
// 3. Initialize MemorySaver
const memory = new MemorySaver();
const app = graph.compile({ checkpointer: memory });
async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const config = { configurable: { thread_id: "conversation-123" } };

  while (true) {
    const userQuery = await rl.question("You: ");

    if (userQuery === "bye") break;

    const result = await app.invoke(
      {
        messages: [{ role: "user", content: userQuery }],
      },
      config,
    );
    const message = result.messages;
    console.log("Ai:", message[message.length - 1].content);
    printGraph(app, "./customeGraph.png");
  }
  rl.close();
}
main();
