import { ChatGroq } from "@langchain/groq";
import { createAgent, tool } from "langchain";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import "dotenv/config";
import { TavilySearch } from "@langchain/tavily";
import z from "zod";
import { writeFileSync } from "node:fs";
import readline from "node:readline/promises";
import { MemorySaver } from "@langchain/langgraph";

async function main() {
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
        query: z
          .string()
          .describe("The query to use in calendar event search."),
      }),
    },
  );
  const model = new ChatGroq({
    model: "openai/gpt-oss-120b",
    temperature: 0,
  });
  const checkpointer = new MemorySaver();

  const agent = createAgent({
    model: model,
    tools: [Search, calendarEvents],
    checkpointer: checkpointer,
  });
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  while (true) {
    const userQuery = await rl.question("You: ");

    if (userQuery === "/bye") break;

    const result = await agent.invoke(
      {
        messages: [
          {
            role: "system",
            content: `You are a personal assistant. Use provided tools to get the information if you don't have it. Current date and time: ${new Date().toUTCString()}`,
          },
          { role: "user", content: userQuery },
        ],
      },
      { configurable: { thread_id: "1" } },
    );
    console.log(result.messages[result.messages.length - 1].content);
    console.log("whole flow=>", result.messages);
  }
  rl.close();

  // const drawableGraphGraphState = await agent.getGraphAsync();
  // const graphStateImage = await drawableGraphGraphState.drawMermaidPng();
  // const graphStateArrayBuffer = await graphStateImage.arrayBuffer();
  // const filePath = "./graphState.png";
  // writeFileSync(filePath, new Uint8Array(graphStateArrayBuffer));
}
main();
