const graphviz = require("graphviz");
const fs = require("fs").promises;
const axios = require("axios");
const { random } = require("@ctrl/tinycolor");

async function getData(localAuthority) {
  const filename = `in/${localAuthority}.json`;
  try {
    // check if file has been downloaded already
    const file = await fs.readFile(filename);
    return JSON.parse(file);
  } catch (e) {
    // if not, download and save it
    const { data } = await axios.get(
      `https://data.planx.in/${localAuthority}.json`
    );
    await fs.writeFile(filename, JSON.stringify(data));
    return data;
  }
}

const types = {
  100: {
    // question
    shape: "box",
  },
  200: {
    // response
  },
  300: {
    // portal / group
  },
};

function generate(g, localAuthority, filetype) {
  return new Promise(function (res, rej) {
    const file = `out/${localAuthority}.${filetype}`;
    console.log(`generating ${file}...`);
    g.output(filetype, file, function (err) {
      if (err) rej(err);
      res();
    });
  });
}

async function makeGraph(localAuthority) {
  const flow = await getData(localAuthority);

  const g = graphviz.digraph("G");

  const colors = {};

  flow.edges.forEach(({ src, tgt }) => {
    [src, tgt].forEach((id) => {
      colors[id] = colors[id] || random({ luminosity: "dark" });

      const color = flow.nodes[src] ? colors[src].toHexString() : undefined;

      const label = flow.nodes[id] ? flow.nodes[id].text : undefined;
      const extras = flow.nodes[id] ? types[flow.nodes[id].$t] : undefined;

      g.addNode(id || "null", { label, color, ...extras });
    });
    g.addEdge(src || "null", tgt, { color: colors[src].toHexString() });
  });

  await Promise.all([
    generate(g, localAuthority, "pdf"),
    generate(g, localAuthority, "svg"),
  ]);
}

makeGraph("southwark");
