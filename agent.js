import { ChatGroq } from "@langchain/groq";
import { createAgent, tool } from "langchain";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import "dotenv/config";
import { TavilySearch } from "@langchain/tavily";
import z from "zod";

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
      name: "get-calendar-events",
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
  const agent = createAgent({
    model: model,
    tools: [Search, calendarEvents],
  });
  const result = await agent.invoke({
    messages: [
      {
        role: "system",
        content: `You are a personal assistant. Use provided tools to get the information if you don't have it. Current date and time: ${new Date().toUTCString()}`,
      },
      { role: "user", content: "iran news today" },
    ],
  });
  console.log(result.messages[result.messages.length - 1].content);
}
main();
