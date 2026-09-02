import * as RadixColors from "@radix-ui/colors";
import BezierEasing from "bezier-easing";
import Color from "colorjs.io";

import type { HexColor, ThemeMode } from "../types";
import { normalizeHex } from "./parse";

type ArrayOf12<T> = [T, T, T, T, T, T, T, T, T, T, T, T];

const arrayOf12 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;
const grayScaleNames = ["gray", "mauve", "slate", "sage", "olive", "sand"] as const;
const scaleNames = [
  ...grayScaleNames,
  "tomato",
  "red",
  "ruby",
  "crimson",
  "pink",
  "plum",
  "purple",
  "violet",
  "iris",
  "indigo",
  "blue",
  "cyan",
  "teal",
  "jade",
  "green",
  "grass",
  "brown",
  "orange",
  "sky",
  "mint",
  "lime",
  "yellow",
  "amber",
] as const;

type ScaleName = (typeof scaleNames)[number];

const lightScales = {
  gray: RadixColors.grayP3,
  mauve: RadixColors.mauveP3,
  slate: RadixColors.slateP3,
  sage: RadixColors.sageP3,
  olive: RadixColors.oliveP3,
  sand: RadixColors.sandP3,
  tomato: RadixColors.tomatoP3,
  red: RadixColors.redP3,
  ruby: RadixColors.rubyP3,
  crimson: RadixColors.crimsonP3,
  pink: RadixColors.pinkP3,
  plum: RadixColors.plumP3,
  purple: RadixColors.purpleP3,
  violet: RadixColors.violetP3,
  iris: RadixColors.irisP3,
  indigo: RadixColors.indigoP3,
  blue: RadixColors.blueP3,
  cyan: RadixColors.cyanP3,
  teal: RadixColors.tealP3,
  jade: RadixColors.jadeP3,
  green: RadixColors.greenP3,
  grass: RadixColors.grassP3,
  brown: RadixColors.brownP3,
  orange: RadixColors.orangeP3,
  sky: RadixColors.skyP3,
  mint: RadixColors.mintP3,
  lime: RadixColors.limeP3,
  yellow: RadixColors.yellowP3,
  amber: RadixColors.amberP3,
} satisfies Record<ScaleName, Record<string, string>>;

const darkScales = {
  gray: RadixColors.grayDarkP3,
  mauve: RadixColors.mauveDarkP3,
  slate: RadixColors.slateDarkP3,
  sage: RadixColors.sageDarkP3,
  olive: RadixColors.oliveDarkP3,
  sand: RadixColors.sandDarkP3,
  tomato: RadixColors.tomatoDarkP3,
  red: RadixColors.redDarkP3,
  ruby: RadixColors.rubyDarkP3,
  crimson: RadixColors.crimsonDarkP3,
  pink: RadixColors.pinkDarkP3,
  plum: RadixColors.plumDarkP3,
  purple: RadixColors.purpleDarkP3,
  violet: RadixColors.violetDarkP3,
  iris: RadixColors.irisDarkP3,
  indigo: RadixColors.indigoDarkP3,
  blue: RadixColors.blueDarkP3,
  cyan: RadixColors.cyanDarkP3,
  teal: RadixColors.tealDarkP3,
  jade: RadixColors.jadeDarkP3,
  green: RadixColors.greenDarkP3,
  grass: RadixColors.grassDarkP3,
  brown: RadixColors.brownDarkP3,
  orange: RadixColors.orangeDarkP3,
  sky: RadixColors.skyDarkP3,
  mint: RadixColors.mintDarkP3,
  lime: RadixColors.limeDarkP3,
  yellow: RadixColors.yellowDarkP3,
  amber: RadixColors.amberDarkP3,
} satisfies Record<ScaleName, Record<string, string>>;

