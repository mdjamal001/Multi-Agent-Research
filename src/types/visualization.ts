export type VisualizationType = "bar" | "line" | "pie" | "table";

export interface ChartDataPoint {
  label: string | number;
  value: string | number;
}

export interface Visualization {
  id: string;

  // Section title where this visualization belongs
  section: string;

  type: VisualizationType;

  title: string;

  caption: string;

  xAxis?: string;

  yAxis?: string;

  data: ChartDataPoint[];

  // Filled later by chartRenderer
  imagePath?: string;
}
