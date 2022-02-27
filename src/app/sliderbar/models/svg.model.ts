export interface SvgCircle {
  cx: number | string;
  cy: number | string;
  r?: number | string;
}

export interface SvgLine {
  x1: number | string;
  y1: number | string;
  x2: number | string;
  y2: number | string;
}

export interface SvgText {
  x: number | string;
  y: number | string;
  dx?: number | string;
  dy?: number | string;
  rotate?: boolean | string;
  value: number;
}