function colorScale(name: string, mode: ThemeMode): ArrayOf12<string> {
  const values = (mode === "dark" ? darkScales : lightScales)[name as ScaleName];
  if (!values) throw new Error(`Radix scale '${name}' is unavailable`);
  const scale = Object.values(values);
  if (scale.length !== 12) throw new Error(`Radix scale '${name}' must have 12 steps`);
  return scale as ArrayOf12<string>;
}

function oklchScale(name: string, mode: ThemeMode): ArrayOf12<Color> {
  return colorScale(name, mode).map((str) => new Color(str).to("oklch")) as ArrayOf12<Color>;
}

const scaleCache = new Map<ThemeMode, Record<string, ArrayOf12<Color>>>();

function allScales(mode: ThemeMode): Record<string, ArrayOf12<Color>> {
  let scales = scaleCache.get(mode);
  if (!scales) {
    scales = Object.fromEntries(scaleNames.map((name) => [name, oklchScale(name, mode)]));
    scaleCache.set(mode, scales);
  }
  return scales;
}

function grayScales(mode: ThemeMode): Record<string, ArrayOf12<Color>> {
  const scales = allScales(mode);
  return Object.fromEntries(grayScaleNames.map((name) => [name, scales[name]!]));
}

function toHexScale(scale: ArrayOf12<Color>, label: string): ArrayOf12<HexColor> {
  return scale.map((color, index) =>
    normalizeHex(color.to("srgb").toString({ format: "hex" }), `${label}.${index + 1}`),
  ) as ArrayOf12<HexColor>;
}

export function generateRadixColors({
  appearance,
  background,
  gray,
  accent,
}: {
  appearance: ThemeMode;
  accent: HexColor;
  gray: HexColor;
  background: HexColor;
}): {
  accentScale: ArrayOf12<HexColor>;
  grayScale: ArrayOf12<HexColor>;
  accentContrast: HexColor;
} {
  const backgroundColor = new Color(background).to("oklch");
  const grayBaseColor = new Color(gray).to("oklch");
  const grayScaleColors = getScaleFromColor(grayBaseColor, grayScales(appearance), backgroundColor);
  const accentBaseColor = new Color(accent).to("oklch");

  let accentScaleColors = getScaleFromColor(
    accentBaseColor,
    allScales(appearance),
    backgroundColor,
  );

  const accentBaseHex = accentBaseColor.to("srgb").toString({ format: "hex" });
  if (accentBaseHex === "#000" || accentBaseHex === "#fff") {
    accentScaleColors = grayScaleColors.map((color) => color.clone()) as ArrayOf12<Color>;
  }

  const [accent9Color, accentContrastColor] = getStep9Colors(accentScaleColors, accentBaseColor);
  accentScaleColors[8] = accent9Color;
  accentScaleColors[9] = getButtonHoverColor(accent9Color, [accentScaleColors]);

  accentScaleColors[10].coords[1] = Math.min(
    Math.max(accentScaleColors[8].coords[1] ?? 0, accentScaleColors[7].coords[1] ?? 0),
    accentScaleColors[10].coords[1] ?? 0,
  );
  accentScaleColors[11].coords[1] = Math.min(
    Math.max(accentScaleColors[8].coords[1] ?? 0, accentScaleColors[7].coords[1] ?? 0),
    accentScaleColors[11].coords[1] ?? 0,
  );

  return {
    accentScale: toHexScale(accentScaleColors, "accent"),
    grayScale: toHexScale(grayScaleColors, "gray"),
    accentContrast: normalizeHex(
      accentContrastColor.to("srgb").toString({ format: "hex" }),
      "accentContrast",
    ),
  };
}

function getStep9Colors(scale: ArrayOf12<Color>, accentBaseColor: Color): [Color, Color] {
  const referenceBackgroundColor = scale[0];
  const distance = accentBaseColor.deltaEOK(referenceBackgroundColor) * 100;

  if (distance < 25) {
    return [scale[8], getTextColor(scale[8])];
  }

  return [accentBaseColor, getTextColor(accentBaseColor)];
}

