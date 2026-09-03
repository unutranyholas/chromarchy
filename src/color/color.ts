type Space = "srgb" | "p3" | "xyz-d65" | "xyz-d50" | "lab" | "oklab" | "oklch";
type Vec3 = [number, number, number];
type Matrix = [Vec3, Vec3, Vec3];

// Minimal Color.js-compatible subset; the full package cannot execute in QML's QV4 engine.
const SRGB_TO_XYZ: Matrix = [
  [0.41239079926595934, 0.357584339383878, 0.1804807884018343],
  [0.21263900587151027, 0.715168678767756, 0.07219231536073371],
  [0.01933081871559182, 0.11919477979462598, 0.9505321522496607],
];
const XYZ_TO_SRGB: Matrix = [
  [3.2409699419045226, -1.537383177570094, -0.4986107602930034],
  [-0.9692436362808796, 1.8759675015077202, 0.04155505740717559],
  [0.05563007969699366, -0.20397695888897652, 1.0569715142428786],
];
const P3_TO_XYZ: Matrix = [
  [0.4865709486482162, 0.26566769316909306, 0.1982172852343625],
  [0.2289745640697488, 0.6917385218365064, 0.079286914093745],
  [0, 0.04511338185890264, 1.043944368900976],
];
const XYZ_TO_LMS: Matrix = [
  [0.819022437996703, 0.3619062600528904, -0.1288737815209879],
  [0.0329836539323885, 0.9292868615863434, 0.0361446663506424],
  [0.0481771893596242, 0.2642395317527308, 0.6335478284694309],
];
const LMS_TO_XYZ: Matrix = [
  [1.2268798758459243, -0.5578149944602171, 0.2813910456659647],
  [-0.0405757452148008, 1.112286803280317, -0.0717110580655164],
  [-0.0763729366746601, -0.4214933324022432, 1.5869240198367816],
];
const LMS_TO_OKLAB: Matrix = [
  [0.210454268309314, 0.7936177747023054, -0.0040720430116193],
  [1.9779985324311684, -2.42859224204858, 0.450593709617411],
  [0.0259040424655478, 0.7827717124575296, -0.8086757549230774],
];
const OKLAB_TO_LMS: Matrix = [
  [1, 0.3963377773761749, 0.2158037573099136],
  [1, -0.1055613458156586, -0.0638541728258133],
  [1, -0.0894841775298119, -1.2914855480194092],
];
const D65_TO_D50: Matrix = [
  [1.0479297925449969, 0.022946870601609652, -0.05019226628920524],
  [0.02962780877005599, 0.9904344267538799, -0.017073799063418826],
  [-0.009243040646204504, 0.015055191490298152, 0.7518742814281371],
];
const D50_TO_D65: Matrix = [
  [0.955473421488075, -0.02309845494876471, 0.06325924320057072],
  [-0.0283697093338637, 1.0099953980813041, 0.021041441191917323],
  [0.012314014864481998, -0.020507649298898964, 1.330365926242124],
];
const D50: Vec3 = [0.3457 / 0.3585, 1, (1 - 0.3457 - 0.3585) / 0.3585];

function multiply(matrix: Matrix, vector: Vec3): Vec3 {
  return matrix.map((row) =>
    row.reduce((sum, value, index) => sum + value * vector[index]!, 0),
  ) as Vec3;
}

function linear(value: number): number {
  const sign = value < 0 ? -1 : 1;
  const absolute = Math.abs(value);
  return sign * (absolute < 0.04045 ? absolute / 12.92 : ((absolute + 0.055) / 1.055) ** 2.4);
}

function gamma(value: number): number {
  const sign = value < 0 ? -1 : 1;
  const absolute = Math.abs(value);
  return sign * (absolute > 0.0031308 ? 1.055 * absolute ** (1 / 2.4) - 0.055 : 12.92 * absolute);
}

