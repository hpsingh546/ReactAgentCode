import { writeFileSync } from "node:fs";

export async function printGraph(agent, filePath) {
  const drawableGraphGraphState = await agent.getGraphAsync();
  const graphStateImage = await drawableGraphGraphState.drawMermaidPng();
  const graphStateArrayBuffer = await graphStateImage.arrayBuffer();
  writeFileSync(filePath, new Uint8Array(graphStateArrayBuffer));
}
