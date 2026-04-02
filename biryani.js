import {
  END,
  MessagesAnnotation,
  START,
  StateGraph,
} from "@langchain/langgraph";
import { writeFileSync } from "node:fs";

function cutTheVegetable(state) {
  console.log("cutiing the vegetable");
  return state;
}
function boilTheRice(state) {
  console.log("Boiling the rice");
  return state;
}
function addTheSalt(state) {
  console.log("Adding the Salt");
  return state;
}
function testingTheBiryani(state) {
  console.log("Tasting the Biryani");
  return state;
}
function whereToGo() {
  if (true) {
    return "__end__";
  } else {
    return "addTheSalt";
  }
}
const graph = new StateGraph(MessagesAnnotation)
  .addNode("cutTheVegetable", cutTheVegetable) //parameter first string node name second param is function
  .addNode("boilTheRice", boilTheRice)
  .addNode("addTheSalt", addTheSalt)
  .addNode("testingTheBiryani", testingTheBiryani)
  .addEdge(START, "cutTheVegetable") //declare const START = "__start__"; in langgraph file
  .addEdge("cutTheVegetable", "boilTheRice")
  .addEdge("boilTheRice", "addTheSalt")
  .addEdge("addTheSalt", "testingTheBiryani")
  .addConditionalEdges("testingTheBiryani", whereToGo, {
    __end__: END,
    addTheSalt: "addTheSalt",
  });
//graph.addNode()

const biryaniProcess = graph.compile();
async function main() {
  /**
   * Graph visualization
   */
  const drawableGraphGraphState = await biryaniProcess.getGraph();
  const graphStateImage = await drawableGraphGraphState.drawMermaidPng();
  const graphStateArrayBuffer = await graphStateImage.arrayBuffer();

  const filePath = "./biryaniState.png";
  writeFileSync(filePath, new Uint8Array(graphStateArrayBuffer));

  /**
   * Invoke the graph
   */
  const result = await biryaniProcess.invoke({ messages: [] });
  console.log(result);
}
main();