function toXyz(space: Space, coords: Vec3): Vec3 {
  if (space === "xyz-d65") return [...coords];
  if (space === "xyz-d50") return multiply(D50_TO_D65, coords);
  if (space === "srgb") return multiply(SRGB_TO_XYZ, coords.map(linear) as Vec3);
  if (space === "p3") return multiply(P3_TO_XYZ, coords.map(linear) as Vec3);
  if (space === "oklch") {
    const [lightness, chroma, hue] = coords;
    const radians = ((Number.isNaN(hue) ? 0 : hue) * Math.PI) / 180;
    return toXyz("oklab", [lightness, chroma * Math.cos(radians), chroma * Math.sin(radians)]);
  }
  if (space === "oklab") {
    const lms = multiply(OKLAB_TO_LMS, coords).map((value) => value ** 3) as Vec3;
    return multiply(LMS_TO_XYZ, lms);
  }

  const [lightness, a, b] = coords;
  const f1 = (lightness + 16) / 116;
  const f0 = a / 500 + f1;
  const f2 = f1 - b / 200;
  const epsilon3 = 24 / 116;
  const kappa = 24389 / 27;
  const xyz = [
    f0 > epsilon3 ? f0 ** 3 : (116 * f0 - 16) / kappa,
    lightness > 8 ? ((lightness + 16) / 116) ** 3 : lightness / kappa,
    f2 > epsilon3 ? f2 ** 3 : (116 * f2 - 16) / kappa,
  ].map((value, index) => value * D50[index]!) as Vec3;
  return multiply(D50_TO_D65, xyz);
}

function fromXyz(space: Space, xyzD65: Vec3): Vec3 {
  if (space === "xyz-d65") return [...xyzD65];
  if (space === "xyz-d50") return multiply(D65_TO_D50, xyzD65);
  if (space === "srgb") return multiply(XYZ_TO_SRGB, xyzD65).map(gamma) as Vec3;
  if (space === "p3") throw new Error("P3 output is not needed");
  if (space === "oklab" || space === "oklch") {
    const lms = multiply(XYZ_TO_LMS, xyzD65).map(Math.cbrt) as Vec3;
    const [lightness, a, b] = multiply(LMS_TO_OKLAB, lms);
    if (space === "oklab") return [lightness, a, b];
    const chroma = Math.sqrt(a ** 2 + b ** 2);
    let hue = (Math.atan2(b, a) * 180) / Math.PI;
    if (hue < 0) hue += 360;
    return [lightness, chroma, chroma < 2e-7 ? Number.NaN : hue];
  }

  const xyz = multiply(D65_TO_D50, xyzD65);
  const epsilon = 216 / 24389;
  const kappa = 24389 / 27;
  const f = xyz.map((value, index) => {
    const scaled = value / D50[index]!;
    return scaled > epsilon ? Math.cbrt(scaled) : (kappa * scaled + 16) / 116;
  });
  return [116 * f[1]! - 16, 500 * (f[0]! - f[1]!), 200 * (f[1]! - f[2]!)];
}

function parse(input: string): { space: Space; coords: Vec3 } {
  const hex = /^#([\da-f]{3}|[\da-f]{6})$/i.exec(input);
  if (hex) {
    const digits =
      hex[1]!.length === 3
        ? hex[1]!
            .split("")
            .map((digit) => digit + digit)
            .join("")
        : hex[1]!;
    return {
      space: "srgb",
      coords: [0, 2, 4].map(
        (index) => Number.parseInt(digits.slice(index, index + 2), 16) / 255,
      ) as Vec3,
    };
  }
  const p3 = /^color\(display-p3\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\)$/i.exec(input);
  if (p3) {
    return {
      space: "p3",
      coords: [Number(p3[1]), Number(p3[2]), Number(p3[3])],
    };
  }
  throw new TypeError(`Could not parse ${input} as a color`);
}

function inSrgb(color: Color): boolean {
  return color.to("srgb").coords.every((value) => value >= 0 && value <= 1);
}

function clippedSrgb(color: Color): Color {
  const result = color.to("srgb");
  result.coords = result.coords.map((value) => Math.max(0, Math.min(1, value))) as Vec3;
  return result;
}

