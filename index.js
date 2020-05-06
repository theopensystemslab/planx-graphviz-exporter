const graphviz = require("graphviz");
const fs = require("fs").promises;
const axios = require("axios");
const { random } = require("@ctrl/tinycolor");

async function getData(url) {
  const filename = "data.json";
  try {
    const file = await fs.readFile(filename);
    return JSON.parse(file);
  } catch (e) {
    const { data } = await axios.get(url);
    await fs.writeFile(filename, JSON.stringify(data));
    return data;
  }
}

const opts = {
  100: {
    shape: "box",
  },
  200: {},
  300: {},
};

async function makeGraph() {
  const flow = await getData("https://data.planx.in/southwark.json");

  const g = graphviz.digraph("G");

  const colors = {};

  flow.edges.forEach(({ src, tgt }) => {
    [src, tgt].forEach((id) => {
      colors[id] = colors[id] || random({ luminosity: "dark" });

      const color = flow.nodes[src] ? colors[src].toHexString() : undefined;

      const label = flow.nodes[id] ? flow.nodes[id].text : undefined;
      const extras = flow.nodes[id] ? opts[flow.nodes[id].$t] : undefined;

      g.addNode(id || "null", { label, color, ...extras });
    });
    g.addEdge(src || "null", tgt, { color: colors[src].toHexString() });
  });

  console.log("generating graph.pdf...");
  g.output("pdf", "graph.pdf");

  console.log("generating graph.svg...");
  g.output("svg", "graph.svg");
}

makeGraph();
