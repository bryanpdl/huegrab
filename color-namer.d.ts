declare module 'color-namer' {
  interface ColorName {
    name: string;
    hex: string;
    distance: number;
  }

  interface ColorNames {
    ntc: ColorName[];
    basic: ColorName[];
    roygbiv: ColorName[];
    x11: ColorName[];
    pantone: ColorName[];
  }

  function namer(color: string): ColorNames;
  export = namer;
}