declare module 'quantize' {
  function quantize(pixels: number[][], maxColors: number): {
    palette: () => number[][];
  };
  export = quantize;
}