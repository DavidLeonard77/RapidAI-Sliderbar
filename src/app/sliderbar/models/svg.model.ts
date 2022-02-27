export interface SvgCircle {
  cx: number;
  cy: number;
  r?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  index?: number;
  class?: string;
}

export interface SvgLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stroke?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  class?: string;
  style?: string;
  marker?: string;
  slope?: number;
}