function getButtonHoverColor(source: Color, scales: ArrayOf12<Color>[]): Color {
  const [lightness, chroma, hue] = source.coords;
  const newLightness =
    lightness > 0.4 ? lightness - 0.03 / (lightness + 0.1) : lightness + 0.03 / (lightness + 0.1);
  const newChroma = lightness > 0.4 && !Number.isNaN(hue) ? chroma * 0.93 : chroma;
  const buttonHoverColor = new Color("oklch", [newLightness, newChroma, hue]);

  let closestColor = buttonHoverColor;
  let minDistance = Infinity;

  for (const scale of scales) {
    for (const color of scale) {
      const distance = buttonHoverColor.deltaEOK(color);
      if (distance < minDistance) {
        minDistance = distance;
        closestColor = color;
      }
    }
  }

  buttonHoverColor.coords[1] = closestColor.coords[1] ?? 0;
  buttonHoverColor.coords[2] = closestColor.coords[2] ?? 0;
  return buttonHoverColor;
}

function getScaleFromColor(
  source: Color,
  scales: Record<string, ArrayOf12<Color>>,
  backgroundColor: Color,
): ArrayOf12<Color> {
  const allColors: { scale: string; color: Color; distance: number }[] = [];

  for (const [name, scale] of Object.entries(scales)) {
    for (const color of scale) {
      const distance = source.deltaEOK(color);
      allColors.push({ scale: name, distance, color });
    }
  }

  allColors.sort((a, b) => a.distance - b.distance);

  const closestColors = allColors.filter(
    (color, index, arr) => index === arr.findIndex((value) => value.scale === color.scale),
  );

  const grayScaleNamesStr = grayScaleNames as readonly string[];
  const allAreGrays = closestColors.every((color) => grayScaleNamesStr.includes(color.scale));
  if (!allAreGrays && grayScaleNamesStr.includes(closestColors[0]?.scale ?? "")) {
    while (grayScaleNamesStr.includes(closestColors[1]?.scale ?? "")) {
      closestColors.splice(1, 1);
    }
  }

  const colorA = closestColors[0];
  const colorB = closestColors[1];
  if (!colorA || !colorB) throw new Error("Unable to find Radix reference scales");

  const a = colorB.distance;
  const b = colorA.distance;
  const c = colorA.color.deltaEOK(colorB.color);

  const cosA = (b ** 2 + c ** 2 - a ** 2) / (2 * b * c);
  const radA = Math.acos(cosA);
  const sinA = Math.sin(radA);

  const cosB = (a ** 2 + c ** 2 - b ** 2) / (2 * a * c);
  const radB = Math.acos(cosB);
  const sinB = Math.sin(radB);

  const tanC1 = cosA / sinA;
  const tanC2 = cosB / sinB;
  const ratio = Math.max(0, tanC1 / tanC2) * 0.5;

  const scaleA = scales[colorA.scale];
  const scaleB = scales[colorB.scale];
  if (!scaleA || !scaleB) throw new Error("Unable to read Radix reference scales");

  const scale = arrayOf12.map((index) =>
    new Color(Color.mix(scaleA[index], scaleB[index], ratio)).to("oklch"),
  ) as ArrayOf12<Color>;

  const baseColor = scale
    .slice()
    .sort((left, right) => source.deltaEOK(left) - source.deltaEOK(right))[0];
  if (!baseColor) throw new Error("Unable to derive Radix base color");

  const ratioC = (source.coords[1] ?? 0) / (baseColor.coords[1] ?? 0);

  scale.forEach((color) => {
    color.coords[1] = Math.min((source.coords[1] ?? 0) * 1.5, (color.coords[1] ?? 0) * ratioC);
    color.coords[2] = source.coords[2] ?? 0;
  });

  if ((scale[0].coords[0] ?? 0) > 0.5) {
    const lightnessScale = scale.map(({ coords }) => coords[0] ?? 0);
    const backgroundLightness = Math.max(0, Math.min(1, backgroundColor.coords[0] ?? 0));
    const newLightnessScale = transposeProgressionStart(
      backgroundLightness,
      [1, ...lightnessScale],
      lightModeEasing,
    );

    newLightnessScale.shift();

    newLightnessScale.forEach((lightness, index) => {
      scale[index]!.coords[0] = lightness;
    });

    return scale;
  }

  const ease: [number, number, number, number] = [...darkModeEasing];
  const referenceBackgroundColorLightness = scale[0].coords[0] ?? 0;
  const backgroundColorLightness = Math.max(0, Math.min(1, backgroundColor.coords[0] ?? 0));
  const ratioL = backgroundColorLightness / referenceBackgroundColorLightness;

  if (ratioL > 1) {
    const maxRatio = 1.5;

    for (let index = 0; index < ease.length; index += 1) {
      const metaRatio = (ratioL - 1) * (maxRatio / (maxRatio - 1));
      ease[index] = ratioL > maxRatio ? 0 : Math.max(0, (ease[index] ?? 0) * (1 - metaRatio));
    }
  }

  const lightnessScale = scale.map(({ coords }) => coords[0] ?? 0);
  const backgroundLightness = backgroundColor.coords[0] ?? 0;
  const newLightnessScale = transposeProgressionStart(backgroundLightness, lightnessScale, ease);

  newLightnessScale.forEach((lightness, index) => {
    scale[index]!.coords[0] = lightness;
  });

  return scale;
}

