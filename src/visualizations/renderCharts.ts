import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import fs from "node:fs/promises";
import path from "node:path";

import { Visualization } from "../types/visualization";
import { ChartConfiguration, ChartOptions } from "chart.js";

const width = 900;
const height = 500;

const chartJSNodeCanvas = new ChartJSNodeCanvas({
  width,
  height,
  backgroundColour: "white",
});

const OUTPUT_DIR = "./reports/assets";

export async function renderCharts(visualizations: Visualization[]) {
  await fs.mkdir(OUTPUT_DIR, {
    recursive: true,
  });

  for (const visualization of visualizations) {
    if (visualization.type === "table") continue;

    const labels = visualization.data.map((row) => String(row.label));

    const values = visualization.data.map((row) =>
      typeof row.value === "number" ? row.value : Number(row.value)
    );

    const options: ChartOptions =
      visualization.type === "pie"
        ? {
            responsive: false,

            plugins: {
              title: {
                display: true,
                text: visualization.title,
                font: {
                  size: 18,
                  weight: "bold",
                },
              },

              legend: {
                display: true,
                position: "right",
              },
            },
          }
        : {
            responsive: false,

            scales: {
              x: {
                title: {
                  display: !!visualization.xAxis,
                  text: visualization.xAxis,
                  font: {
                    size: 14,
                    weight: "bold",
                  },
                },
              },

              y: {
                beginAtZero: true,

                title: {
                  display: !!visualization.yAxis,
                  text: visualization.yAxis,
                  font: {
                    size: 14,
                    weight: "bold",
                  },
                },
              },
            },

            plugins: {
              title: {
                display: true,
                text: visualization.title,
                font: {
                  size: 18,
                  weight: "bold",
                },
              },

              legend: {
                display: false,
              },
            },
          };

    const configuration: ChartConfiguration = {
      type: visualization.type,
      data: {
        labels,
        datasets: [
          {
            label: visualization.title,
            data: values,

            borderWidth: 2,

            borderRadius: 6,

            tension: 0.3,

            fill: false,
          },
        ],
      },
      options,
    };

    const buffer = await chartJSNodeCanvas.renderToBuffer(configuration);

    const imagePath = path.join(OUTPUT_DIR, `${visualization.id}.png`);

    await fs.writeFile(imagePath, buffer);

    console.log("Image output Path: ", imagePath);

    visualization.imagePath = imagePath;
  }

  return visualizations;
}