function gamutMap(color: Color): Color {
  const origin = color.to("oklch");
  const lightness = origin.coords[0];
  if (lightness >= 1) return new Color("srgb", [1, 1, 1]);
  if (lightness <= 0) return new Color("srgb", [0, 0, 0]);
  if (inSrgb(origin)) return origin.to("srgb");

  const jnd = 0.02;
  const epsilon = 0.0001;
  let min = 0;
  let max = origin.coords[1];
  let minInGamut = true;
  const current = origin.clone();
  let clipped = clippedSrgb(current);
  if (current.deltaEOK(clipped) < jnd) return clipped;

  while (max - min > epsilon) {
    const chroma = (min + max) / 2;
    current.coords[1] = chroma;
    if (minInGamut && inSrgb(current)) {
      min = chroma;
    } else {
      clipped = clippedSrgb(current);
      const difference = current.deltaEOK(clipped);
      if (difference < jnd) {
        if (jnd - difference < epsilon) break;
        minInGamut = false;
        min = chroma;
      } else {
        max = chroma;
      }
    }
  }
  return clipped;
}

function interpolateHue(left: number, right: number, amount: number): number {
  if (Number.isNaN(left)) return right;
  if (Number.isNaN(right)) return left;
  let difference = right - left;
  if (difference > 180) difference -= 360;
  if (difference < -180) difference += 360;
  return left + difference * amount;
}

export default class Color {
  space: Space;
  coords: Vec3;

  constructor(input: string | Color, coords?: number[]) {
    if (input instanceof Color) {
      this.space = input.space;
      this.coords = [...input.coords];
    } else if (coords) {
      this.space = input as Space;
      this.coords = [...coords] as Vec3;
    } else {
      const parsed = parse(input);
      this.space = parsed.space;
      this.coords = parsed.coords;
    }
  }

  clone(): Color {
    return new Color(this);
  }

  to(space: Space): Color {
    return space === this.space
      ? this.clone()
      : new Color(space, fromXyz(space, toXyz(this.space, this.coords)));
  }

  toString({ format: _format }: { format: "hex" }): string {
    return `#${gamutMap(this)
      .coords.map((value) =>
        Math.round(value * 255)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")}`;
  }

  deltaEOK(other: Color): number {
    const left = this.to("oklab").coords;
    const right = other.to("oklab").coords;
    return Math.sqrt(left.reduce((sum, value, index) => sum + (value - right[index]!) ** 2, 0));
  }

  contrast(other: Color, _algorithm: "WCAG21"): number {
    const luminance = (candidate: Color) => {
      const rgb = gamutMap(candidate).coords.map(linear);
      return (
        0.21263900587151027 * rgb[0]! + 0.715168678767756 * rgb[1]! + 0.07219231536073371 * rgb[2]!
      );
    };
    const left = luminance(this);
    const right = luminance(other);
    return (Math.max(left, right) + 0.05) / (Math.min(left, right) + 0.05);
  }

  contrastAPCA(background: Color): number {
    const luminance = (candidate: Color) => {
      const [red, green, blue] = candidate.to("srgb").coords.map((value) => {
        const sign = value < 0 ? -1 : 1;
        return sign * Math.abs(value) ** 2.4;
      });
      return red! * 0.2126729 + green! * 0.7151522 + blue! * 0.072175;
    };
    const clamp = (value: number) => (value >= 0.022 ? value : value + (0.022 - value) ** 1.414);
    const surface = clamp(luminance(this));
    const text = clamp(luminance(background));
    if (Math.abs(surface - text) < 0.0005) return 0;
    const contrast =
      surface > text
        ? (surface ** 0.56 - text ** 0.57) * 1.14
        : (surface ** 0.65 - text ** 0.62) * 1.14;
    if (Math.abs(contrast) < 0.1) return 0;
    return (contrast > 0 ? contrast - 0.027 : contrast + 0.027) * 100;
  }

  range(
    other: Color | string,
    { space, outputSpace }: { space: "oklch"; outputSpace: "srgb" },
  ): (amount: number) => Color {
    const left = this.to(space).coords;
    const right = new Color(other).to(space).coords;
    return (amount) =>
      new Color(
        outputSpace,
        new Color(space, [
          left[0] + (right[0] - left[0]) * amount,
          left[1] + (right[1] - left[1]) * amount,
          interpolateHue(left[2], right[2], amount),
        ]).to(outputSpace).coords,
      );
  }

  static mix(left: Color, right: Color, amount: number): Color {
    const a = left.to("lab").coords;
    const b = right.to("lab").coords;
    return new Color(
      "lab",
      a.map((value, index) => value + (b[index]! - value) * amount),
    );
  }
}