function getTextColor(background: Color): Color {
  const white = new Color("oklch", [1, 0, 0]);

  if (Math.abs(white.contrastAPCA(background)) < 40) {
    const [, chroma, hue] = background.coords;
    return new Color("oklch", [0.25, Math.max(0.08 * chroma, 0.04), hue]);
  }

  return white;
}

const darkModeEasing = [1, 0, 1, 0] as [number, number, number, number];
const lightModeEasing = [0, 2, 0, 2] as [number, number, number, number];

function transposeProgressionStart(
  to: number,
  arr: number[],
  curve: [number, number, number, number],
): number[] {
  return arr.map((value, index, values) => {
    const lastIndex = values.length - 1;
    const diff = (values[0] ?? 0) - to;
    const fn = BezierEasing(...curve);
    return value - diff * fn(1 - index / lastIndex);
  });
}

export function radixStockScale(name: string, mode: ThemeMode): HexColor[] {
  return colorScale(name, mode).map((value, index) => normalizeHex(value, `${name}.${index + 1}`));
}

export function radixTerminalColors(mode: ThemeMode): {
  red: HexColor;
  brightRed: HexColor;
  yellow: HexColor;
  brightYellow: HexColor;
  green: HexColor;
  brightGreen: HexColor;
  cyan: HexColor;
  brightCyan: HexColor;
  blue: HexColor;
  brightBlue: HexColor;
  magenta: HexColor;
  brightMagenta: HexColor;
  orange: HexColor;
  brown: HexColor;
} {
  const red = radixStockScale("red", mode);
  const yellow = radixStockScale("yellow", mode);
  const green = radixStockScale("green", mode);
  const cyan = radixStockScale("cyan", mode);
  const blue = radixStockScale("blue", mode);
  const plum = radixStockScale("plum", mode);
  const orange = radixStockScale("orange", mode);
  const brown = radixStockScale("brown", mode);

  return {
    red: red[10]!,
    brightRed: red[11]!,
    yellow: yellow[10]!,
    brightYellow: yellow[11]!,
    green: green[10]!,
    brightGreen: green[11]!,
    cyan: cyan[10]!,
    brightCyan: cyan[11]!,
    blue: blue[10]!,
    brightBlue: blue[11]!,
    magenta: plum[10]!,
    brightMagenta: plum[11]!,
    orange: orange[10]!,
    brown: brown[10]!,
  };
}
