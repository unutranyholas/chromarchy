//#region \0rolldown/runtime.js
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJSMin = (cb, mod) => () => (mod || (cb((mod = { exports: {} }).exports, mod), cb = null), mod.exports);
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
		key = keys[i];
		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: ((k) => from[k]).bind(null, key),
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule || !__hasOwnProp.call(mod, "default") ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));
//#endregion
//#region \0@oxc-project+runtime@0.146.0/helpers/esm/typeof.js
function _typeof(o) {
	"@babel/helpers - typeof";
	return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o) {
		return typeof o;
	} : function(o) {
		return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
	}, _typeof(o);
}
//#endregion
//#region \0@oxc-project+runtime@0.146.0/helpers/esm/toPrimitive.js
function toPrimitive(t, r) {
	if ("object" != _typeof(t) || !t) return t;
	var e = t[Symbol.toPrimitive];
	if (void 0 !== e) {
		var i = e.call(t, r || "default");
		if ("object" != _typeof(i)) return i;
		throw new TypeError("@@toPrimitive must return a primitive value.");
	}
	return ("string" === r ? String : Number)(t);
}
//#endregion
//#region \0@oxc-project+runtime@0.146.0/helpers/esm/toPropertyKey.js
function toPropertyKey(t) {
	var i = toPrimitive(t, "string");
	return "symbol" == _typeof(i) ? i : i + "";
}
//#endregion
//#region \0@oxc-project+runtime@0.146.0/helpers/esm/defineProperty.js
function _defineProperty(e, r, t) {
	return (r = toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
		value: t,
		enumerable: !0,
		configurable: !0,
		writable: !0
	}) : e[r] = t, e;
}
//#endregion
//#region src/color/color.ts
const SRGB_TO_XYZ = [
	[
		.41239079926595934,
		.357584339383878,
		.1804807884018343
	],
	[
		.21263900587151027,
		.715168678767756,
		.07219231536073371
	],
	[
		.01933081871559182,
		.11919477979462598,
		.9505321522496607
	]
];
const XYZ_TO_SRGB = [
	[
		3.2409699419045226,
		-1.537383177570094,
		-.4986107602930034
	],
	[
		-.9692436362808796,
		1.8759675015077202,
		.04155505740717559
	],
	[
		.05563007969699366,
		-.20397695888897652,
		1.0569715142428786
	]
];
const P3_TO_XYZ = [
	[
		.4865709486482162,
		.26566769316909306,
		.1982172852343625
	],
	[
		.2289745640697488,
		.6917385218365064,
		.079286914093745
	],
	[
		0,
		.04511338185890264,
		1.043944368900976
	]
];
const XYZ_TO_LMS = [
	[
		.819022437996703,
		.3619062600528904,
		-.1288737815209879
	],
	[
		.0329836539323885,
		.9292868615863434,
		.0361446663506424
	],
	[
		.0481771893596242,
		.2642395317527308,
		.6335478284694309
	]
];
const LMS_TO_XYZ = [
	[
		1.2268798758459243,
		-.5578149944602171,
		.2813910456659647
	],
	[
		-.0405757452148008,
		1.112286803280317,
		-.0717110580655164
	],
	[
		-.0763729366746601,
		-.4214933324022432,
		1.5869240198367816
	]
];
const LMS_TO_OKLAB = [
	[
		.210454268309314,
		.7936177747023054,
		-.0040720430116193
	],
	[
		1.9779985324311684,
		-2.42859224204858,
		.450593709617411
	],
	[
		.0259040424655478,
		.7827717124575296,
		-.8086757549230774
	]
];
const OKLAB_TO_LMS = [
	[
		1,
		.3963377773761749,
		.2158037573099136
	],
	[
		1,
		-.1055613458156586,
		-.0638541728258133
	],
	[
		1,
		-.0894841775298119,
		-1.2914855480194092
	]
];
const D65_TO_D50 = [
	[
		1.0479297925449969,
		.022946870601609652,
		-.05019226628920524
	],
	[
		.02962780877005599,
		.9904344267538799,
		-.017073799063418826
	],
	[
		-.009243040646204504,
		.015055191490298152,
		.7518742814281371
	]
];
const D50_TO_D65 = [
	[
		.955473421488075,
		-.02309845494876471,
		.06325924320057072
	],
	[
		-.0283697093338637,
		1.0099953980813041,
		.021041441191917323
	],
	[
		.012314014864481998,
		-.020507649298898964,
		1.330365926242124
	]
];
const D50 = [
	.3457 / .3585,
	1,
	.2958 / .3585
];
function multiply(matrix, vector) {
	return matrix.map((row) => row.reduce((sum, value, index) => sum + value * vector[index], 0));
}
function linear(value) {
	const sign = value < 0 ? -1 : 1;
	const absolute = Math.abs(value);
	return sign * (absolute < .04045 ? absolute / 12.92 : Math.pow((absolute + .055) / 1.055, 2.4));
}
function gamma(value) {
	const sign = value < 0 ? -1 : 1;
	const absolute = Math.abs(value);
	return sign * (absolute > .0031308 ? 1.055 * Math.pow(absolute, 1 / 2.4) - .055 : 12.92 * absolute);
}
function toXyz(space, coords) {
	if (space === "xyz-d65") return [...coords];
	if (space === "xyz-d50") return multiply(D50_TO_D65, coords);
	if (space === "srgb") return multiply(SRGB_TO_XYZ, coords.map(linear));
	if (space === "p3") return multiply(P3_TO_XYZ, coords.map(linear));
	if (space === "oklch") {
		const [lightness, chroma, hue] = coords;
		const radians = (Number.isNaN(hue) ? 0 : hue) * Math.PI / 180;
		return toXyz("oklab", [
			lightness,
			chroma * Math.cos(radians),
			chroma * Math.sin(radians)
		]);
	}
	if (space === "oklab") {
		const lms = multiply(OKLAB_TO_LMS, coords).map((value) => Math.pow(value, 3));
		return multiply(LMS_TO_XYZ, lms);
	}
	const [lightness, a, b] = coords;
	const f1 = (lightness + 16) / 116;
	const f0 = a / 500 + f1;
	const f2 = f1 - b / 200;
	const epsilon3 = 24 / 116;
	const kappa = 24389 / 27;
	const xyz = [
		f0 > epsilon3 ? Math.pow(f0, 3) : (116 * f0 - 16) / kappa,
		lightness > 8 ? Math.pow((lightness + 16) / 116, 3) : lightness / kappa,
		f2 > epsilon3 ? Math.pow(f2, 3) : (116 * f2 - 16) / kappa
	].map((value, index) => value * D50[index]);
	return multiply(D50_TO_D65, xyz);
}
function fromXyz(space, xyzD65) {
	if (space === "xyz-d65") return [...xyzD65];
	if (space === "xyz-d50") return multiply(D65_TO_D50, xyzD65);
	if (space === "srgb") return multiply(XYZ_TO_SRGB, xyzD65).map(gamma);
	if (space === "p3") throw new Error("P3 output is not needed");
	if (space === "oklab" || space === "oklch") {
		const lms = multiply(XYZ_TO_LMS, xyzD65).map(Math.cbrt);
		const [lightness, a, b] = multiply(LMS_TO_OKLAB, lms);
		if (space === "oklab") return [
			lightness,
			a,
			b
		];
		const chroma = Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2));
		let hue = Math.atan2(b, a) * 180 / Math.PI;
		if (hue < 0) hue += 360;
		return [
			lightness,
			chroma,
			chroma < 2e-7 ? NaN : hue
		];
	}
	const xyz = multiply(D65_TO_D50, xyzD65);
	const epsilon = 216 / 24389;
	const kappa = 24389 / 27;
	const f = xyz.map((value, index) => {
		const scaled = value / D50[index];
		return scaled > epsilon ? Math.cbrt(scaled) : (kappa * scaled + 16) / 116;
	});
	return [
		116 * f[1] - 16,
		500 * (f[0] - f[1]),
		200 * (f[1] - f[2])
	];
}
function parse(input) {
	const hex = /^#([\da-f]{3}|[\da-f]{6})$/i.exec(input);
	if (hex) {
		const digits = hex[1].length === 3 ? hex[1].split("").map((digit) => digit + digit).join("") : hex[1];
		return {
			space: "srgb",
			coords: [
				0,
				2,
				4
			].map((index) => Number.parseInt(digits.slice(index, index + 2), 16) / 255)
		};
	}
	const p3 = /^color\(display-p3\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\)$/i.exec(input);
	if (p3) return {
		space: "p3",
		coords: [
			Number(p3[1]),
			Number(p3[2]),
			Number(p3[3])
		]
	};
	throw new TypeError(`Could not parse ${input} as a color`);
}
function inSrgb(color) {
	return color.to("srgb").coords.every((value) => value >= 0 && value <= 1);
}
function clippedSrgb(color) {
	const result = color.to("srgb");
	result.coords = result.coords.map((value) => Math.max(0, Math.min(1, value)));
	return result;
}
function gamutMap(color) {
	const origin = color.to("oklch");
	const lightness = origin.coords[0];
	if (lightness >= 1) return new Color("srgb", [
		1,
		1,
		1
	]);
	if (lightness <= 0) return new Color("srgb", [
		0,
		0,
		0
	]);
	if (inSrgb(origin)) return origin.to("srgb");
	const jnd = .02;
	const epsilon = 1e-4;
	let min = 0;
	let max = origin.coords[1];
	let minInGamut = true;
	const current = origin.clone();
	let clipped = clippedSrgb(current);
	if (current.deltaEOK(clipped) < jnd) return clipped;
	while (max - min > epsilon) {
		const chroma = (min + max) / 2;
		current.coords[1] = chroma;
		if (minInGamut && inSrgb(current)) min = chroma;
		else {
			clipped = clippedSrgb(current);
			const difference = current.deltaEOK(clipped);
			if (difference < jnd) {
				if (jnd - difference < epsilon) break;
				minInGamut = false;
				min = chroma;
			} else max = chroma;
		}
	}
	return clipped;
}
function interpolateHue(left, right, amount) {
	if (Number.isNaN(left)) return right;
	if (Number.isNaN(right)) return left;
	let difference = right - left;
	if (difference > 180) difference -= 360;
	if (difference < -180) difference += 360;
	return left + difference * amount;
}
var Color = class Color {
	constructor(input, coords) {
		_defineProperty(this, "space", void 0);
		_defineProperty(this, "coords", void 0);
		if (input instanceof Color) {
			this.space = input.space;
			this.coords = [...input.coords];
		} else if (coords) {
			this.space = input;
			this.coords = [...coords];
		} else {
			const parsed = parse(input);
			this.space = parsed.space;
			this.coords = parsed.coords;
		}
	}
	clone() {
		return new Color(this);
	}
	to(space) {
		return space === this.space ? this.clone() : new Color(space, fromXyz(space, toXyz(this.space, this.coords)));
	}
	toString({ format: _format }) {
		return `#${gamutMap(this).coords.map((value) => Math.round(value * 255).toString(16).padStart(2, "0")).join("")}`;
	}
	deltaEOK(other) {
		const left = this.to("oklab").coords;
		const right = other.to("oklab").coords;
		return Math.sqrt(left.reduce((sum, value, index) => sum + Math.pow(value - right[index], 2), 0));
	}
	contrast(other, _algorithm) {
		const luminance = (candidate) => {
			const rgb = gamutMap(candidate).coords.map(linear);
			return .21263900587151027 * rgb[0] + .715168678767756 * rgb[1] + .07219231536073371 * rgb[2];
		};
		const left = luminance(this);
		const right = luminance(other);
		return (Math.max(left, right) + .05) / (Math.min(left, right) + .05);
	}
	contrastAPCA(background) {
		const luminance = (candidate) => {
			const [red, green, blue] = candidate.to("srgb").coords.map((value) => {
				return (value < 0 ? -1 : 1) * Math.pow(Math.abs(value), 2.4);
			});
			return red * .2126729 + green * .7151522 + blue * .072175;
		};
		const clamp = (value) => value >= .022 ? value : value + Math.pow(.022 - value, 1.414);
		const surface = clamp(luminance(this));
		const text = clamp(luminance(background));
		if (Math.abs(surface - text) < 5e-4) return 0;
		const contrast = surface > text ? (Math.pow(surface, .56) - Math.pow(text, .57)) * 1.14 : (Math.pow(surface, .65) - Math.pow(text, .62)) * 1.14;
		if (Math.abs(contrast) < .1) return 0;
		return (contrast > 0 ? contrast - .027 : contrast + .027) * 100;
	}
	range(other, { space, outputSpace }) {
		const left = this.to(space).coords;
		const right = new Color(other).to(space).coords;
		return (amount) => new Color(outputSpace, new Color(space, [
			left[0] + (right[0] - left[0]) * amount,
			left[1] + (right[1] - left[1]) * amount,
			interpolateHue(left[2], right[2], amount)
		]).to(outputSpace).coords);
	}
	static mix(left, right, amount) {
		const a = left.to("lab").coords;
		const b = right.to("lab").coords;
		return new Color("lab", a.map((value, index) => value + (b[index] - value) * amount));
	}
};
//#endregion
//#region node_modules/.pnpm/bezier-easing@3.0.1/node_modules/bezier-easing/src/index.js
var import_colors = /* @__PURE__ */ __toESM((/* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	const grayDarkP3 = {
		gray1: "color(display-p3 0.067 0.067 0.067)",
		gray2: "color(display-p3 0.098 0.098 0.098)",
		gray3: "color(display-p3 0.135 0.135 0.135)",
		gray4: "color(display-p3 0.163 0.163 0.163)",
		gray5: "color(display-p3 0.192 0.192 0.192)",
		gray6: "color(display-p3 0.228 0.228 0.228)",
		gray7: "color(display-p3 0.283 0.283 0.283)",
		gray8: "color(display-p3 0.375 0.375 0.375)",
		gray9: "color(display-p3 0.431 0.431 0.431)",
		gray10: "color(display-p3 0.484 0.484 0.484)",
		gray11: "color(display-p3 0.706 0.706 0.706)",
		gray12: "color(display-p3 0.933 0.933 0.933)"
	};
	const mauveDarkP3 = {
		mauve1: "color(display-p3 0.07 0.067 0.074)",
		mauve2: "color(display-p3 0.101 0.098 0.105)",
		mauve3: "color(display-p3 0.138 0.134 0.144)",
		mauve4: "color(display-p3 0.167 0.161 0.175)",
		mauve5: "color(display-p3 0.196 0.189 0.206)",
		mauve6: "color(display-p3 0.232 0.225 0.245)",
		mauve7: "color(display-p3 0.286 0.277 0.302)",
		mauve8: "color(display-p3 0.383 0.373 0.408)",
		mauve9: "color(display-p3 0.434 0.428 0.467)",
		mauve10: "color(display-p3 0.487 0.48 0.519)",
		mauve11: "color(display-p3 0.707 0.7 0.735)",
		mauve12: "color(display-p3 0.933 0.933 0.94)"
	};
	const slateDarkP3 = {
		slate1: "color(display-p3 0.067 0.067 0.074)",
		slate2: "color(display-p3 0.095 0.098 0.105)",
		slate3: "color(display-p3 0.13 0.135 0.145)",
		slate4: "color(display-p3 0.156 0.163 0.176)",
		slate5: "color(display-p3 0.183 0.191 0.206)",
		slate6: "color(display-p3 0.215 0.226 0.244)",
		slate7: "color(display-p3 0.265 0.28 0.302)",
		slate8: "color(display-p3 0.357 0.381 0.409)",
		slate9: "color(display-p3 0.415 0.431 0.463)",
		slate10: "color(display-p3 0.469 0.483 0.514)",
		slate11: "color(display-p3 0.692 0.704 0.728)",
		slate12: "color(display-p3 0.93 0.933 0.94)"
	};
	const sageDarkP3 = {
		sage1: "color(display-p3 0.064 0.07 0.067)",
		sage2: "color(display-p3 0.092 0.098 0.094)",
		sage3: "color(display-p3 0.128 0.135 0.131)",
		sage4: "color(display-p3 0.155 0.164 0.159)",
		sage5: "color(display-p3 0.183 0.193 0.188)",
		sage6: "color(display-p3 0.218 0.23 0.224)",
		sage7: "color(display-p3 0.269 0.285 0.277)",
		sage8: "color(display-p3 0.362 0.382 0.373)",
		sage9: "color(display-p3 0.398 0.438 0.421)",
		sage10: "color(display-p3 0.453 0.49 0.474)",
		sage11: "color(display-p3 0.685 0.709 0.697)",
		sage12: "color(display-p3 0.927 0.933 0.93)"
	};
	const oliveDarkP3 = {
		olive1: "color(display-p3 0.067 0.07 0.063)",
		olive2: "color(display-p3 0.095 0.098 0.091)",
		olive3: "color(display-p3 0.131 0.135 0.126)",
		olive4: "color(display-p3 0.158 0.163 0.153)",
		olive5: "color(display-p3 0.186 0.192 0.18)",
		olive6: "color(display-p3 0.221 0.229 0.215)",
		olive7: "color(display-p3 0.273 0.284 0.266)",
		olive8: "color(display-p3 0.365 0.382 0.359)",
		olive9: "color(display-p3 0.414 0.438 0.404)",
		olive10: "color(display-p3 0.467 0.49 0.458)",
		olive11: "color(display-p3 0.69 0.709 0.682)",
		olive12: "color(display-p3 0.927 0.933 0.926)"
	};
	const sandDarkP3 = {
		sand1: "color(display-p3 0.067 0.067 0.063)",
		sand2: "color(display-p3 0.098 0.098 0.094)",
		sand3: "color(display-p3 0.135 0.135 0.129)",
		sand4: "color(display-p3 0.164 0.163 0.156)",
		sand5: "color(display-p3 0.193 0.192 0.183)",
		sand6: "color(display-p3 0.23 0.229 0.217)",
		sand7: "color(display-p3 0.285 0.282 0.267)",
		sand8: "color(display-p3 0.384 0.378 0.357)",
		sand9: "color(display-p3 0.434 0.428 0.403)",
		sand10: "color(display-p3 0.487 0.481 0.456)",
		sand11: "color(display-p3 0.707 0.703 0.68)",
		sand12: "color(display-p3 0.933 0.933 0.926)"
	};
	const tomatoDarkP3 = {
		tomato1: "color(display-p3 0.09 0.068 0.067)",
		tomato2: "color(display-p3 0.115 0.084 0.076)",
		tomato3: "color(display-p3 0.205 0.097 0.083)",
		tomato4: "color(display-p3 0.282 0.099 0.077)",
		tomato5: "color(display-p3 0.339 0.129 0.101)",
		tomato6: "color(display-p3 0.398 0.179 0.141)",
		tomato7: "color(display-p3 0.487 0.245 0.194)",
		tomato8: "color(display-p3 0.629 0.322 0.248)",
		tomato9: "color(display-p3 0.831 0.345 0.231)",
		tomato10: "color(display-p3 0.862 0.415 0.298)",
		tomato11: "color(display-p3 1 0.585 0.455)",
		tomato12: "color(display-p3 0.959 0.833 0.802)"
	};
	const redDarkP3 = {
		red1: "color(display-p3 0.093 0.068 0.067)",
		red2: "color(display-p3 0.118 0.077 0.079)",
		red3: "color(display-p3 0.211 0.081 0.099)",
		red4: "color(display-p3 0.287 0.079 0.113)",
		red5: "color(display-p3 0.348 0.11 0.142)",
		red6: "color(display-p3 0.414 0.16 0.183)",
		red7: "color(display-p3 0.508 0.224 0.236)",
		red8: "color(display-p3 0.659 0.298 0.297)",
		red9: "color(display-p3 0.83 0.329 0.324)",
		red10: "color(display-p3 0.861 0.403 0.387)",
		red11: "color(display-p3 1 0.57 0.55)",
		red12: "color(display-p3 0.971 0.826 0.852)"
	};
	const rubyDarkP3 = {
		ruby1: "color(display-p3 0.093 0.068 0.074)",
		ruby2: "color(display-p3 0.113 0.083 0.089)",
		ruby3: "color(display-p3 0.208 0.088 0.117)",
		ruby4: "color(display-p3 0.279 0.092 0.147)",
		ruby5: "color(display-p3 0.337 0.12 0.18)",
		ruby6: "color(display-p3 0.401 0.166 0.223)",
		ruby7: "color(display-p3 0.495 0.224 0.281)",
		ruby8: "color(display-p3 0.652 0.295 0.359)",
		ruby9: "color(display-p3 0.83 0.323 0.408)",
		ruby10: "color(display-p3 0.857 0.392 0.455)",
		ruby11: "color(display-p3 1 0.57 0.59)",
		ruby12: "color(display-p3 0.968 0.83 0.88)"
	};
	const crimsonDarkP3 = {
		crimson1: "color(display-p3 0.093 0.068 0.078)",
		crimson2: "color(display-p3 0.117 0.078 0.095)",
		crimson3: "color(display-p3 0.203 0.091 0.143)",
		crimson4: "color(display-p3 0.277 0.087 0.182)",
		crimson5: "color(display-p3 0.332 0.115 0.22)",
		crimson6: "color(display-p3 0.394 0.162 0.268)",
		crimson7: "color(display-p3 0.489 0.222 0.336)",
		crimson8: "color(display-p3 0.638 0.289 0.429)",
		crimson9: "color(display-p3 0.843 0.298 0.507)",
		crimson10: "color(display-p3 0.864 0.364 0.539)",
		crimson11: "color(display-p3 1 0.56 0.66)",
		crimson12: "color(display-p3 0.966 0.834 0.906)"
	};
	const pinkDarkP3 = {
		pink1: "color(display-p3 0.093 0.068 0.089)",
		pink2: "color(display-p3 0.121 0.073 0.11)",
		pink3: "color(display-p3 0.198 0.098 0.179)",
		pink4: "color(display-p3 0.271 0.095 0.231)",
		pink5: "color(display-p3 0.32 0.127 0.273)",
		pink6: "color(display-p3 0.382 0.177 0.326)",
		pink7: "color(display-p3 0.477 0.238 0.405)",
		pink8: "color(display-p3 0.612 0.304 0.51)",
		pink9: "color(display-p3 0.775 0.297 0.61)",
		pink10: "color(display-p3 0.808 0.356 0.645)",
		pink11: "color(display-p3 1 0.535 0.78)",
		pink12: "color(display-p3 0.964 0.826 0.912)"
	};
	const plumDarkP3 = {
		plum1: "color(display-p3 0.09 0.068 0.092)",
		plum2: "color(display-p3 0.118 0.077 0.121)",
		plum3: "color(display-p3 0.192 0.105 0.202)",
		plum4: "color(display-p3 0.25 0.121 0.271)",
		plum5: "color(display-p3 0.293 0.152 0.319)",
		plum6: "color(display-p3 0.343 0.198 0.372)",
		plum7: "color(display-p3 0.424 0.262 0.461)",
		plum8: "color(display-p3 0.54 0.341 0.595)",
		plum9: "color(display-p3 0.624 0.313 0.708)",
		plum10: "color(display-p3 0.666 0.365 0.748)",
		plum11: "color(display-p3 0.86 0.602 0.933)",
		plum12: "color(display-p3 0.936 0.836 0.949)"
	};
	const purpleDarkP3 = {
		purple1: "color(display-p3 0.09 0.068 0.103)",
		purple2: "color(display-p3 0.113 0.082 0.134)",
		purple3: "color(display-p3 0.175 0.112 0.224)",
		purple4: "color(display-p3 0.224 0.137 0.297)",
		purple5: "color(display-p3 0.264 0.167 0.349)",
		purple6: "color(display-p3 0.311 0.208 0.406)",
		purple7: "color(display-p3 0.381 0.266 0.496)",
		purple8: "color(display-p3 0.49 0.349 0.649)",
		purple9: "color(display-p3 0.523 0.318 0.751)",
		purple10: "color(display-p3 0.57 0.373 0.791)",
		purple11: "color(display-p3 0.8 0.62 1)",
		purple12: "color(display-p3 0.913 0.854 0.971)"
	};
	const violetDarkP3 = {
		violet1: "color(display-p3 0.077 0.071 0.118)",
		violet2: "color(display-p3 0.101 0.084 0.141)",
		violet3: "color(display-p3 0.154 0.123 0.256)",
		violet4: "color(display-p3 0.191 0.148 0.345)",
		violet5: "color(display-p3 0.226 0.182 0.396)",
		violet6: "color(display-p3 0.269 0.223 0.449)",
		violet7: "color(display-p3 0.326 0.277 0.53)",
		violet8: "color(display-p3 0.399 0.346 0.656)",
		violet9: "color(display-p3 0.417 0.341 0.784)",
		violet10: "color(display-p3 0.477 0.402 0.823)",
		violet11: "color(display-p3 0.72 0.65 1)",
		violet12: "color(display-p3 0.883 0.867 0.986)"
	};
	const irisDarkP3 = {
		iris1: "color(display-p3 0.075 0.075 0.114)",
		iris2: "color(display-p3 0.089 0.086 0.14)",
		iris3: "color(display-p3 0.128 0.134 0.272)",
		iris4: "color(display-p3 0.153 0.165 0.382)",
		iris5: "color(display-p3 0.192 0.201 0.44)",
		iris6: "color(display-p3 0.239 0.241 0.491)",
		iris7: "color(display-p3 0.291 0.289 0.565)",
		iris8: "color(display-p3 0.35 0.345 0.673)",
		iris9: "color(display-p3 0.357 0.357 0.81)",
		iris10: "color(display-p3 0.428 0.416 0.843)",
		iris11: "color(display-p3 0.685 0.662 1)",
		iris12: "color(display-p3 0.878 0.875 0.986)"
	};
	const indigoDarkP3 = {
		indigo1: "color(display-p3 0.068 0.074 0.118)",
		indigo2: "color(display-p3 0.081 0.089 0.144)",
		indigo3: "color(display-p3 0.105 0.141 0.275)",
		indigo4: "color(display-p3 0.129 0.18 0.369)",
		indigo5: "color(display-p3 0.163 0.22 0.439)",
		indigo6: "color(display-p3 0.203 0.262 0.5)",
		indigo7: "color(display-p3 0.245 0.309 0.575)",
		indigo8: "color(display-p3 0.285 0.362 0.674)",
		indigo9: "color(display-p3 0.276 0.384 0.837)",
		indigo10: "color(display-p3 0.354 0.445 0.866)",
		indigo11: "color(display-p3 0.63 0.69 1)",
		indigo12: "color(display-p3 0.848 0.881 0.99)"
	};
	const blueDarkP3 = {
		blue1: "color(display-p3 0.057 0.081 0.122)",
		blue2: "color(display-p3 0.072 0.098 0.147)",
		blue3: "color(display-p3 0.078 0.154 0.27)",
		blue4: "color(display-p3 0.033 0.197 0.37)",
		blue5: "color(display-p3 0.08 0.245 0.441)",
		blue6: "color(display-p3 0.14 0.298 0.511)",
		blue7: "color(display-p3 0.195 0.361 0.6)",
		blue8: "color(display-p3 0.239 0.434 0.72)",
		blue9: "color(display-p3 0.247 0.556 0.969)",
		blue10: "color(display-p3 0.344 0.612 0.973)",
		blue11: "color(display-p3 0.49 0.72 1)",
		blue12: "color(display-p3 0.788 0.898 0.99)"
	};
	const cyanDarkP3 = {
		cyan1: "color(display-p3 0.053 0.085 0.098)",
		cyan2: "color(display-p3 0.072 0.105 0.122)",
		cyan3: "color(display-p3 0.073 0.168 0.209)",
		cyan4: "color(display-p3 0.063 0.216 0.277)",
		cyan5: "color(display-p3 0.091 0.267 0.336)",
		cyan6: "color(display-p3 0.137 0.324 0.4)",
		cyan7: "color(display-p3 0.186 0.398 0.484)",
		cyan8: "color(display-p3 0.23 0.496 0.6)",
		cyan9: "color(display-p3 0.282 0.627 0.765)",
		cyan10: "color(display-p3 0.331 0.675 0.801)",
		cyan11: "color(display-p3 0.446 0.79 0.887)",
		cyan12: "color(display-p3 0.757 0.919 0.962)"
	};
	const tealDarkP3 = {
		teal1: "color(display-p3 0.059 0.083 0.079)",
		teal2: "color(display-p3 0.075 0.11 0.107)",
		teal3: "color(display-p3 0.087 0.175 0.165)",
		teal4: "color(display-p3 0.087 0.227 0.214)",
		teal5: "color(display-p3 0.12 0.277 0.261)",
		teal6: "color(display-p3 0.162 0.335 0.314)",
		teal7: "color(display-p3 0.205 0.406 0.379)",
		teal8: "color(display-p3 0.245 0.489 0.453)",
		teal9: "color(display-p3 0.297 0.637 0.581)",
		teal10: "color(display-p3 0.319 0.69 0.62)",
		teal11: "color(display-p3 0.388 0.835 0.719)",
		teal12: "color(display-p3 0.734 0.934 0.87)"
	};
	const jadeDarkP3 = {
		jade1: "color(display-p3 0.059 0.083 0.071)",
		jade2: "color(display-p3 0.078 0.11 0.094)",
		jade3: "color(display-p3 0.091 0.176 0.138)",
		jade4: "color(display-p3 0.102 0.228 0.177)",
		jade5: "color(display-p3 0.133 0.279 0.221)",
		jade6: "color(display-p3 0.174 0.334 0.273)",
		jade7: "color(display-p3 0.219 0.402 0.335)",
		jade8: "color(display-p3 0.263 0.488 0.411)",
		jade9: "color(display-p3 0.319 0.63 0.521)",
		jade10: "color(display-p3 0.338 0.68 0.555)",
		jade11: "color(display-p3 0.4 0.835 0.656)",
		jade12: "color(display-p3 0.734 0.934 0.838)"
	};
	const greenDarkP3 = {
		green1: "color(display-p3 0.062 0.083 0.071)",
		green2: "color(display-p3 0.079 0.106 0.09)",
		green3: "color(display-p3 0.1 0.173 0.133)",
		green4: "color(display-p3 0.115 0.229 0.166)",
		green5: "color(display-p3 0.147 0.282 0.206)",
		green6: "color(display-p3 0.185 0.338 0.25)",
		green7: "color(display-p3 0.227 0.403 0.298)",
		green8: "color(display-p3 0.27 0.479 0.351)",
		green9: "color(display-p3 0.332 0.634 0.442)",
		green10: "color(display-p3 0.357 0.682 0.474)",
		green11: "color(display-p3 0.434 0.828 0.573)",
		green12: "color(display-p3 0.747 0.938 0.807)"
	};
	const grassDarkP3 = {
		grass1: "color(display-p3 0.062 0.083 0.067)",
		grass2: "color(display-p3 0.083 0.103 0.085)",
		grass3: "color(display-p3 0.118 0.163 0.122)",
		grass4: "color(display-p3 0.142 0.225 0.15)",
		grass5: "color(display-p3 0.178 0.279 0.186)",
		grass6: "color(display-p3 0.217 0.337 0.224)",
		grass7: "color(display-p3 0.258 0.4 0.264)",
		grass8: "color(display-p3 0.302 0.47 0.305)",
		grass9: "color(display-p3 0.38 0.647 0.378)",
		grass10: "color(display-p3 0.426 0.694 0.426)",
		grass11: "color(display-p3 0.535 0.807 0.542)",
		grass12: "color(display-p3 0.797 0.936 0.776)"
	};
	const brownDarkP3 = {
		brown1: "color(display-p3 0.071 0.067 0.059)",
		brown2: "color(display-p3 0.107 0.095 0.087)",
		brown3: "color(display-p3 0.151 0.13 0.115)",
		brown4: "color(display-p3 0.191 0.161 0.138)",
		brown5: "color(display-p3 0.235 0.194 0.162)",
		brown6: "color(display-p3 0.291 0.237 0.192)",
		brown7: "color(display-p3 0.365 0.295 0.232)",
		brown8: "color(display-p3 0.469 0.377 0.287)",
		brown9: "color(display-p3 0.651 0.505 0.368)",
		brown10: "color(display-p3 0.697 0.557 0.423)",
		brown11: "color(display-p3 0.835 0.715 0.597)",
		brown12: "color(display-p3 0.938 0.885 0.802)"
	};
	const skyDarkP3 = {
		sky1: "color(display-p3 0.056 0.078 0.116)",
		sky2: "color(display-p3 0.075 0.101 0.149)",
		sky3: "color(display-p3 0.089 0.154 0.244)",
		sky4: "color(display-p3 0.106 0.207 0.323)",
		sky5: "color(display-p3 0.135 0.261 0.394)",
		sky6: "color(display-p3 0.17 0.322 0.469)",
		sky7: "color(display-p3 0.205 0.394 0.557)",
		sky8: "color(display-p3 0.232 0.48 0.665)",
		sky9: "color(display-p3 0.585 0.877 0.983)",
		sky10: "color(display-p3 0.718 0.925 0.991)",
		sky11: "color(display-p3 0.536 0.772 0.924)",
		sky12: "color(display-p3 0.799 0.947 0.993)"
	};
	const mintDarkP3 = {
		mint1: "color(display-p3 0.059 0.082 0.081)",
		mint2: "color(display-p3 0.068 0.104 0.105)",
		mint3: "color(display-p3 0.077 0.17 0.168)",
		mint4: "color(display-p3 0.068 0.224 0.22)",
		mint5: "color(display-p3 0.104 0.275 0.264)",
		mint6: "color(display-p3 0.154 0.332 0.313)",
		mint7: "color(display-p3 0.207 0.403 0.373)",
		mint8: "color(display-p3 0.258 0.49 0.441)",
		mint9: "color(display-p3 0.62 0.908 0.834)",
		mint10: "color(display-p3 0.725 0.954 0.898)",
		mint11: "color(display-p3 0.482 0.825 0.733)",
		mint12: "color(display-p3 0.807 0.955 0.887)"
	};
	const limeDarkP3 = {
		lime1: "color(display-p3 0.067 0.073 0.048)",
		lime2: "color(display-p3 0.086 0.1 0.067)",
		lime3: "color(display-p3 0.13 0.16 0.099)",
		lime4: "color(display-p3 0.172 0.214 0.126)",
		lime5: "color(display-p3 0.213 0.266 0.153)",
		lime6: "color(display-p3 0.257 0.321 0.182)",
		lime7: "color(display-p3 0.307 0.383 0.215)",
		lime8: "color(display-p3 0.365 0.456 0.25)",
		lime9: "color(display-p3 0.78 0.928 0.466)",
		lime10: "color(display-p3 0.865 0.995 0.519)",
		lime11: "color(display-p3 0.771 0.893 0.485)",
		lime12: "color(display-p3 0.905 0.966 0.753)"
	};
	const yellowDarkP3 = {
		yellow1: "color(display-p3 0.078 0.069 0.047)",
		yellow2: "color(display-p3 0.103 0.094 0.063)",
		yellow3: "color(display-p3 0.168 0.137 0.039)",
		yellow4: "color(display-p3 0.209 0.169 0)",
		yellow5: "color(display-p3 0.255 0.209 0)",
		yellow6: "color(display-p3 0.31 0.261 0.07)",
		yellow7: "color(display-p3 0.389 0.331 0.135)",
		yellow8: "color(display-p3 0.497 0.42 0.182)",
		yellow9: "color(display-p3 1 0.92 0.22)",
		yellow10: "color(display-p3 1 1 0.456)",
		yellow11: "color(display-p3 0.948 0.885 0.392)",
		yellow12: "color(display-p3 0.959 0.934 0.731)"
	};
	const amberDarkP3 = {
		amber1: "color(display-p3 0.082 0.07 0.05)",
		amber2: "color(display-p3 0.111 0.094 0.064)",
		amber3: "color(display-p3 0.178 0.128 0.049)",
		amber4: "color(display-p3 0.239 0.156 0)",
		amber5: "color(display-p3 0.29 0.193 0)",
		amber6: "color(display-p3 0.344 0.245 0.076)",
		amber7: "color(display-p3 0.422 0.314 0.141)",
		amber8: "color(display-p3 0.535 0.399 0.189)",
		amber9: "color(display-p3 1 0.77 0.26)",
		amber10: "color(display-p3 1 0.87 0.15)",
		amber11: "color(display-p3 1 0.8 0.29)",
		amber12: "color(display-p3 0.984 0.909 0.726)"
	};
	const orangeDarkP3 = {
		orange1: "color(display-p3 0.088 0.07 0.057)",
		orange2: "color(display-p3 0.113 0.089 0.061)",
		orange3: "color(display-p3 0.189 0.12 0.056)",
		orange4: "color(display-p3 0.262 0.132 0)",
		orange5: "color(display-p3 0.315 0.168 0.016)",
		orange6: "color(display-p3 0.376 0.219 0.088)",
		orange7: "color(display-p3 0.465 0.283 0.147)",
		orange8: "color(display-p3 0.601 0.359 0.201)",
		orange9: "color(display-p3 0.9 0.45 0.2)",
		orange10: "color(display-p3 0.98 0.51 0.23)",
		orange11: "color(display-p3 1 0.63 0.38)",
		orange12: "color(display-p3 0.98 0.883 0.775)"
	};
	const grayP3 = {
		gray1: "color(display-p3 0.988 0.988 0.988)",
		gray2: "color(display-p3 0.975 0.975 0.975)",
		gray3: "color(display-p3 0.939 0.939 0.939)",
		gray4: "color(display-p3 0.908 0.908 0.908)",
		gray5: "color(display-p3 0.88 0.88 0.88)",
		gray6: "color(display-p3 0.849 0.849 0.849)",
		gray7: "color(display-p3 0.807 0.807 0.807)",
		gray8: "color(display-p3 0.732 0.732 0.732)",
		gray9: "color(display-p3 0.553 0.553 0.553)",
		gray10: "color(display-p3 0.512 0.512 0.512)",
		gray11: "color(display-p3 0.392 0.392 0.392)",
		gray12: "color(display-p3 0.125 0.125 0.125)"
	};
	const mauveP3 = {
		mauve1: "color(display-p3 0.991 0.988 0.992)",
		mauve2: "color(display-p3 0.98 0.976 0.984)",
		mauve3: "color(display-p3 0.946 0.938 0.952)",
		mauve4: "color(display-p3 0.915 0.906 0.925)",
		mauve5: "color(display-p3 0.886 0.876 0.901)",
		mauve6: "color(display-p3 0.856 0.846 0.875)",
		mauve7: "color(display-p3 0.814 0.804 0.84)",
		mauve8: "color(display-p3 0.735 0.728 0.777)",
		mauve9: "color(display-p3 0.555 0.549 0.596)",
		mauve10: "color(display-p3 0.514 0.508 0.552)",
		mauve11: "color(display-p3 0.395 0.388 0.424)",
		mauve12: "color(display-p3 0.128 0.122 0.147)"
	};
	const slateP3 = {
		slate1: "color(display-p3 0.988 0.988 0.992)",
		slate2: "color(display-p3 0.976 0.976 0.984)",
		slate3: "color(display-p3 0.94 0.941 0.953)",
		slate4: "color(display-p3 0.908 0.909 0.925)",
		slate5: "color(display-p3 0.88 0.881 0.901)",
		slate6: "color(display-p3 0.85 0.852 0.876)",
		slate7: "color(display-p3 0.805 0.808 0.838)",
		slate8: "color(display-p3 0.727 0.733 0.773)",
		slate9: "color(display-p3 0.547 0.553 0.592)",
		slate10: "color(display-p3 0.503 0.512 0.549)",
		slate11: "color(display-p3 0.379 0.392 0.421)",
		slate12: "color(display-p3 0.113 0.125 0.14)"
	};
	const sageP3 = {
		sage1: "color(display-p3 0.986 0.992 0.988)",
		sage2: "color(display-p3 0.97 0.977 0.974)",
		sage3: "color(display-p3 0.935 0.944 0.94)",
		sage4: "color(display-p3 0.904 0.913 0.909)",
		sage5: "color(display-p3 0.875 0.885 0.88)",
		sage6: "color(display-p3 0.844 0.854 0.849)",
		sage7: "color(display-p3 0.8 0.811 0.806)",
		sage8: "color(display-p3 0.725 0.738 0.732)",
		sage9: "color(display-p3 0.531 0.556 0.546)",
		sage10: "color(display-p3 0.492 0.515 0.506)",
		sage11: "color(display-p3 0.377 0.395 0.389)",
		sage12: "color(display-p3 0.107 0.129 0.118)"
	};
	const oliveP3 = {
		olive1: "color(display-p3 0.989 0.992 0.989)",
		olive2: "color(display-p3 0.974 0.98 0.973)",
		olive3: "color(display-p3 0.939 0.945 0.937)",
		olive4: "color(display-p3 0.907 0.914 0.905)",
		olive5: "color(display-p3 0.878 0.885 0.875)",
		olive6: "color(display-p3 0.846 0.855 0.843)",
		olive7: "color(display-p3 0.803 0.812 0.8)",
		olive8: "color(display-p3 0.727 0.738 0.723)",
		olive9: "color(display-p3 0.541 0.556 0.532)",
		olive10: "color(display-p3 0.5 0.515 0.491)",
		olive11: "color(display-p3 0.38 0.395 0.374)",
		olive12: "color(display-p3 0.117 0.129 0.111)"
	};
	const sandP3 = {
		sand1: "color(display-p3 0.992 0.992 0.989)",
		sand2: "color(display-p3 0.977 0.977 0.973)",
		sand3: "color(display-p3 0.943 0.942 0.936)",
		sand4: "color(display-p3 0.913 0.912 0.903)",
		sand5: "color(display-p3 0.885 0.883 0.873)",
		sand6: "color(display-p3 0.854 0.852 0.839)",
		sand7: "color(display-p3 0.813 0.81 0.794)",
		sand8: "color(display-p3 0.738 0.734 0.713)",
		sand9: "color(display-p3 0.553 0.553 0.528)",
		sand10: "color(display-p3 0.511 0.511 0.488)",
		sand11: "color(display-p3 0.388 0.388 0.37)",
		sand12: "color(display-p3 0.129 0.126 0.111)"
	};
	const tomatoP3 = {
		tomato1: "color(display-p3 0.998 0.989 0.988)",
		tomato2: "color(display-p3 0.994 0.974 0.969)",
		tomato3: "color(display-p3 0.985 0.924 0.909)",
		tomato4: "color(display-p3 0.996 0.868 0.835)",
		tomato5: "color(display-p3 0.98 0.812 0.77)",
		tomato6: "color(display-p3 0.953 0.75 0.698)",
		tomato7: "color(display-p3 0.917 0.673 0.611)",
		tomato8: "color(display-p3 0.875 0.575 0.502)",
		tomato9: "color(display-p3 0.831 0.345 0.231)",
		tomato10: "color(display-p3 0.802 0.313 0.2)",
		tomato11: "color(display-p3 0.755 0.259 0.152)",
		tomato12: "color(display-p3 0.335 0.165 0.132)"
	};
	const redP3 = {
		red1: "color(display-p3 0.998 0.989 0.988)",
		red2: "color(display-p3 0.995 0.971 0.971)",
		red3: "color(display-p3 0.985 0.925 0.925)",
		red4: "color(display-p3 0.999 0.866 0.866)",
		red5: "color(display-p3 0.984 0.812 0.811)",
		red6: "color(display-p3 0.955 0.751 0.749)",
		red7: "color(display-p3 0.915 0.675 0.672)",
		red8: "color(display-p3 0.872 0.575 0.572)",
		red9: "color(display-p3 0.83 0.329 0.324)",
		red10: "color(display-p3 0.798 0.294 0.285)",
		red11: "color(display-p3 0.744 0.234 0.222)",
		red12: "color(display-p3 0.36 0.115 0.143)"
	};
	const rubyP3 = {
		ruby1: "color(display-p3 0.998 0.989 0.992)",
		ruby2: "color(display-p3 0.995 0.971 0.974)",
		ruby3: "color(display-p3 0.983 0.92 0.928)",
		ruby4: "color(display-p3 0.987 0.869 0.885)",
		ruby5: "color(display-p3 0.968 0.817 0.839)",
		ruby6: "color(display-p3 0.937 0.758 0.786)",
		ruby7: "color(display-p3 0.897 0.685 0.721)",
		ruby8: "color(display-p3 0.851 0.588 0.639)",
		ruby9: "color(display-p3 0.83 0.323 0.408)",
		ruby10: "color(display-p3 0.795 0.286 0.375)",
		ruby11: "color(display-p3 0.728 0.211 0.311)",
		ruby12: "color(display-p3 0.36 0.115 0.171)"
	};
	const crimsonP3 = {
		crimson1: "color(display-p3 0.998 0.989 0.992)",
		crimson2: "color(display-p3 0.991 0.969 0.976)",
		crimson3: "color(display-p3 0.987 0.917 0.941)",
		crimson4: "color(display-p3 0.975 0.866 0.904)",
		crimson5: "color(display-p3 0.953 0.813 0.864)",
		crimson6: "color(display-p3 0.921 0.755 0.817)",
		crimson7: "color(display-p3 0.88 0.683 0.761)",
		crimson8: "color(display-p3 0.834 0.592 0.694)",
		crimson9: "color(display-p3 0.843 0.298 0.507)",
		crimson10: "color(display-p3 0.807 0.266 0.468)",
		crimson11: "color(display-p3 0.731 0.195 0.388)",
		crimson12: "color(display-p3 0.352 0.111 0.221)"
	};
	const pinkP3 = {
		pink1: "color(display-p3 0.998 0.989 0.996)",
		pink2: "color(display-p3 0.992 0.97 0.985)",
		pink3: "color(display-p3 0.981 0.917 0.96)",
		pink4: "color(display-p3 0.963 0.867 0.932)",
		pink5: "color(display-p3 0.939 0.815 0.899)",
		pink6: "color(display-p3 0.907 0.756 0.859)",
		pink7: "color(display-p3 0.869 0.683 0.81)",
		pink8: "color(display-p3 0.825 0.59 0.751)",
		pink9: "color(display-p3 0.775 0.297 0.61)",
		pink10: "color(display-p3 0.748 0.27 0.581)",
		pink11: "color(display-p3 0.698 0.219 0.528)",
		pink12: "color(display-p3 0.363 0.101 0.279)"
	};
	const plumP3 = {
		plum1: "color(display-p3 0.995 0.988 0.999)",
		plum2: "color(display-p3 0.988 0.971 0.99)",
		plum3: "color(display-p3 0.973 0.923 0.98)",
		plum4: "color(display-p3 0.953 0.875 0.966)",
		plum5: "color(display-p3 0.926 0.825 0.945)",
		plum6: "color(display-p3 0.89 0.765 0.916)",
		plum7: "color(display-p3 0.84 0.686 0.877)",
		plum8: "color(display-p3 0.775 0.58 0.832)",
		plum9: "color(display-p3 0.624 0.313 0.708)",
		plum10: "color(display-p3 0.587 0.29 0.667)",
		plum11: "color(display-p3 0.543 0.263 0.619)",
		plum12: "color(display-p3 0.299 0.114 0.352)"
	};
	const purpleP3 = {
		purple1: "color(display-p3 0.995 0.988 0.996)",
		purple2: "color(display-p3 0.983 0.971 0.993)",
		purple3: "color(display-p3 0.963 0.931 0.989)",
		purple4: "color(display-p3 0.937 0.888 0.981)",
		purple5: "color(display-p3 0.904 0.837 0.966)",
		purple6: "color(display-p3 0.86 0.774 0.942)",
		purple7: "color(display-p3 0.799 0.69 0.91)",
		purple8: "color(display-p3 0.719 0.583 0.874)",
		purple9: "color(display-p3 0.523 0.318 0.751)",
		purple10: "color(display-p3 0.483 0.289 0.7)",
		purple11: "color(display-p3 0.473 0.281 0.687)",
		purple12: "color(display-p3 0.234 0.132 0.363)"
	};
	const violetP3 = {
		violet1: "color(display-p3 0.991 0.988 0.995)",
		violet2: "color(display-p3 0.978 0.974 0.998)",
		violet3: "color(display-p3 0.953 0.943 0.993)",
		violet4: "color(display-p3 0.916 0.897 1)",
		violet5: "color(display-p3 0.876 0.851 1)",
		violet6: "color(display-p3 0.825 0.793 0.981)",
		violet7: "color(display-p3 0.752 0.712 0.943)",
		violet8: "color(display-p3 0.654 0.602 0.902)",
		violet9: "color(display-p3 0.417 0.341 0.784)",
		violet10: "color(display-p3 0.381 0.306 0.741)",
		violet11: "color(display-p3 0.383 0.317 0.702)",
		violet12: "color(display-p3 0.179 0.15 0.359)"
	};
	const irisP3 = {
		iris1: "color(display-p3 0.992 0.992 0.999)",
		iris2: "color(display-p3 0.972 0.973 0.998)",
		iris3: "color(display-p3 0.943 0.945 0.992)",
		iris4: "color(display-p3 0.902 0.906 1)",
		iris5: "color(display-p3 0.857 0.861 1)",
		iris6: "color(display-p3 0.799 0.805 0.987)",
		iris7: "color(display-p3 0.721 0.727 0.955)",
		iris8: "color(display-p3 0.61 0.619 0.918)",
		iris9: "color(display-p3 0.357 0.357 0.81)",
		iris10: "color(display-p3 0.318 0.318 0.774)",
		iris11: "color(display-p3 0.337 0.326 0.748)",
		iris12: "color(display-p3 0.154 0.161 0.371)"
	};
	const indigoP3 = {
		indigo1: "color(display-p3 0.992 0.992 0.996)",
		indigo2: "color(display-p3 0.971 0.977 0.998)",
		indigo3: "color(display-p3 0.933 0.948 0.992)",
		indigo4: "color(display-p3 0.885 0.914 1)",
		indigo5: "color(display-p3 0.831 0.87 1)",
		indigo6: "color(display-p3 0.767 0.814 0.995)",
		indigo7: "color(display-p3 0.685 0.74 0.957)",
		indigo8: "color(display-p3 0.569 0.639 0.916)",
		indigo9: "color(display-p3 0.276 0.384 0.837)",
		indigo10: "color(display-p3 0.234 0.343 0.801)",
		indigo11: "color(display-p3 0.256 0.354 0.755)",
		indigo12: "color(display-p3 0.133 0.175 0.348)"
	};
	const blueP3 = {
		blue1: "color(display-p3 0.986 0.992 0.999)",
		blue2: "color(display-p3 0.96 0.979 0.998)",
		blue3: "color(display-p3 0.912 0.956 0.991)",
		blue4: "color(display-p3 0.853 0.932 1)",
		blue5: "color(display-p3 0.788 0.894 0.998)",
		blue6: "color(display-p3 0.709 0.843 0.976)",
		blue7: "color(display-p3 0.606 0.777 0.947)",
		blue8: "color(display-p3 0.451 0.688 0.917)",
		blue9: "color(display-p3 0.247 0.556 0.969)",
		blue10: "color(display-p3 0.234 0.523 0.912)",
		blue11: "color(display-p3 0.15 0.44 0.84)",
		blue12: "color(display-p3 0.102 0.193 0.379)"
	};
	const cyanP3 = {
		cyan1: "color(display-p3 0.982 0.992 0.996)",
		cyan2: "color(display-p3 0.955 0.981 0.984)",
		cyan3: "color(display-p3 0.888 0.965 0.975)",
		cyan4: "color(display-p3 0.821 0.941 0.959)",
		cyan5: "color(display-p3 0.751 0.907 0.935)",
		cyan6: "color(display-p3 0.671 0.862 0.9)",
		cyan7: "color(display-p3 0.564 0.8 0.854)",
		cyan8: "color(display-p3 0.388 0.715 0.798)",
		cyan9: "color(display-p3 0.282 0.627 0.765)",
		cyan10: "color(display-p3 0.264 0.583 0.71)",
		cyan11: "color(display-p3 0.08 0.48 0.63)",
		cyan12: "color(display-p3 0.108 0.232 0.277)"
	};
	const tealP3 = {
		teal1: "color(display-p3 0.983 0.996 0.992)",
		teal2: "color(display-p3 0.958 0.983 0.976)",
		teal3: "color(display-p3 0.895 0.971 0.952)",
		teal4: "color(display-p3 0.831 0.949 0.92)",
		teal5: "color(display-p3 0.761 0.914 0.878)",
		teal6: "color(display-p3 0.682 0.864 0.825)",
		teal7: "color(display-p3 0.581 0.798 0.756)",
		teal8: "color(display-p3 0.433 0.716 0.671)",
		teal9: "color(display-p3 0.297 0.637 0.581)",
		teal10: "color(display-p3 0.275 0.599 0.542)",
		teal11: "color(display-p3 0.08 0.5 0.43)",
		teal12: "color(display-p3 0.11 0.235 0.219)"
	};
	const jadeP3 = {
		jade1: "color(display-p3 0.986 0.996 0.992)",
		jade2: "color(display-p3 0.962 0.983 0.969)",
		jade3: "color(display-p3 0.912 0.965 0.932)",
		jade4: "color(display-p3 0.858 0.941 0.893)",
		jade5: "color(display-p3 0.795 0.909 0.847)",
		jade6: "color(display-p3 0.715 0.864 0.791)",
		jade7: "color(display-p3 0.603 0.802 0.718)",
		jade8: "color(display-p3 0.44 0.72 0.629)",
		jade9: "color(display-p3 0.319 0.63 0.521)",
		jade10: "color(display-p3 0.299 0.592 0.488)",
		jade11: "color(display-p3 0.15 0.5 0.37)",
		jade12: "color(display-p3 0.142 0.229 0.194)"
	};
	const greenP3 = {
		green1: "color(display-p3 0.986 0.996 0.989)",
		green2: "color(display-p3 0.963 0.983 0.967)",
		green3: "color(display-p3 0.913 0.964 0.925)",
		green4: "color(display-p3 0.859 0.94 0.879)",
		green5: "color(display-p3 0.796 0.907 0.826)",
		green6: "color(display-p3 0.718 0.863 0.761)",
		green7: "color(display-p3 0.61 0.801 0.675)",
		green8: "color(display-p3 0.451 0.715 0.559)",
		green9: "color(display-p3 0.332 0.634 0.442)",
		green10: "color(display-p3 0.308 0.595 0.417)",
		green11: "color(display-p3 0.19 0.5 0.32)",
		green12: "color(display-p3 0.132 0.228 0.18)"
	};
	const grassP3 = {
		grass1: "color(display-p3 0.986 0.996 0.985)",
		grass2: "color(display-p3 0.966 0.983 0.964)",
		grass3: "color(display-p3 0.923 0.965 0.917)",
		grass4: "color(display-p3 0.872 0.94 0.865)",
		grass5: "color(display-p3 0.811 0.908 0.802)",
		grass6: "color(display-p3 0.733 0.864 0.724)",
		grass7: "color(display-p3 0.628 0.803 0.622)",
		grass8: "color(display-p3 0.477 0.72 0.482)",
		grass9: "color(display-p3 0.38 0.647 0.378)",
		grass10: "color(display-p3 0.344 0.598 0.342)",
		grass11: "color(display-p3 0.263 0.488 0.261)",
		grass12: "color(display-p3 0.151 0.233 0.153)"
	};
	const brownP3 = {
		brown1: "color(display-p3 0.995 0.992 0.989)",
		brown2: "color(display-p3 0.987 0.976 0.964)",
		brown3: "color(display-p3 0.959 0.936 0.909)",
		brown4: "color(display-p3 0.934 0.897 0.855)",
		brown5: "color(display-p3 0.909 0.856 0.798)",
		brown6: "color(display-p3 0.88 0.808 0.73)",
		brown7: "color(display-p3 0.841 0.742 0.639)",
		brown8: "color(display-p3 0.782 0.647 0.514)",
		brown9: "color(display-p3 0.651 0.505 0.368)",
		brown10: "color(display-p3 0.601 0.465 0.344)",
		brown11: "color(display-p3 0.485 0.374 0.288)",
		brown12: "color(display-p3 0.236 0.202 0.183)"
	};
	const skyP3 = {
		sky1: "color(display-p3 0.98 0.995 0.999)",
		sky2: "color(display-p3 0.953 0.98 0.99)",
		sky3: "color(display-p3 0.899 0.963 0.989)",
		sky4: "color(display-p3 0.842 0.937 0.977)",
		sky5: "color(display-p3 0.777 0.9 0.954)",
		sky6: "color(display-p3 0.701 0.851 0.921)",
		sky7: "color(display-p3 0.604 0.785 0.879)",
		sky8: "color(display-p3 0.457 0.696 0.829)",
		sky9: "color(display-p3 0.585 0.877 0.983)",
		sky10: "color(display-p3 0.555 0.845 0.959)",
		sky11: "color(display-p3 0.193 0.448 0.605)",
		sky12: "color(display-p3 0.145 0.241 0.329)"
	};
	const mintP3 = {
		mint1: "color(display-p3 0.98 0.995 0.992)",
		mint2: "color(display-p3 0.957 0.985 0.977)",
		mint3: "color(display-p3 0.888 0.972 0.95)",
		mint4: "color(display-p3 0.819 0.951 0.916)",
		mint5: "color(display-p3 0.747 0.918 0.873)",
		mint6: "color(display-p3 0.668 0.87 0.818)",
		mint7: "color(display-p3 0.567 0.805 0.744)",
		mint8: "color(display-p3 0.42 0.724 0.649)",
		mint9: "color(display-p3 0.62 0.908 0.834)",
		mint10: "color(display-p3 0.585 0.871 0.797)",
		mint11: "color(display-p3 0.203 0.463 0.397)",
		mint12: "color(display-p3 0.136 0.259 0.236)"
	};
	const limeP3 = {
		lime1: "color(display-p3 0.989 0.992 0.981)",
		lime2: "color(display-p3 0.975 0.98 0.954)",
		lime3: "color(display-p3 0.939 0.965 0.851)",
		lime4: "color(display-p3 0.896 0.94 0.76)",
		lime5: "color(display-p3 0.843 0.903 0.678)",
		lime6: "color(display-p3 0.778 0.852 0.599)",
		lime7: "color(display-p3 0.694 0.784 0.508)",
		lime8: "color(display-p3 0.585 0.707 0.378)",
		lime9: "color(display-p3 0.78 0.928 0.466)",
		lime10: "color(display-p3 0.734 0.896 0.397)",
		lime11: "color(display-p3 0.386 0.482 0.227)",
		lime12: "color(display-p3 0.222 0.25 0.128)"
	};
	const yellowP3 = {
		yellow1: "color(display-p3 0.992 0.992 0.978)",
		yellow2: "color(display-p3 0.995 0.99 0.922)",
		yellow3: "color(display-p3 0.997 0.982 0.749)",
		yellow4: "color(display-p3 0.992 0.953 0.627)",
		yellow5: "color(display-p3 0.984 0.91 0.51)",
		yellow6: "color(display-p3 0.934 0.847 0.474)",
		yellow7: "color(display-p3 0.876 0.785 0.46)",
		yellow8: "color(display-p3 0.811 0.689 0.313)",
		yellow9: "color(display-p3 1 0.92 0.22)",
		yellow10: "color(display-p3 0.977 0.868 0.291)",
		yellow11: "color(display-p3 0.6 0.44 0)",
		yellow12: "color(display-p3 0.271 0.233 0.137)"
	};
	const amberP3 = {
		amber1: "color(display-p3 0.995 0.992 0.985)",
		amber2: "color(display-p3 0.994 0.986 0.921)",
		amber3: "color(display-p3 0.994 0.969 0.782)",
		amber4: "color(display-p3 0.989 0.937 0.65)",
		amber5: "color(display-p3 0.97 0.902 0.527)",
		amber6: "color(display-p3 0.936 0.844 0.506)",
		amber7: "color(display-p3 0.89 0.762 0.443)",
		amber8: "color(display-p3 0.85 0.65 0.3)",
		amber9: "color(display-p3 1 0.77 0.26)",
		amber10: "color(display-p3 0.959 0.741 0.274)",
		amber11: "color(display-p3 0.64 0.4 0)",
		amber12: "color(display-p3 0.294 0.208 0.145)"
	};
	const orangeP3 = {
		orange1: "color(display-p3 0.995 0.988 0.985)",
		orange2: "color(display-p3 0.994 0.968 0.934)",
		orange3: "color(display-p3 0.989 0.938 0.85)",
		orange4: "color(display-p3 1 0.874 0.687)",
		orange5: "color(display-p3 1 0.821 0.583)",
		orange6: "color(display-p3 0.975 0.767 0.545)",
		orange7: "color(display-p3 0.919 0.693 0.486)",
		orange8: "color(display-p3 0.877 0.597 0.379)",
		orange9: "color(display-p3 0.9 0.45 0.2)",
		orange10: "color(display-p3 0.87 0.409 0.164)",
		orange11: "color(display-p3 0.76 0.34 0)",
		orange12: "color(display-p3 0.323 0.185 0.127)"
	};
	exports.amberDarkP3 = amberDarkP3;
	exports.amberP3 = amberP3;
	exports.blueDarkP3 = blueDarkP3;
	exports.blueP3 = blueP3;
	exports.brownDarkP3 = brownDarkP3;
	exports.brownP3 = brownP3;
	exports.crimsonDarkP3 = crimsonDarkP3;
	exports.crimsonP3 = crimsonP3;
	exports.cyanDarkP3 = cyanDarkP3;
	exports.cyanP3 = cyanP3;
	exports.grassDarkP3 = grassDarkP3;
	exports.grassP3 = grassP3;
	exports.grayDarkP3 = grayDarkP3;
	exports.grayP3 = grayP3;
	exports.greenDarkP3 = greenDarkP3;
	exports.greenP3 = greenP3;
	exports.indigoDarkP3 = indigoDarkP3;
	exports.indigoP3 = indigoP3;
	exports.irisDarkP3 = irisDarkP3;
	exports.irisP3 = irisP3;
	exports.jadeDarkP3 = jadeDarkP3;
	exports.jadeP3 = jadeP3;
	exports.limeDarkP3 = limeDarkP3;
	exports.limeP3 = limeP3;
	exports.mauveDarkP3 = mauveDarkP3;
	exports.mauveP3 = mauveP3;
	exports.mintDarkP3 = mintDarkP3;
	exports.mintP3 = mintP3;
	exports.oliveDarkP3 = oliveDarkP3;
	exports.oliveP3 = oliveP3;
	exports.orangeDarkP3 = orangeDarkP3;
	exports.orangeP3 = orangeP3;
	exports.pinkDarkP3 = pinkDarkP3;
	exports.pinkP3 = pinkP3;
	exports.plumDarkP3 = plumDarkP3;
	exports.plumP3 = plumP3;
	exports.purpleDarkP3 = purpleDarkP3;
	exports.purpleP3 = purpleP3;
	exports.redDarkP3 = redDarkP3;
	exports.redP3 = redP3;
	exports.rubyDarkP3 = rubyDarkP3;
	exports.rubyP3 = rubyP3;
	exports.sageDarkP3 = sageDarkP3;
	exports.sageP3 = sageP3;
	exports.sandDarkP3 = sandDarkP3;
	exports.sandP3 = sandP3;
	exports.skyDarkP3 = skyDarkP3;
	exports.skyP3 = skyP3;
	exports.slateDarkP3 = slateDarkP3;
	exports.slateP3 = slateP3;
	exports.tealDarkP3 = tealDarkP3;
	exports.tealP3 = tealP3;
	exports.tomatoDarkP3 = tomatoDarkP3;
	exports.tomatoP3 = tomatoP3;
	exports.violetDarkP3 = violetDarkP3;
	exports.violetP3 = violetP3;
	exports.yellowDarkP3 = yellowDarkP3;
	exports.yellowP3 = yellowP3;
})))(), 1);
/**
* https://github.com/gre/bezier-easing
* BezierEasing - use bezier curve for transition easing function
* by Gaëtan Renaudeau 2014 - 2015 – MIT License
*
* Algebraic solver by Dmitry Baranovskiy
* http://dmitry.baranovskiy.com/bezier-easing.html
*/
function LinearEasing(x) {
	return x;
}
const { cbrt, sqrt, PI: π } = Math;
const x2t = (x, a, b, c, d) => {
	const q = a + b * x;
	const s = Math.pow(q, 2) + c;
	if (s > 0) {
		const root = sqrt(s);
		return cbrt(q + root) + cbrt(q - root) - d;
	}
	const l = cbrt(sqrt(q * q - s));
	const angle = q ? Math.atan(sqrt(-s) / q) : -π / 2;
	let φ;
	if (b < 0) φ = (q > 0 ? 2 * π : π) - angle;
	else if (d < 0) φ = (q > 0 ? 2 * π : -3 * π) + angle;
	else φ = (q > 0 ? 0 : π) + angle;
	return 2 * l * Math.cos(φ / 3) - d;
};
const Y = (t, ay, by, cy) => ((ay * t + 3 * by) * t + cy) * t;
function bezier(mX1, mY1, mX2, mY2) {
	if (!(0 <= mX1 && mX1 <= 1 && 0 <= mX2 && mX2 <= 1)) throw new Error("bezier x values must be in [0, 1] range");
	if (mX1 === mY1 && mX2 === mY2) return LinearEasing;
	const a = 6 * (3 * mX1 - 3 * mX2 + 1);
	const b = 6 * (mX2 - 2 * mX1);
	const c = 3 * mX1;
	const a2 = a * a;
	const b2 = b * b;
	const d = b / a;
	const e = 3 * b * c / a2 - b2 * b / (a2 * a);
	const w1 = 2 * c / a - b2 / a2;
	const w = w1 * w1 * w1;
	const o = 3 / a;
	const ay = 3 * mY1 - 3 * mY2 + 1;
	const by = mY2 - 2 * mY1;
	const cy = 3 * mY1;
	const X2T = a ? x2t : LinearEasing;
	return function BezierEasing(x) {
		if (x === 0 || x === 1) return x;
		return Y(X2T(x, e, o, w, d), ay, by, cy);
	};
}
//#endregion
//#region \0@oxc-project+runtime@0.146.0/helpers/esm/objectSpread2.js
function ownKeys(e, r) {
	var t = Object.keys(e);
	if (Object.getOwnPropertySymbols) {
		var o = Object.getOwnPropertySymbols(e);
		r && (o = o.filter(function(r) {
			return Object.getOwnPropertyDescriptor(e, r).enumerable;
		})), t.push.apply(t, o);
	}
	return t;
}
function _objectSpread2(e) {
	for (var r = 1; r < arguments.length; r++) {
		var t = null != arguments[r] ? arguments[r] : {};
		r % 2 ? ownKeys(Object(t), !0).forEach(function(r) {
			_defineProperty(e, r, t[r]);
		}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function(r) {
			Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
		});
	}
	return e;
}
//#endregion
//#region src/palette/parse.ts
const TERMINAL_COLOR_NAMES = [
	"red",
	"yellow",
	"green",
	"cyan",
	"blue",
	"magenta",
	"orange",
	"brown"
];
const PALETTE_COLOR_NAMES = [
	"accent",
	"selection",
	"muted",
	"background",
	"dark_background",
	"darker_background",
	"lighter_background",
	"foreground",
	"dark_foreground",
	"light_foreground",
	"bright_foreground",
	"red",
	"yellow",
	"orange",
	"green",
	"cyan",
	"blue",
	"magenta",
	"brown",
	"bright_red",
	"bright_yellow",
	"bright_green",
	"bright_cyan",
	"bright_blue",
	"bright_magenta"
];
function normalizeHex(value, label) {
	if (typeof value !== "string") throw new TypeError(`${label} must be a color string`);
	try {
		const serialized = new Color(value).to("srgb").toString({ format: "hex" });
		if (!/^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(serialized)) throw new Error("color must be opaque");
		if (serialized.length === 4) return `#${serialized[1]}${serialized[1]}${serialized[2]}${serialized[2]}${serialized[3]}${serialized[3]}`.toLowerCase();
		return serialized.slice(0, 7).toLowerCase();
	} catch (error) {
		throw new TypeError(`${label} is not a valid color`, { cause: error });
	}
}
function record(value, label) {
	if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object`);
	return value;
}
function strict(value, keys, label) {
	const unknown = Object.keys(value).find((key) => !keys.includes(key));
	if (unknown) throw new TypeError(`${label}.${unknown} is not allowed`);
}
function colorRecord(value, keys, label) {
	const input = record(value, label);
	strict(input, keys, label);
	return Object.entries(input).reduce((colors, [key, color]) => {
		colors[key] = normalizeHex(color, `${label}.${key}`);
		return colors;
	}, {});
}
function seeds(value, label) {
	const input = record(value, label);
	strict(input, [
		"surface",
		"neutral",
		"accent",
		"terminal",
		"overrides"
	], label);
	return _objectSpread2({
		surface: normalizeHex(input.surface, `${label}.surface`),
		neutral: normalizeHex(input.neutral, `${label}.neutral`),
		accent: normalizeHex(input.accent, `${label}.accent`),
		terminal: colorRecord(input.terminal, TERMINAL_COLOR_NAMES, `${label}.terminal`)
	}, input.overrides === void 0 ? {} : { overrides: colorRecord(input.overrides, PALETTE_COLOR_NAMES, `${label}.overrides`) });
}
function parseConfig(input) {
	const config = record(input, "config");
	strict(config, ["mode", "modes"], "config");
	if (config.mode !== "dark" && config.mode !== "light") throw new TypeError("config.mode must be \"dark\" or \"light\"");
	const modes = record(config.modes, "config.modes");
	strict(modes, ["dark", "light"], "config.modes");
	return {
		mode: config.mode,
		modes: {
			dark: seeds(modes.dark, "config.modes.dark"),
			light: seeds(modes.light, "config.modes.light")
		}
	};
}
//#endregion
//#region src/palette/generate-radix-colors.ts
const arrayOf12 = [
	0,
	1,
	2,
	3,
	4,
	5,
	6,
	7,
	8,
	9,
	10,
	11
];
const grayScaleNames = [
	"gray",
	"mauve",
	"slate",
	"sage",
	"olive",
	"sand"
];
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
	"amber"
];
const lightScales = {
	gray: import_colors.grayP3,
	mauve: import_colors.mauveP3,
	slate: import_colors.slateP3,
	sage: import_colors.sageP3,
	olive: import_colors.oliveP3,
	sand: import_colors.sandP3,
	tomato: import_colors.tomatoP3,
	red: import_colors.redP3,
	ruby: import_colors.rubyP3,
	crimson: import_colors.crimsonP3,
	pink: import_colors.pinkP3,
	plum: import_colors.plumP3,
	purple: import_colors.purpleP3,
	violet: import_colors.violetP3,
	iris: import_colors.irisP3,
	indigo: import_colors.indigoP3,
	blue: import_colors.blueP3,
	cyan: import_colors.cyanP3,
	teal: import_colors.tealP3,
	jade: import_colors.jadeP3,
	green: import_colors.greenP3,
	grass: import_colors.grassP3,
	brown: import_colors.brownP3,
	orange: import_colors.orangeP3,
	sky: import_colors.skyP3,
	mint: import_colors.mintP3,
	lime: import_colors.limeP3,
	yellow: import_colors.yellowP3,
	amber: import_colors.amberP3
};
const darkScales = {
	gray: import_colors.grayDarkP3,
	mauve: import_colors.mauveDarkP3,
	slate: import_colors.slateDarkP3,
	sage: import_colors.sageDarkP3,
	olive: import_colors.oliveDarkP3,
	sand: import_colors.sandDarkP3,
	tomato: import_colors.tomatoDarkP3,
	red: import_colors.redDarkP3,
	ruby: import_colors.rubyDarkP3,
	crimson: import_colors.crimsonDarkP3,
	pink: import_colors.pinkDarkP3,
	plum: import_colors.plumDarkP3,
	purple: import_colors.purpleDarkP3,
	violet: import_colors.violetDarkP3,
	iris: import_colors.irisDarkP3,
	indigo: import_colors.indigoDarkP3,
	blue: import_colors.blueDarkP3,
	cyan: import_colors.cyanDarkP3,
	teal: import_colors.tealDarkP3,
	jade: import_colors.jadeDarkP3,
	green: import_colors.greenDarkP3,
	grass: import_colors.grassDarkP3,
	brown: import_colors.brownDarkP3,
	orange: import_colors.orangeDarkP3,
	sky: import_colors.skyDarkP3,
	mint: import_colors.mintDarkP3,
	lime: import_colors.limeDarkP3,
	yellow: import_colors.yellowDarkP3,
	amber: import_colors.amberDarkP3
};
function colorScale(name, mode) {
	const values = (mode === "dark" ? darkScales : lightScales)[name];
	if (!values) throw new Error(`Radix scale '${name}' is unavailable`);
	const scale = Object.values(values);
	if (scale.length !== 12) throw new Error(`Radix scale '${name}' must have 12 steps`);
	return scale;
}
function oklchScale(name, mode) {
	return colorScale(name, mode).map((str) => new Color(str).to("oklch"));
}
const scaleCache = /* @__PURE__ */ new Map();
function allScales(mode) {
	let scales = scaleCache.get(mode);
	if (!scales) {
		scales = scaleNames.reduce((result, name) => {
			result[name] = oklchScale(name, mode);
			return result;
		}, {});
		scaleCache.set(mode, scales);
	}
	return scales;
}
function grayScales(mode) {
	const scales = allScales(mode);
	return grayScaleNames.reduce((result, name) => {
		result[name] = scales[name];
		return result;
	}, {});
}
function toHexScale(scale, label) {
	return scale.map((color, index) => normalizeHex(color.to("srgb").toString({ format: "hex" }), `${label}.${index + 1}`));
}
function generateRadixColors({ appearance, background, gray, accent }) {
	var _accentScaleColors$8$, _accentScaleColors$7$, _accentScaleColors$, _accentScaleColors$8$2, _accentScaleColors$7$2, _accentScaleColors$2;
	const backgroundColor = new Color(background).to("oklch");
	const grayScaleColors = getScaleFromColor(new Color(gray).to("oklch"), grayScales(appearance), backgroundColor);
	const accentBaseColor = new Color(accent).to("oklch");
	let accentScaleColors = getScaleFromColor(accentBaseColor, allScales(appearance), backgroundColor);
	const accentBaseHex = accentBaseColor.to("srgb").toString({ format: "hex" });
	if (accentBaseHex === "#000000" || accentBaseHex === "#ffffff") accentScaleColors = grayScaleColors.map((color) => color.clone());
	const [accent9Color, accentContrastColor] = getStep9Colors(accentScaleColors, accentBaseColor);
	accentScaleColors[8] = accent9Color;
	accentScaleColors[9] = getButtonHoverColor(accent9Color, [accentScaleColors]);
	accentScaleColors[10].coords[1] = Math.min(Math.max((_accentScaleColors$8$ = accentScaleColors[8].coords[1]) !== null && _accentScaleColors$8$ !== void 0 ? _accentScaleColors$8$ : 0, (_accentScaleColors$7$ = accentScaleColors[7].coords[1]) !== null && _accentScaleColors$7$ !== void 0 ? _accentScaleColors$7$ : 0), (_accentScaleColors$ = accentScaleColors[10].coords[1]) !== null && _accentScaleColors$ !== void 0 ? _accentScaleColors$ : 0);
	accentScaleColors[11].coords[1] = Math.min(Math.max((_accentScaleColors$8$2 = accentScaleColors[8].coords[1]) !== null && _accentScaleColors$8$2 !== void 0 ? _accentScaleColors$8$2 : 0, (_accentScaleColors$7$2 = accentScaleColors[7].coords[1]) !== null && _accentScaleColors$7$2 !== void 0 ? _accentScaleColors$7$2 : 0), (_accentScaleColors$2 = accentScaleColors[11].coords[1]) !== null && _accentScaleColors$2 !== void 0 ? _accentScaleColors$2 : 0);
	return {
		accentScale: toHexScale(accentScaleColors, "accent"),
		grayScale: toHexScale(grayScaleColors, "gray"),
		accentContrast: normalizeHex(accentContrastColor.to("srgb").toString({ format: "hex" }), "accentContrast")
	};
}
function getStep9Colors(scale, accentBaseColor) {
	const referenceBackgroundColor = scale[0];
	if (accentBaseColor.deltaEOK(referenceBackgroundColor) * 100 < 25) return [scale[8], getTextColor(scale[8])];
	return [accentBaseColor, getTextColor(accentBaseColor)];
}
function getButtonHoverColor(source, scales) {
	var _closestColor$coords$, _closestColor$coords$2;
	const [lightness, chroma, hue] = source.coords;
	const buttonHoverColor = new Color("oklch", [
		lightness > .4 ? lightness - .03 / (lightness + .1) : lightness + .03 / (lightness + .1),
		lightness > .4 && !Number.isNaN(hue) ? chroma * .93 : chroma,
		hue
	]);
	let closestColor = buttonHoverColor;
	let minDistance = Infinity;
	for (const scale of scales) for (const color of scale) {
		const distance = buttonHoverColor.deltaEOK(color);
		if (distance < minDistance) {
			minDistance = distance;
			closestColor = color;
		}
	}
	buttonHoverColor.coords[1] = (_closestColor$coords$ = closestColor.coords[1]) !== null && _closestColor$coords$ !== void 0 ? _closestColor$coords$ : 0;
	buttonHoverColor.coords[2] = (_closestColor$coords$2 = closestColor.coords[2]) !== null && _closestColor$coords$2 !== void 0 ? _closestColor$coords$2 : 0;
	return buttonHoverColor;
}
function getScaleFromColor(source, scales, backgroundColor) {
	var _closestColors$0$scal, _closestColors$, _source$coords$, _baseColor$coords$, _scale$0$coords$, _scale$0$coords$2, _backgroundColor$coor2, _backgroundColor$coor3;
	const allColors = [];
	for (const [name, scale] of Object.entries(scales)) for (const color of scale) {
		const distance = source.deltaEOK(color);
		allColors.push({
			scale: name,
			distance,
			color
		});
	}
	allColors.sort((a, b) => a.distance - b.distance);
	const closestColors = allColors.filter((color, index, arr) => index === arr.findIndex((value) => value.scale === color.scale));
	const grayScaleNamesStr = grayScaleNames;
	if (!closestColors.every((color) => grayScaleNamesStr.includes(color.scale)) && grayScaleNamesStr.includes((_closestColors$0$scal = (_closestColors$ = closestColors[0]) === null || _closestColors$ === void 0 ? void 0 : _closestColors$.scale) !== null && _closestColors$0$scal !== void 0 ? _closestColors$0$scal : "")) {
		var _closestColors$1$scal, _closestColors$2;
		while (grayScaleNamesStr.includes((_closestColors$1$scal = (_closestColors$2 = closestColors[1]) === null || _closestColors$2 === void 0 ? void 0 : _closestColors$2.scale) !== null && _closestColors$1$scal !== void 0 ? _closestColors$1$scal : "")) closestColors.splice(1, 1);
	}
	const colorA = closestColors[0];
	const colorB = closestColors[1];
	if (!colorA || !colorB) throw new Error("Unable to find Radix reference scales");
	const a = colorB.distance;
	const b = colorA.distance;
	const c = colorA.color.deltaEOK(colorB.color);
	const cosA = (Math.pow(b, 2) + Math.pow(c, 2) - Math.pow(a, 2)) / (2 * b * c);
	const sinA = Math.sin(Math.acos(cosA));
	const cosB = (Math.pow(a, 2) + Math.pow(c, 2) - Math.pow(b, 2)) / (2 * a * c);
	const sinB = Math.sin(Math.acos(cosB));
	const tanC1 = cosA / sinA;
	const tanC2 = cosB / sinB;
	const ratio = Math.max(0, tanC1 / tanC2) * .5;
	const scaleA = scales[colorA.scale];
	const scaleB = scales[colorB.scale];
	if (!scaleA || !scaleB) throw new Error("Unable to read Radix reference scales");
	const scale = arrayOf12.map((index) => new Color(Color.mix(scaleA[index], scaleB[index], ratio)).to("oklch"));
	const baseColor = scale.slice().sort((left, right) => source.deltaEOK(left) - source.deltaEOK(right))[0];
	if (!baseColor) throw new Error("Unable to derive Radix base color");
	const ratioC = ((_source$coords$ = source.coords[1]) !== null && _source$coords$ !== void 0 ? _source$coords$ : 0) / ((_baseColor$coords$ = baseColor.coords[1]) !== null && _baseColor$coords$ !== void 0 ? _baseColor$coords$ : 0);
	scale.forEach((color) => {
		var _source$coords$2, _color$coords$, _source$coords$3;
		color.coords[1] = Math.min(((_source$coords$2 = source.coords[1]) !== null && _source$coords$2 !== void 0 ? _source$coords$2 : 0) * 1.5, ((_color$coords$ = color.coords[1]) !== null && _color$coords$ !== void 0 ? _color$coords$ : 0) * ratioC);
		color.coords[2] = (_source$coords$3 = source.coords[2]) !== null && _source$coords$3 !== void 0 ? _source$coords$3 : 0;
	});
	if (((_scale$0$coords$ = scale[0].coords[0]) !== null && _scale$0$coords$ !== void 0 ? _scale$0$coords$ : 0) > .5) {
		var _backgroundColor$coor;
		const lightnessScale = scale.map(({ coords }) => {
			var _coords$;
			return (_coords$ = coords[0]) !== null && _coords$ !== void 0 ? _coords$ : 0;
		});
		const newLightnessScale = transposeProgressionStart(Math.max(0, Math.min(1, (_backgroundColor$coor = backgroundColor.coords[0]) !== null && _backgroundColor$coor !== void 0 ? _backgroundColor$coor : 0)), [1, ...lightnessScale], lightModeEasing);
		newLightnessScale.shift();
		newLightnessScale.forEach((lightness, index) => {
			scale[index].coords[0] = lightness;
		});
		return scale;
	}
	const ease = [...darkModeEasing];
	const referenceBackgroundColorLightness = (_scale$0$coords$2 = scale[0].coords[0]) !== null && _scale$0$coords$2 !== void 0 ? _scale$0$coords$2 : 0;
	const ratioL = Math.max(0, Math.min(1, (_backgroundColor$coor2 = backgroundColor.coords[0]) !== null && _backgroundColor$coor2 !== void 0 ? _backgroundColor$coor2 : 0)) / referenceBackgroundColorLightness;
	if (ratioL > 1) {
		const maxRatio = 1.5;
		for (let index = 0; index < ease.length; index += 1) {
			var _ease$index;
			const metaRatio = (ratioL - 1) * (maxRatio / .5);
			ease[index] = ratioL > maxRatio ? 0 : Math.max(0, ((_ease$index = ease[index]) !== null && _ease$index !== void 0 ? _ease$index : 0) * (1 - metaRatio));
		}
	}
	const lightnessScale = scale.map(({ coords }) => {
		var _coords$2;
		return (_coords$2 = coords[0]) !== null && _coords$2 !== void 0 ? _coords$2 : 0;
	});
	transposeProgressionStart((_backgroundColor$coor3 = backgroundColor.coords[0]) !== null && _backgroundColor$coor3 !== void 0 ? _backgroundColor$coor3 : 0, lightnessScale, ease).forEach((lightness, index) => {
		scale[index].coords[0] = lightness;
	});
	return scale;
}
function getTextColor(background) {
	const white = new Color("oklch", [
		1,
		0,
		0
	]);
	if (Math.abs(white.contrastAPCA(background)) < 40) {
		const [, chroma, hue] = background.coords;
		return new Color("oklch", [
			.25,
			Math.max(.08 * chroma, .04),
			hue
		]);
	}
	return white;
}
const darkModeEasing = [
	1,
	0,
	1,
	0
];
const lightModeEasing = [
	0,
	2,
	0,
	2
];
function transposeProgressionStart(to, arr, curve) {
	return arr.map((value, index, values) => {
		var _values$;
		const lastIndex = values.length - 1;
		return value - (((_values$ = values[0]) !== null && _values$ !== void 0 ? _values$ : 0) - to) * bezier(...curve)(1 - index / lastIndex);
	});
}
function radixStockScale(name, mode) {
	return colorScale(name, mode).map((value, index) => normalizeHex(value, `${name}.${index + 1}`));
}
function radixTerminalColors(mode) {
	const red = radixStockScale("red", mode);
	const yellow = radixStockScale("yellow", mode);
	const green = radixStockScale("green", mode);
	const cyan = radixStockScale("cyan", mode);
	const blue = radixStockScale("blue", mode);
	const plum = radixStockScale("plum", mode);
	const orange = radixStockScale("orange", mode);
	const brown = radixStockScale("brown", mode);
	return {
		red: red[10],
		brightRed: red[11],
		yellow: yellow[10],
		brightYellow: yellow[11],
		green: green[10],
		brightGreen: green[11],
		cyan: cyan[10],
		brightCyan: cyan[11],
		blue: blue[10],
		brightBlue: blue[11],
		magenta: plum[10],
		brightMagenta: plum[11],
		orange: orange[10],
		brown: brown[10]
	};
}
//#endregion
//#region src/palette/generate.ts
function contrast(background, foreground) {
	return new Color(background).contrast(new Color(foreground), "WCAG21");
}
function worstContrast(backgrounds, foreground) {
	return Math.min(...backgrounds.map((background) => contrast(background, foreground)));
}
const TERMINAL_OUTPUTS = {
	red: ["red", "brightRed"],
	yellow: ["yellow", "brightYellow"],
	green: ["green", "brightGreen"],
	cyan: ["cyan", "brightCyan"],
	blue: ["blue", "brightBlue"],
	magenta: ["magenta", "brightMagenta"],
	orange: ["orange"],
	brown: ["brown"]
};
function omarchySurfaces(mode, gray) {
	const range = new Color(gray[0]).range(gray[3], {
		space: "oklch",
		outputSpace: "srgb"
	});
	const steps = [
		0,
		1 / 3,
		2 / 3,
		1
	].map((position, index) => normalizeHex(range(position).toString({ format: "hex" }), `surface.${index + 1}`));
	return mode === "dark" ? {
		darker: steps[0],
		dark: steps[1],
		background: steps[2],
		lighter: steps[3]
	} : {
		lighter: steps[0],
		background: steps[1],
		dark: steps[2],
		darker: steps[3]
	};
}
function generatePalette(input) {
	const config = parseConfig(input);
	const mode = config.mode;
	const seeds = config.modes[mode];
	const radix = generateRadixColors({
		appearance: mode,
		background: seeds.surface,
		gray: seeds.neutral,
		accent: seeds.accent
	});
	const gray = radix.grayScale;
	const accent = radix.accentScale;
	const surfaces = omarchySurfaces(mode, gray);
	const muted = gray[10];
	const darkForeground = gray[9];
	const lightForeground = gray[11];
	const foreground = gray[11];
	const brightForeground = gray[11];
	const terminal = radixTerminalColors(mode);
	for (const [name, seed] of Object.entries(seeds.terminal)) {
		const scale = generateRadixColors({
			appearance: mode,
			background: seeds.surface,
			gray: seeds.neutral,
			accent: seed
		}).accentScale;
		const outputs = TERMINAL_OUTPUTS[name];
		Object.assign(terminal, outputs.length === 2 ? {
			[outputs[0]]: scale[10],
			[outputs[1]]: scale[11]
		} : { [outputs[0]]: scale[10] });
	}
	const selection = accent[3];
	const accentColor = accent[8];
	const colors = _objectSpread2({
		lighter_background: surfaces.lighter,
		background: surfaces.background,
		dark_background: surfaces.dark,
		darker_background: surfaces.darker,
		muted,
		dark_foreground: darkForeground,
		light_foreground: lightForeground,
		foreground,
		bright_foreground: brightForeground,
		accent: accentColor,
		selection,
		red: terminal.red,
		bright_red: terminal.brightRed,
		yellow: terminal.yellow,
		bright_yellow: terminal.brightYellow,
		green: terminal.green,
		bright_green: terminal.brightGreen,
		cyan: terminal.cyan,
		bright_cyan: terminal.brightCyan,
		blue: terminal.blue,
		bright_blue: terminal.brightBlue,
		magenta: terminal.magenta,
		bright_magenta: terminal.brightMagenta,
		orange: terminal.orange,
		brown: terminal.brown
	}, seeds.overrides);
	const accentContrast = radix.accentContrast;
	const surfaceGroup = [
		colors.lighter_background,
		colors.background,
		colors.dark_background,
		colors.darker_background
	];
	const text = [
		colors.muted,
		colors.dark_foreground,
		colors.light_foreground,
		colors.foreground,
		colors.bright_foreground
	];
	const terminalGroup = [
		colors.red,
		colors.bright_red,
		colors.yellow,
		colors.bright_yellow,
		colors.green,
		colors.bright_green,
		colors.cyan,
		colors.bright_cyan,
		colors.blue,
		colors.bright_blue,
		colors.magenta,
		colors.bright_magenta,
		colors.orange,
		colors.brown
	];
	return {
		config,
		mode,
		colors,
		groups: {
			surfaces: surfaceGroup,
			text,
			interaction: [colors.accent, colors.selection],
			terminal: terminalGroup
		},
		accentContrast,
		checks: {
			mainText: worstContrast(surfaceGroup, colors.foreground),
			mutedText: worstContrast(surfaceGroup, colors.muted),
			selectionText: contrast(colors.selection, colors.bright_foreground),
			accentText: contrast(colors.accent, accentContrast),
			terminalMinimum: Math.min(...terminalGroup.map((color) => contrast(colors.background, color)))
		}
	};
}
//#endregion
export { generatePalette };
