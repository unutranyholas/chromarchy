#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import { createInterface } from "node:readline";
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
//#region node_modules/.pnpm/colorjs.io@0.5.2/node_modules/colorjs.io/dist/color.js
function multiplyMatrices(A, B) {
	let m = A.length;
	if (!Array.isArray(A[0])) A = [A];
	if (!Array.isArray(B[0])) B = B.map((x) => [x]);
	let p = B[0].length;
	let B_cols = B[0].map((_, i) => B.map((x) => x[i]));
	let product = A.map((row) => B_cols.map((col) => {
		let ret = 0;
		if (!Array.isArray(row)) {
			for (let c of col) ret += row * c;
			return ret;
		}
		for (let i = 0; i < row.length; i++) ret += row[i] * (col[i] || 0);
		return ret;
	}));
	if (m === 1) product = product[0];
	if (p === 1) return product.map((x) => x[0]);
	return product;
}
/**
* Various utility functions
*/
/**
* Check if a value is a string (including a String object)
* @param {*} str - Value to check
* @returns {boolean}
*/
function isString(str) {
	return type(str) === "string";
}
/**
* Determine the internal JavaScript [[Class]] of an object.
* @param {*} o - Value to check
* @returns {string}
*/
function type(o) {
	return (Object.prototype.toString.call(o).match(/^\[object\s+(.*?)\]$/)[1] || "").toLowerCase();
}
function serializeNumber(n, { precision, unit }) {
	if (isNone(n)) return "none";
	return toPrecision(n, precision) + (unit ?? "");
}
/**
* Check if a value corresponds to a none argument
* @param {*} n - Value to check
* @returns {boolean}
*/
function isNone(n) {
	return Number.isNaN(n) || n instanceof Number && n?.none;
}
/**
* Replace none values with 0
*/
function skipNone(n) {
	return isNone(n) ? 0 : n;
}
/**
* Round a number to a certain number of significant digits
* @param {number} n - The number to round
* @param {number} precision - Number of significant digits
*/
function toPrecision(n, precision) {
	if (n === 0) return 0;
	let integer = ~~n;
	let digits = 0;
	if (integer && precision) digits = ~~Math.log10(Math.abs(integer)) + 1;
	const multiplier = 10 ** (precision - digits);
	return Math.floor(n * multiplier + .5) / multiplier;
}
const angleFactor = {
	deg: 1,
	grad: .9,
	rad: 180 / Math.PI,
	turn: 360
};
/**
* Parse a CSS function, regardless of its name and arguments
* @param String str String to parse
* @return {{name, args, rawArgs}}
*/
function parseFunction(str) {
	if (!str) return;
	str = str.trim();
	const isFunctionRegex = /^([a-z]+)\((.+?)\)$/i;
	const isNumberRegex = /^-?[\d.]+$/;
	const unitValueRegex = /%|deg|g?rad|turn$/;
	const singleArgument = /\/?\s*(none|[-\w.]+(?:%|deg|g?rad|turn)?)/g;
	let parts = str.match(isFunctionRegex);
	if (parts) {
		let args = [];
		parts[2].replace(singleArgument, ($0, rawArg) => {
			let match = rawArg.match(unitValueRegex);
			let arg = rawArg;
			if (match) {
				let unit = match[0];
				let unitlessArg = arg.slice(0, -unit.length);
				if (unit === "%") {
					arg = /* @__PURE__ */ new Number(unitlessArg / 100);
					arg.type = "<percentage>";
				} else {
					arg = new Number(unitlessArg * angleFactor[unit]);
					arg.type = "<angle>";
					arg.unit = unit;
				}
			} else if (isNumberRegex.test(arg)) {
				arg = new Number(arg);
				arg.type = "<number>";
			} else if (arg === "none") {
				arg = /* @__PURE__ */ new Number(NaN);
				arg.none = true;
			}
			if ($0.startsWith("/")) {
				arg = arg instanceof Number ? arg : new Number(arg);
				arg.alpha = true;
			}
			if (typeof arg === "object" && arg instanceof Number) arg.raw = rawArg;
			args.push(arg);
		});
		return {
			name: parts[1].toLowerCase(),
			rawName: parts[1],
			rawArgs: parts[2],
			args
		};
	}
}
function last(arr) {
	return arr[arr.length - 1];
}
function interpolate(start, end, p) {
	if (isNaN(start)) return end;
	if (isNaN(end)) return start;
	return start + (end - start) * p;
}
function interpolateInv(start, end, value) {
	return (value - start) / (end - start);
}
function mapRange(from, to, value) {
	return interpolate(to[0], to[1], interpolateInv(from[0], from[1], value));
}
function parseCoordGrammar(coordGrammars) {
	return coordGrammars.map((coordGrammar) => {
		return coordGrammar.split("|").map((type) => {
			type = type.trim();
			let range = type.match(/^(<[a-z]+>)\[(-?[.\d]+),\s*(-?[.\d]+)\]?$/);
			if (range) {
				let ret = new String(range[1]);
				ret.range = [+range[2], +range[3]];
				return ret;
			}
			return type;
		});
	});
}
/**
* Clamp value between the minimum and maximum
* @param {number} min minimum value to return
* @param {number} val the value to return if it is between min and max
* @param {number} max maximum value to return
* @returns number
*/
function clamp(min, val, max) {
	return Math.max(Math.min(max, val), min);
}
/**
* Copy sign of one value to another.
* @param {number} - to number to copy sign to
* @param {number} - from number to copy sign from
* @returns number
*/
function copySign(to, from) {
	return Math.sign(to) === Math.sign(from) ? to : -to;
}
/**
* Perform pow on a signed number and copy sign to result
* @param {number} - base the base number
* @param {number} - exp the exponent
* @returns number
*/
function spow(base, exp) {
	return copySign(Math.abs(base) ** exp, base);
}
/**
* Perform a divide, but return zero if the numerator is zero
* @param {number} n - the numerator
* @param {number} d - the denominator
* @returns number
*/
function zdiv(n, d) {
	return d === 0 ? 0 : n / d;
}
/**
* Perform a bisect on a sorted list and locate the insertion point for
* a value in arr to maintain sorted order.
* @param {number[]} arr - array of sorted numbers
* @param {number} value - value to find insertion point for
* @param {number} lo - used to specify a the low end of a subset of the list
* @param {number} hi - used to specify a the high end of a subset of the list
* @returns number
*/
function bisectLeft(arr, value, lo = 0, hi = arr.length) {
	while (lo < hi) {
		const mid = lo + hi >> 1;
		if (arr[mid] < value) lo = mid + 1;
		else hi = mid;
	}
	return lo;
}
var util = /*#__PURE__*/ Object.freeze({
	__proto__: null,
	bisectLeft,
	clamp,
	copySign,
	interpolate,
	interpolateInv,
	isNone,
	isString,
	last,
	mapRange,
	multiplyMatrices,
	parseCoordGrammar,
	parseFunction,
	serializeNumber,
	skipNone,
	spow,
	toPrecision,
	type,
	zdiv
});
/**
* A class for adding deep extensibility to any piece of JS code
*/
var Hooks = class {
	add(name, callback, first) {
		if (typeof arguments[0] != "string") {
			for (var name in arguments[0]) this.add(name, arguments[0][name], arguments[1]);
			return;
		}
		(Array.isArray(name) ? name : [name]).forEach(function(name) {
			this[name] = this[name] || [];
			if (callback) this[name][first ? "unshift" : "push"](callback);
		}, this);
	}
	run(name, env) {
		this[name] = this[name] || [];
		this[name].forEach(function(callback) {
			callback.call(env && env.context ? env.context : env, env);
		});
	}
};
/**
* The instance of {@link Hooks} used throughout Color.js
*/
const hooks = new Hooks();
var defaults = {
	gamut_mapping: "css",
	precision: 5,
	deltaE: "76",
	verbose: globalThis?.process?.env?.NODE_ENV?.toLowerCase() !== "test",
	warn: function warn(msg) {
		if (this.verbose) globalThis?.console?.warn?.(msg);
	}
};
const WHITES = {
	D50: [
		.3457 / .3585,
		1,
		.2958 / .3585
	],
	D65: [
		.3127 / .329,
		1,
		.3583 / .329
	]
};
function getWhite(name) {
	if (Array.isArray(name)) return name;
	return WHITES[name];
}
function adapt$2(W1, W2, XYZ, options = {}) {
	W1 = getWhite(W1);
	W2 = getWhite(W2);
	if (!W1 || !W2) throw new TypeError(`Missing white point to convert ${!W1 ? "from" : ""}${!W1 && !W2 ? "/" : ""}${!W2 ? "to" : ""}`);
	if (W1 === W2) return XYZ;
	let env = {
		W1,
		W2,
		XYZ,
		options
	};
	hooks.run("chromatic-adaptation-start", env);
	if (!env.M) {
		if (env.W1 === WHITES.D65 && env.W2 === WHITES.D50) env.M = [
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
		else if (env.W1 === WHITES.D50 && env.W2 === WHITES.D65) env.M = [
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
	}
	hooks.run("chromatic-adaptation-end", env);
	if (env.M) return multiplyMatrices(env.M, env.XYZ);
	else throw new TypeError("Only Bradford CAT with white points D50 and D65 supported for now.");
}
const noneTypes = /* @__PURE__ */ new Set([
	"<number>",
	"<percentage>",
	"<angle>"
]);
/**
* Validates the coordinates of a color against a format's coord grammar and
* maps the coordinates to the range or refRange of the coordinates.
* @param {ColorSpace} space - Colorspace the coords are in
* @param {object} format - the format object to validate against
* @param {string} name - the name of the color function. e.g. "oklab" or "color"
* @returns {object[]} - an array of type metadata for each coordinate
*/
function coerceCoords(space, format, name, coords) {
	return Object.entries(space.coords).map(([id, coordMeta], i) => {
		let coordGrammar = format.coordGrammar[i];
		let arg = coords[i];
		let providedType = arg?.type;
		let type;
		if (arg.none) type = coordGrammar.find((c) => noneTypes.has(c));
		else type = coordGrammar.find((c) => c == providedType);
		if (!type) {
			let coordName = coordMeta.name || id;
			throw new TypeError(`${providedType ?? arg.raw} not allowed for ${coordName} in ${name}()`);
		}
		let fromRange = type.range;
		if (providedType === "<percentage>") fromRange ||= [0, 1];
		let toRange = coordMeta.range || coordMeta.refRange;
		if (fromRange && toRange) coords[i] = mapRange(fromRange, toRange, coords[i]);
		return type;
	});
}
/**
* Convert a CSS Color string to a color object
* @param {string} str
* @param {object} [options]
* @param {object} [options.meta] - Object for additional information about the parsing
* @returns {Color}
*/
function parse(str, { meta } = {}) {
	let env = { "str": String(str)?.trim() };
	hooks.run("parse-start", env);
	if (env.color) return env.color;
	env.parsed = parseFunction(env.str);
	if (env.parsed) {
		let name = env.parsed.name;
		if (name === "color") {
			let id = env.parsed.args.shift();
			let alternateId = id.startsWith("--") ? id.substring(2) : `--${id}`;
			let ids = [id, alternateId];
			let alpha = env.parsed.rawArgs.indexOf("/") > 0 ? env.parsed.args.pop() : 1;
			for (let space of ColorSpace.all) {
				let colorSpec = space.getFormat("color");
				if (colorSpec) {
					if (ids.includes(colorSpec.id) || colorSpec.ids?.filter((specId) => ids.includes(specId)).length) {
						const coords = Object.keys(space.coords).map((_, i) => env.parsed.args[i] || 0);
						let types;
						if (colorSpec.coordGrammar) types = coerceCoords(space, colorSpec, "color", coords);
						if (meta) Object.assign(meta, {
							formatId: "color",
							types
						});
						if (colorSpec.id.startsWith("--") && !id.startsWith("--")) defaults.warn(`${space.name} is a non-standard space and not currently supported in the CSS spec. Use prefixed color(${colorSpec.id}) instead of color(${id}).`);
						if (id.startsWith("--") && !colorSpec.id.startsWith("--")) defaults.warn(`${space.name} is a standard space and supported in the CSS spec. Use color(${colorSpec.id}) instead of prefixed color(${id}).`);
						return {
							spaceId: space.id,
							coords,
							alpha
						};
					}
				}
			}
			let didYouMean = "";
			let registryId = id in ColorSpace.registry ? id : alternateId;
			if (registryId in ColorSpace.registry) {
				let cssId = ColorSpace.registry[registryId].formats?.color?.id;
				if (cssId) didYouMean = `Did you mean color(${cssId})?`;
			}
			throw new TypeError(`Cannot parse color(${id}). ` + (didYouMean || "Missing a plugin?"));
		} else for (let space of ColorSpace.all) {
			let format = space.getFormat(name);
			if (format && format.type === "function") {
				let alpha = 1;
				if (format.lastAlpha || last(env.parsed.args).alpha) alpha = env.parsed.args.pop();
				let coords = env.parsed.args;
				let types;
				if (format.coordGrammar) types = coerceCoords(space, format, name, coords);
				if (meta) Object.assign(meta, {
					formatId: format.name,
					types
				});
				return {
					spaceId: space.id,
					coords,
					alpha
				};
			}
		}
	} else for (let space of ColorSpace.all) for (let formatId in space.formats) {
		let format = space.formats[formatId];
		if (format.type !== "custom") continue;
		if (format.test && !format.test(env.str)) continue;
		let color = format.parse(env.str);
		if (color) {
			color.alpha ??= 1;
			if (meta) meta.formatId = formatId;
			return color;
		}
	}
	throw new TypeError(`Could not parse ${str} as a color. Missing a plugin?`);
}
/**
* Resolves a color reference (object or string) to a plain color object
* @param {Color | {space, coords, alpha} | string | Array<Color | {space, coords, alpha} | string> } color
* @returns {{space, coords, alpha} | Array<{space, coords, alpha}}>
*/
function getColor(color) {
	if (Array.isArray(color)) return color.map(getColor);
	if (!color) throw new TypeError("Empty color reference");
	if (isString(color)) color = parse(color);
	let space = color.space || color.spaceId;
	if (!(space instanceof ColorSpace)) color.space = ColorSpace.get(space);
	if (color.alpha === void 0) color.alpha = 1;
	return color;
}
const ε$7 = 75e-6;
/**
* Class to represent a color space
*/
var ColorSpace = class ColorSpace {
	constructor(options) {
		this.id = options.id;
		this.name = options.name;
		this.base = options.base ? ColorSpace.get(options.base) : null;
		this.aliases = options.aliases;
		if (this.base) {
			this.fromBase = options.fromBase;
			this.toBase = options.toBase;
		}
		let coords = options.coords ?? this.base.coords;
		for (let name in coords) if (!("name" in coords[name])) coords[name].name = name;
		this.coords = coords;
		let white = options.white ?? this.base.white ?? "D65";
		this.white = getWhite(white);
		this.formats = options.formats ?? {};
		for (let name in this.formats) {
			let format = this.formats[name];
			format.type ||= "function";
			format.name ||= name;
		}
		if (!this.formats.color?.id) this.formats.color = {
			...this.formats.color ?? {},
			id: options.cssId || this.id
		};
		if (options.gamutSpace) this.gamutSpace = options.gamutSpace === "self" ? this : ColorSpace.get(options.gamutSpace);
		else if (this.isPolar) this.gamutSpace = this.base;
		else this.gamutSpace = this;
		if (this.gamutSpace.isUnbounded) this.inGamut = (coords, options) => {
			return true;
		};
		this.referred = options.referred;
		Object.defineProperty(this, "path", {
			value: getPath(this).reverse(),
			writable: false,
			enumerable: true,
			configurable: true
		});
		hooks.run("colorspace-init-end", this);
	}
	inGamut(coords, { epsilon = ε$7 } = {}) {
		if (!this.equals(this.gamutSpace)) {
			coords = this.to(this.gamutSpace, coords);
			return this.gamutSpace.inGamut(coords, { epsilon });
		}
		let coordMeta = Object.values(this.coords);
		return coords.every((c, i) => {
			let meta = coordMeta[i];
			if (meta.type !== "angle" && meta.range) {
				if (Number.isNaN(c)) return true;
				let [min, max] = meta.range;
				return (min === void 0 || c >= min - epsilon) && (max === void 0 || c <= max + epsilon);
			}
			return true;
		});
	}
	get isUnbounded() {
		return Object.values(this.coords).every((coord) => !("range" in coord));
	}
	get cssId() {
		return this.formats?.color?.id || this.id;
	}
	get isPolar() {
		for (let id in this.coords) if (this.coords[id].type === "angle") return true;
		return false;
	}
	getFormat(format) {
		if (typeof format === "object") {
			format = processFormat(format, this);
			return format;
		}
		let ret;
		if (format === "default") ret = Object.values(this.formats)[0];
		else ret = this.formats[format];
		if (ret) {
			ret = processFormat(ret, this);
			return ret;
		}
		return null;
	}
	/**
	* Check if this color space is the same as another color space reference.
	* Allows proxying color space objects and comparing color spaces with ids.
	* @param {string | ColorSpace} space ColorSpace object or id to compare to
	* @returns {boolean}
	*/
	equals(space) {
		if (!space) return false;
		return this === space || this.id === space || this.id === space.id;
	}
	to(space, coords) {
		if (arguments.length === 1) {
			const color = getColor(space);
			[space, coords] = [color.space, color.coords];
		}
		space = ColorSpace.get(space);
		if (this.equals(space)) return coords;
		coords = coords.map((c) => Number.isNaN(c) ? 0 : c);
		let myPath = this.path;
		let otherPath = space.path;
		let connectionSpace, connectionSpaceIndex;
		for (let i = 0; i < myPath.length; i++) if (myPath[i].equals(otherPath[i])) {
			connectionSpace = myPath[i];
			connectionSpaceIndex = i;
		} else break;
		if (!connectionSpace) throw new Error(`Cannot convert between color spaces ${this} and ${space}: no connection space was found`);
		for (let i = myPath.length - 1; i > connectionSpaceIndex; i--) coords = myPath[i].toBase(coords);
		for (let i = connectionSpaceIndex + 1; i < otherPath.length; i++) coords = otherPath[i].fromBase(coords);
		return coords;
	}
	from(space, coords) {
		if (arguments.length === 1) {
			const color = getColor(space);
			[space, coords] = [color.space, color.coords];
		}
		space = ColorSpace.get(space);
		return space.to(this, coords);
	}
	toString() {
		return `${this.name} (${this.id})`;
	}
	getMinCoords() {
		let ret = [];
		for (let id in this.coords) {
			let meta = this.coords[id];
			let range = meta.range || meta.refRange;
			ret.push(range?.min ?? 0);
		}
		return ret;
	}
	static registry = {};
	static get all() {
		return [...new Set(Object.values(ColorSpace.registry))];
	}
	static register(id, space) {
		if (arguments.length === 1) {
			space = arguments[0];
			id = space.id;
		}
		space = this.get(space);
		if (this.registry[id] && this.registry[id] !== space) throw new Error(`Duplicate color space registration: '${id}'`);
		this.registry[id] = space;
		if (arguments.length === 1 && space.aliases) for (let alias of space.aliases) this.register(alias, space);
		return space;
	}
	/**
	* Lookup ColorSpace object by name
	* @param {ColorSpace | string} name
	*/
	static get(space, ...alternatives) {
		if (!space || space instanceof ColorSpace) return space;
		if (type(space) === "string") {
			let ret = ColorSpace.registry[space.toLowerCase()];
			if (!ret) throw new TypeError(`No color space found with id = "${space}"`);
			return ret;
		}
		if (alternatives.length) return ColorSpace.get(...alternatives);
		throw new TypeError(`${space} is not a valid color space`);
	}
	/**
	* Get metadata about a coordinate of a color space
	*
	* @static
	* @param {Array | string} ref
	* @param {ColorSpace | string} [workingSpace]
	* @return {Object}
	*/
	static resolveCoord(ref, workingSpace) {
		let coordType = type(ref);
		let space, coord;
		if (coordType === "string") {
			if (ref.includes(".")) [space, coord] = ref.split(".");
			else [space, coord] = [, ref];
		} else if (Array.isArray(ref)) [space, coord] = ref;
		else {
			space = ref.space;
			coord = ref.coordId;
		}
		space = ColorSpace.get(space);
		if (!space) space = workingSpace;
		if (!space) throw new TypeError(`Cannot resolve coordinate reference ${ref}: No color space specified and relative references are not allowed here`);
		coordType = type(coord);
		if (coordType === "number" || coordType === "string" && coord >= 0) {
			let meta = Object.entries(space.coords)[coord];
			if (meta) return {
				space,
				id: meta[0],
				index: coord,
				...meta[1]
			};
		}
		space = ColorSpace.get(space);
		let normalizedCoord = coord.toLowerCase();
		let i = 0;
		for (let id in space.coords) {
			let meta = space.coords[id];
			if (id.toLowerCase() === normalizedCoord || meta.name?.toLowerCase() === normalizedCoord) return {
				space,
				id,
				index: i,
				...meta
			};
			i++;
		}
		throw new TypeError(`No "${coord}" coordinate found in ${space.name}. Its coordinates are: ${Object.keys(space.coords).join(", ")}`);
	}
	static DEFAULT_FORMAT = {
		type: "functions",
		name: "color"
	};
};
function getPath(space) {
	let ret = [space];
	for (let s = space; s = s.base;) ret.push(s);
	return ret;
}
function processFormat(format, { coords } = {}) {
	if (format.coords && !format.coordGrammar) {
		format.type ||= "function";
		format.name ||= "color";
		format.coordGrammar = parseCoordGrammar(format.coords);
		let coordFormats = Object.entries(coords).map(([id, coordMeta], i) => {
			let outputType = format.coordGrammar[i][0];
			let fromRange = coordMeta.range || coordMeta.refRange;
			let toRange = outputType.range, suffix = "";
			if (outputType == "<percentage>") {
				toRange = [0, 100];
				suffix = "%";
			} else if (outputType == "<angle>") suffix = "deg";
			return {
				fromRange,
				toRange,
				suffix
			};
		});
		format.serializeCoords = (coords, precision) => {
			return coords.map((c, i) => {
				let { fromRange, toRange, suffix } = coordFormats[i];
				if (fromRange && toRange) c = mapRange(fromRange, toRange, c);
				c = serializeNumber(c, {
					precision,
					unit: suffix
				});
				return c;
			});
		};
	}
	return format;
}
var xyz_d65 = new ColorSpace({
	id: "xyz-d65",
	name: "XYZ D65",
	coords: {
		x: { name: "X" },
		y: { name: "Y" },
		z: { name: "Z" }
	},
	white: "D65",
	formats: { color: { ids: ["xyz-d65", "xyz"] } },
	aliases: ["xyz"]
});
/**
* Convenience class for RGB color spaces
* @extends {ColorSpace}
*/
var RGBColorSpace = class extends ColorSpace {
	/**
	* Creates a new RGB ColorSpace.
	* If coords are not specified, they will use the default RGB coords.
	* Instead of `fromBase()` and `toBase()` functions,
	* you can specify to/from XYZ matrices and have `toBase()` and `fromBase()` automatically generated.
	* @param {*} options - Same options as {@link ColorSpace} plus:
	* @param {number[][]} options.toXYZ_M - Matrix to convert to XYZ
	* @param {number[][]} options.fromXYZ_M - Matrix to convert from XYZ
	*/
	constructor(options) {
		if (!options.coords) options.coords = {
			r: {
				range: [0, 1],
				name: "Red"
			},
			g: {
				range: [0, 1],
				name: "Green"
			},
			b: {
				range: [0, 1],
				name: "Blue"
			}
		};
		if (!options.base) options.base = xyz_d65;
		if (options.toXYZ_M && options.fromXYZ_M) {
			options.toBase ??= (rgb) => {
				let xyz = multiplyMatrices(options.toXYZ_M, rgb);
				if (this.white !== this.base.white) xyz = adapt$2(this.white, this.base.white, xyz);
				return xyz;
			};
			options.fromBase ??= (xyz) => {
				xyz = adapt$2(this.base.white, this.white, xyz);
				return multiplyMatrices(options.fromXYZ_M, xyz);
			};
		}
		options.referred ??= "display";
		super(options);
	}
};
/**
* Get the coordinates of a color in any color space
* @param {Color} color
* @param {string | ColorSpace} [space = color.space] The color space to convert to. Defaults to the color's current space
* @returns {number[]} The color coordinates in the given color space
*/
function getAll(color, space) {
	color = getColor(color);
	if (!space || color.space.equals(space)) return color.coords.slice();
	space = ColorSpace.get(space);
	return space.from(color);
}
function get(color, prop) {
	color = getColor(color);
	let { space, index } = ColorSpace.resolveCoord(prop, color.space);
	return getAll(color, space)[index];
}
function setAll(color, space, coords) {
	color = getColor(color);
	space = ColorSpace.get(space);
	color.coords = space.to(color.space, coords);
	return color;
}
setAll.returns = "color";
function set(color, prop, value) {
	color = getColor(color);
	if (arguments.length === 2 && type(arguments[1]) === "object") {
		let object = arguments[1];
		for (let p in object) set(color, p, object[p]);
	} else {
		if (typeof value === "function") value = value(get(color, prop));
		let { space, index } = ColorSpace.resolveCoord(prop, color.space);
		let coords = getAll(color, space);
		coords[index] = value;
		setAll(color, space, coords);
	}
	return color;
}
set.returns = "color";
var XYZ_D50 = new ColorSpace({
	id: "xyz-d50",
	name: "XYZ D50",
	white: "D50",
	base: xyz_d65,
	fromBase: (coords) => adapt$2(xyz_d65.white, "D50", coords),
	toBase: (coords) => adapt$2("D50", xyz_d65.white, coords)
});
const ε$6 = 216 / 24389;
const ε3$1 = 24 / 116;
const κ$4 = 24389 / 27;
let white$4 = WHITES.D50;
var lab = new ColorSpace({
	id: "lab",
	name: "Lab",
	coords: {
		l: {
			refRange: [0, 100],
			name: "Lightness"
		},
		a: { refRange: [-125, 125] },
		b: { refRange: [-125, 125] }
	},
	white: white$4,
	base: XYZ_D50,
	fromBase(XYZ) {
		let f = XYZ.map((value, i) => value / white$4[i]).map((value) => value > ε$6 ? Math.cbrt(value) : (κ$4 * value + 16) / 116);
		return [
			116 * f[1] - 16,
			500 * (f[0] - f[1]),
			200 * (f[1] - f[2])
		];
	},
	toBase(Lab) {
		let f = [];
		f[1] = (Lab[0] + 16) / 116;
		f[0] = Lab[1] / 500 + f[1];
		f[2] = f[1] - Lab[2] / 200;
		return [
			f[0] > ε3$1 ? Math.pow(f[0], 3) : (116 * f[0] - 16) / κ$4,
			Lab[0] > 8 ? Math.pow((Lab[0] + 16) / 116, 3) : Lab[0] / κ$4,
			f[2] > ε3$1 ? Math.pow(f[2], 3) : (116 * f[2] - 16) / κ$4
		].map((value, i) => value * white$4[i]);
	},
	formats: { "lab": { coords: [
		"<number> | <percentage>",
		"<number> | <percentage>[-1,1]",
		"<number> | <percentage>[-1,1]"
	] } }
});
function constrain(angle) {
	return (angle % 360 + 360) % 360;
}
function adjust(arc, angles) {
	if (arc === "raw") return angles;
	let [a1, a2] = angles.map(constrain);
	let angleDiff = a2 - a1;
	if (arc === "increasing") {
		if (angleDiff < 0) a2 += 360;
	} else if (arc === "decreasing") {
		if (angleDiff > 0) a1 += 360;
	} else if (arc === "longer") {
		if (-180 < angleDiff && angleDiff < 180) {
			if (angleDiff > 0) a1 += 360;
			else a2 += 360;
		}
	} else if (arc === "shorter") {
		if (angleDiff > 180) a1 += 360;
		else if (angleDiff < -180) a2 += 360;
	}
	return [a1, a2];
}
var lch = new ColorSpace({
	id: "lch",
	name: "LCH",
	coords: {
		l: {
			refRange: [0, 100],
			name: "Lightness"
		},
		c: {
			refRange: [0, 150],
			name: "Chroma"
		},
		h: {
			refRange: [0, 360],
			type: "angle",
			name: "Hue"
		}
	},
	base: lab,
	fromBase(Lab) {
		let [L, a, b] = Lab;
		let hue;
		const ε = .02;
		if (Math.abs(a) < ε && Math.abs(b) < ε) hue = NaN;
		else hue = Math.atan2(b, a) * 180 / Math.PI;
		return [
			L,
			Math.sqrt(a ** 2 + b ** 2),
			constrain(hue)
		];
	},
	toBase(LCH) {
		let [Lightness, Chroma, Hue] = LCH;
		if (Chroma < 0) Chroma = 0;
		if (isNaN(Hue)) Hue = 0;
		return [
			Lightness,
			Chroma * Math.cos(Hue * Math.PI / 180),
			Chroma * Math.sin(Hue * Math.PI / 180)
		];
	},
	formats: { "lch": { coords: [
		"<number> | <percentage>",
		"<number> | <percentage>",
		"<number> | <angle>"
	] } }
});
const Gfactor = 25 ** 7;
const π$1 = Math.PI;
const r2d = 180 / π$1;
const d2r$1 = π$1 / 180;
function pow7(x) {
	const x2 = x * x;
	return x2 * x2 * x2 * x;
}
function deltaE2000(color, sample, { kL = 1, kC = 1, kH = 1 } = {}) {
	[color, sample] = getColor([color, sample]);
	let [L1, a1, b1] = lab.from(color);
	let C1 = lch.from(lab, [
		L1,
		a1,
		b1
	])[1];
	let [L2, a2, b2] = lab.from(sample);
	let C2 = lch.from(lab, [
		L2,
		a2,
		b2
	])[1];
	if (C1 < 0) C1 = 0;
	if (C2 < 0) C2 = 0;
	let C7 = pow7((C1 + C2) / 2);
	let G = .5 * (1 - Math.sqrt(C7 / (C7 + Gfactor)));
	let adash1 = (1 + G) * a1;
	let adash2 = (1 + G) * a2;
	let Cdash1 = Math.sqrt(adash1 ** 2 + b1 ** 2);
	let Cdash2 = Math.sqrt(adash2 ** 2 + b2 ** 2);
	let h1 = adash1 === 0 && b1 === 0 ? 0 : Math.atan2(b1, adash1);
	let h2 = adash2 === 0 && b2 === 0 ? 0 : Math.atan2(b2, adash2);
	if (h1 < 0) h1 += 2 * π$1;
	if (h2 < 0) h2 += 2 * π$1;
	h1 *= r2d;
	h2 *= r2d;
	let ΔL = L2 - L1;
	let ΔC = Cdash2 - Cdash1;
	let hdiff = h2 - h1;
	let hsum = h1 + h2;
	let habs = Math.abs(hdiff);
	let Δh;
	if (Cdash1 * Cdash2 === 0) Δh = 0;
	else if (habs <= 180) Δh = hdiff;
	else if (hdiff > 180) Δh = hdiff - 360;
	else if (hdiff < -180) Δh = hdiff + 360;
	else defaults.warn("the unthinkable has happened");
	let ΔH = 2 * Math.sqrt(Cdash2 * Cdash1) * Math.sin(Δh * d2r$1 / 2);
	let Ldash = (L1 + L2) / 2;
	let Cdash = (Cdash1 + Cdash2) / 2;
	let Cdash7 = pow7(Cdash);
	let hdash;
	if (Cdash1 * Cdash2 === 0) hdash = hsum;
	else if (habs <= 180) hdash = hsum / 2;
	else if (hsum < 360) hdash = (hsum + 360) / 2;
	else hdash = (hsum - 360) / 2;
	let lsq = (Ldash - 50) ** 2;
	let SL = 1 + .015 * lsq / Math.sqrt(20 + lsq);
	let SC = 1 + .045 * Cdash;
	let T = 1;
	T -= .17 * Math.cos((hdash - 30) * d2r$1);
	T += .24 * Math.cos(2 * hdash * d2r$1);
	T += .32 * Math.cos((3 * hdash + 6) * d2r$1);
	T -= .2 * Math.cos((4 * hdash - 63) * d2r$1);
	let SH = 1 + .015 * Cdash * T;
	let Δθ = 30 * Math.exp(-1 * ((hdash - 275) / 25) ** 2);
	let RC = 2 * Math.sqrt(Cdash7 / (Cdash7 + Gfactor));
	let RT = -1 * Math.sin(2 * Δθ * d2r$1) * RC;
	let dE = (ΔL / (kL * SL)) ** 2;
	dE += (ΔC / (kC * SC)) ** 2;
	dE += (ΔH / (kH * SH)) ** 2;
	dE += RT * (ΔC / (kC * SC)) * (ΔH / (kH * SH));
	return Math.sqrt(dE);
}
const XYZtoLMS_M$1 = [
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
const LMStoXYZ_M$1 = [
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
const LMStoLab_M = [
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
const LabtoLMS_M = [
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
var OKLab = new ColorSpace({
	id: "oklab",
	name: "Oklab",
	coords: {
		l: {
			refRange: [0, 1],
			name: "Lightness"
		},
		a: { refRange: [-.4, .4] },
		b: { refRange: [-.4, .4] }
	},
	white: "D65",
	base: xyz_d65,
	fromBase(XYZ) {
		let LMSg = multiplyMatrices(XYZtoLMS_M$1, XYZ).map((val) => Math.cbrt(val));
		return multiplyMatrices(LMStoLab_M, LMSg);
	},
	toBase(OKLab) {
		let LMS = multiplyMatrices(LabtoLMS_M, OKLab).map((val) => val ** 3);
		return multiplyMatrices(LMStoXYZ_M$1, LMS);
	},
	formats: { "oklab": { coords: [
		"<percentage> | <number>",
		"<number> | <percentage>[-1,1]",
		"<number> | <percentage>[-1,1]"
	] } }
});
function deltaEOK(color, sample) {
	[color, sample] = getColor([color, sample]);
	let [L1, a1, b1] = OKLab.from(color);
	let [L2, a2, b2] = OKLab.from(sample);
	let ΔL = L1 - L2;
	let Δa = a1 - a2;
	let Δb = b1 - b2;
	return Math.sqrt(ΔL ** 2 + Δa ** 2 + Δb ** 2);
}
const ε$5 = 75e-6;
/**
* Check if a color is in gamut of either its own or another color space
* @return {Boolean} Is the color in gamut?
*/
function inGamut(color, space, { epsilon = ε$5 } = {}) {
	color = getColor(color);
	if (!space) space = color.space;
	space = ColorSpace.get(space);
	let coords = color.coords;
	if (space !== color.space) coords = space.from(color);
	return space.inGamut(coords, { epsilon });
}
function clone(color) {
	return {
		space: color.space,
		coords: color.coords.slice(),
		alpha: color.alpha
	};
}
/**
* Euclidean distance of colors in an arbitrary color space
*/
function distance(color1, color2, space = "lab") {
	space = ColorSpace.get(space);
	let coords1 = space.from(color1);
	let coords2 = space.from(color2);
	return Math.sqrt(coords1.reduce((acc, c1, i) => {
		let c2 = coords2[i];
		if (isNaN(c1) || isNaN(c2)) return acc;
		return acc + (c2 - c1) ** 2;
	}, 0));
}
function deltaE76(color, sample) {
	return distance(color, sample, "lab");
}
const d2r = Math.PI / 180;
function deltaECMC(color, sample, { l = 2, c = 1 } = {}) {
	[color, sample] = getColor([color, sample]);
	let [L1, a1, b1] = lab.from(color);
	let [, C1, H1] = lch.from(lab, [
		L1,
		a1,
		b1
	]);
	let [L2, a2, b2] = lab.from(sample);
	let C2 = lch.from(lab, [
		L2,
		a2,
		b2
	])[1];
	if (C1 < 0) C1 = 0;
	if (C2 < 0) C2 = 0;
	let ΔL = L1 - L2;
	let ΔC = C1 - C2;
	let Δa = a1 - a2;
	let Δb = b1 - b2;
	let H2 = Δa ** 2 + Δb ** 2 - ΔC ** 2;
	let SL = .511;
	if (L1 >= 16) SL = .040975 * L1 / (1 + .01765 * L1);
	let SC = .0638 * C1 / (1 + .0131 * C1) + .638;
	let T;
	if (Number.isNaN(H1)) H1 = 0;
	if (H1 >= 164 && H1 <= 345) T = .56 + Math.abs(.2 * Math.cos((H1 + 168) * d2r));
	else T = .36 + Math.abs(.4 * Math.cos((H1 + 35) * d2r));
	let C4 = Math.pow(C1, 4);
	let F = Math.sqrt(C4 / (C4 + 1900));
	let SH = SC * (F * T + 1 - F);
	let dE = (ΔL / (l * SL)) ** 2;
	dE += (ΔC / (c * SC)) ** 2;
	dE += H2 / SH ** 2;
	return Math.sqrt(dE);
}
const Yw$1 = 203;
var XYZ_Abs_D65 = new ColorSpace({
	id: "xyz-abs-d65",
	cssId: "--xyz-abs-d65",
	name: "Absolute XYZ D65",
	coords: {
		x: {
			refRange: [0, 9504.7],
			name: "Xa"
		},
		y: {
			refRange: [0, 1e4],
			name: "Ya"
		},
		z: {
			refRange: [0, 10888.3],
			name: "Za"
		}
	},
	base: xyz_d65,
	fromBase(XYZ) {
		return XYZ.map((v) => Math.max(v * Yw$1, 0));
	},
	toBase(AbsXYZ) {
		return AbsXYZ.map((v) => Math.max(v / Yw$1, 0));
	}
});
const b$1 = 1.15;
const g = .66;
const n$1 = 2610 / 2 ** 14;
const ninv$1 = 2 ** 14 / 2610;
const c1$2 = 3424 / 4096;
const c2$2 = 2413 / 128;
const c3$2 = 2392 / 128;
const p = 1.7 * 2523 / 32;
const pinv = 32 / (1.7 * 2523);
const d = -.56;
const d0 = 16295499532821565e-27;
const XYZtoCone_M = [
	[
		.41478972,
		.579999,
		.014648
	],
	[
		-.20151,
		1.120649,
		.0531008
	],
	[
		-.0166008,
		.2648,
		.6684799
	]
];
const ConetoXYZ_M = [
	[
		1.9242264357876067,
		-1.0047923125953657,
		.037651404030618
	],
	[
		.35031676209499907,
		.7264811939316552,
		-.06538442294808501
	],
	[
		-.09098281098284752,
		-.3127282905230739,
		1.5227665613052603
	]
];
const ConetoIab_M = [
	[
		.5,
		.5,
		0
	],
	[
		3.524,
		-4.066708,
		.542708
	],
	[
		.199076,
		1.096799,
		-1.295875
	]
];
const IabtoCone_M = [
	[
		1,
		.1386050432715393,
		.05804731615611886
	],
	[
		.9999999999999999,
		-.1386050432715393,
		-.05804731615611886
	],
	[
		.9999999999999998,
		-.09601924202631895,
		-.8118918960560388
	]
];
var Jzazbz = new ColorSpace({
	id: "jzazbz",
	name: "Jzazbz",
	coords: {
		jz: {
			refRange: [0, 1],
			name: "Jz"
		},
		az: { refRange: [-.5, .5] },
		bz: { refRange: [-.5, .5] }
	},
	base: XYZ_Abs_D65,
	fromBase(XYZ) {
		let [Xa, Ya, Za] = XYZ;
		let Xm = b$1 * Xa - .1499999999999999 * Za;
		let Ym = g * Ya - -.33999999999999997 * Xa;
		let PQLMS = multiplyMatrices(XYZtoCone_M, [
			Xm,
			Ym,
			Za
		]).map(function(val) {
			return ((c1$2 + c2$2 * (val / 1e4) ** n$1) / (1 + c3$2 * (val / 1e4) ** n$1)) ** p;
		});
		let [Iz, az, bz] = multiplyMatrices(ConetoIab_M, PQLMS);
		return [
			.43999999999999995 * Iz / (1 + d * Iz) - d0,
			az,
			bz
		];
	},
	toBase(Jzazbz) {
		let [Jz, az, bz] = Jzazbz;
		let Iz = (Jz + d0) / (.43999999999999995 - d * (Jz + d0));
		let LMS = multiplyMatrices(IabtoCone_M, [
			Iz,
			az,
			bz
		]).map(function(val) {
			return 1e4 * ((c1$2 - val ** pinv) / (c3$2 * val ** pinv - c2$2)) ** ninv$1;
		});
		let [Xm, Ym, Za] = multiplyMatrices(ConetoXYZ_M, LMS);
		let Xa = (Xm + .1499999999999999 * Za) / b$1;
		return [
			Xa,
			(Ym + -.33999999999999997 * Xa) / g,
			Za
		];
	},
	formats: { "color": { coords: [
		"<number> | <percentage>",
		"<number> | <percentage>[-1,1]",
		"<number> | <percentage>[-1,1]"
	] } }
});
var jzczhz = new ColorSpace({
	id: "jzczhz",
	name: "JzCzHz",
	coords: {
		jz: {
			refRange: [0, 1],
			name: "Jz"
		},
		cz: {
			refRange: [0, 1],
			name: "Chroma"
		},
		hz: {
			refRange: [0, 360],
			type: "angle",
			name: "Hue"
		}
	},
	base: Jzazbz,
	fromBase(jzazbz) {
		let [Jz, az, bz] = jzazbz;
		let hue;
		const ε = 2e-4;
		if (Math.abs(az) < ε && Math.abs(bz) < ε) hue = NaN;
		else hue = Math.atan2(bz, az) * 180 / Math.PI;
		return [
			Jz,
			Math.sqrt(az ** 2 + bz ** 2),
			constrain(hue)
		];
	},
	toBase(jzczhz) {
		return [
			jzczhz[0],
			jzczhz[1] * Math.cos(jzczhz[2] * Math.PI / 180),
			jzczhz[1] * Math.sin(jzczhz[2] * Math.PI / 180)
		];
	}
});
function deltaEJz(color, sample) {
	[color, sample] = getColor([color, sample]);
	let [Jz1, Cz1, Hz1] = jzczhz.from(color);
	let [Jz2, Cz2, Hz2] = jzczhz.from(sample);
	let ΔJ = Jz1 - Jz2;
	let ΔC = Cz1 - Cz2;
	if (Number.isNaN(Hz1) && Number.isNaN(Hz2)) {
		Hz1 = 0;
		Hz2 = 0;
	} else if (Number.isNaN(Hz1)) Hz1 = Hz2;
	else if (Number.isNaN(Hz2)) Hz2 = Hz1;
	let Δh = Hz1 - Hz2;
	let ΔH = 2 * Math.sqrt(Cz1 * Cz2) * Math.sin(Δh / 2 * (Math.PI / 180));
	return Math.sqrt(ΔJ ** 2 + ΔC ** 2 + ΔH ** 2);
}
const c1$1 = 3424 / 4096;
const c2$1 = 2413 / 128;
const c3$1 = 2392 / 128;
const m1$1 = 2610 / 16384;
const m2 = 2523 / 32;
const im1 = 16384 / 2610;
const im2 = 32 / 2523;
const XYZtoLMS_M = [
	[
		.3592832590121217,
		.6976051147779502,
		-.035891593232029
	],
	[
		-.1920808463704993,
		1.100476797037432,
		.0753748658519118
	],
	[
		.0070797844607479,
		.0748396662186362,
		.8433265453898765
	]
];
const LMStoIPT_M = [
	[
		2048 / 4096,
		2048 / 4096,
		0
	],
	[
		6610 / 4096,
		-13613 / 4096,
		7003 / 4096
	],
	[
		17933 / 4096,
		-17390 / 4096,
		-543 / 4096
	]
];
const IPTtoLMS_M = [
	[
		.9999999999999998,
		.0086090370379328,
		.111029625003026
	],
	[
		.9999999999999998,
		-.0086090370379328,
		-.1110296250030259
	],
	[
		.9999999999999998,
		.5600313357106791,
		-.3206271749873188
	]
];
const LMStoXYZ_M = [
	[
		2.0701522183894223,
		-1.3263473389671563,
		.2066510476294053
	],
	[
		.3647385209748072,
		.6805660249472273,
		-.0453045459220347
	],
	[
		-.0497472075358123,
		-.0492609666966131,
		1.1880659249923042
	]
];
var ictcp = new ColorSpace({
	id: "ictcp",
	name: "ICTCP",
	coords: {
		i: {
			refRange: [0, 1],
			name: "I"
		},
		ct: {
			refRange: [-.5, .5],
			name: "CT"
		},
		cp: {
			refRange: [-.5, .5],
			name: "CP"
		}
	},
	base: XYZ_Abs_D65,
	fromBase(XYZ) {
		return LMStoICtCp(multiplyMatrices(XYZtoLMS_M, XYZ));
	},
	toBase(ICtCp) {
		let LMS = ICtCptoLMS(ICtCp);
		return multiplyMatrices(LMStoXYZ_M, LMS);
	}
});
function LMStoICtCp(LMS) {
	let PQLMS = LMS.map(function(val) {
		return ((c1$1 + c2$1 * (val / 1e4) ** m1$1) / (1 + c3$1 * (val / 1e4) ** m1$1)) ** m2;
	});
	return multiplyMatrices(LMStoIPT_M, PQLMS);
}
function ICtCptoLMS(ICtCp) {
	return multiplyMatrices(IPTtoLMS_M, ICtCp).map(function(val) {
		return 1e4 * (Math.max(val ** im2 - c1$1, 0) / (c2$1 - c3$1 * val ** im2)) ** im1;
	});
}
function deltaEITP(color, sample) {
	[color, sample] = getColor([color, sample]);
	let [I1, T1, P1] = ictcp.from(color);
	let [I2, T2, P2] = ictcp.from(sample);
	return 720 * Math.sqrt((I1 - I2) ** 2 + .25 * (T1 - T2) ** 2 + (P1 - P2) ** 2);
}
const white$3 = WHITES.D65;
const adaptedCoef = .42;
const adaptedCoefInv = 1 / adaptedCoef;
const tau = 2 * Math.PI;
const cat16 = [
	[
		.401288,
		.650173,
		-.051461
	],
	[
		-.250268,
		1.204414,
		.045854
	],
	[
		-.002079,
		.048952,
		.953127
	]
];
const cat16Inv = [
	[
		1.8620678550872327,
		-1.0112546305316843,
		.14918677544445175
	],
	[
		.38752654323613717,
		.6214474419314753,
		-.008973985167612518
	],
	[
		-.015841498849333856,
		-.03412293802851557,
		1.0499644368778496
	]
];
const m1 = [
	[
		460,
		451,
		288
	],
	[
		460,
		-891,
		-261
	],
	[
		460,
		-220,
		-6300
	]
];
const surroundMap = {
	dark: [
		.8,
		.525,
		.8
	],
	dim: [
		.9,
		.59,
		.9
	],
	average: [
		1,
		.69,
		1
	]
};
const hueQuadMap = {
	h: [
		20.14,
		90,
		164.25,
		237.53,
		380.14
	],
	e: [
		.8,
		.7,
		1,
		1.2,
		.8
	],
	H: [
		0,
		100,
		200,
		300,
		400
	]
};
const rad2deg = 180 / Math.PI;
const deg2rad$1 = Math.PI / 180;
function adapt$1(coords, fl) {
	return coords.map((c) => {
		const x = spow(fl * Math.abs(c) * .01, adaptedCoef);
		return 400 * copySign(x, c) / (x + 27.13);
	});
}
function unadapt(adapted, fl) {
	const constant = 100 / fl * 27.13 ** adaptedCoefInv;
	return adapted.map((c) => {
		const cabs = Math.abs(c);
		return copySign(constant * spow(cabs / (400 - cabs), adaptedCoefInv), c);
	});
}
function hueQuadrature(h) {
	let hp = constrain(h);
	if (hp <= hueQuadMap.h[0]) hp += 360;
	const i = bisectLeft(hueQuadMap.h, hp) - 1;
	const [hi, hii] = hueQuadMap.h.slice(i, i + 2);
	const [ei, eii] = hueQuadMap.e.slice(i, i + 2);
	const Hi = hueQuadMap.H[i];
	const t = (hp - hi) / ei;
	return Hi + 100 * t / (t + (hii - hp) / eii);
}
function invHueQuadrature(H) {
	let Hp = (H % 400 + 400) % 400;
	const i = Math.floor(.01 * Hp);
	Hp = Hp % 100;
	const [hi, hii] = hueQuadMap.h.slice(i, i + 2);
	const [ei, eii] = hueQuadMap.e.slice(i, i + 2);
	return constrain((Hp * (eii * hi - ei * hii) - 100 * hi * eii) / (Hp * (eii - ei) - 100 * eii));
}
function environment(refWhite, adaptingLuminance, backgroundLuminance, surround, discounting) {
	const env = {};
	env.discounting = discounting;
	env.refWhite = refWhite;
	env.surround = surround;
	const xyzW = refWhite.map((c) => {
		return c * 100;
	});
	env.la = adaptingLuminance;
	env.yb = backgroundLuminance;
	const yw = xyzW[1];
	const rgbW = multiplyMatrices(cat16, xyzW);
	surround = surroundMap[env.surround];
	const f = surround[0];
	env.c = surround[1];
	env.nc = surround[2];
	const k4 = (1 / (5 * env.la + 1)) ** 4;
	env.fl = k4 * env.la + .1 * (1 - k4) * (1 - k4) * Math.cbrt(5 * env.la);
	env.flRoot = env.fl ** .25;
	env.n = env.yb / yw;
	env.z = 1.48 + Math.sqrt(env.n);
	env.nbb = .725 * env.n ** -.2;
	env.ncb = env.nbb;
	const d = discounting ? 1 : Math.max(Math.min(f * (1 - 1 / 3.6 * Math.exp((-env.la - 42) / 92)), 1), 0);
	env.dRgb = rgbW.map((c) => {
		return interpolate(1, yw / c, d);
	});
	env.dRgbInv = env.dRgb.map((c) => {
		return 1 / c;
	});
	const rgbAW = adapt$1(rgbW.map((c, i) => {
		return c * env.dRgb[i];
	}), env.fl);
	env.aW = env.nbb * (2 * rgbAW[0] + rgbAW[1] + .05 * rgbAW[2]);
	return env;
}
const viewingConditions$1 = environment(white$3, 64 / Math.PI * .2, 20, "average", false);
function fromCam16(cam16, env) {
	if (!(cam16.J !== void 0 ^ cam16.Q !== void 0)) throw new Error("Conversion requires one and only one: 'J' or 'Q'");
	if (!(cam16.C !== void 0 ^ cam16.M !== void 0 ^ cam16.s !== void 0)) throw new Error("Conversion requires one and only one: 'C', 'M' or 's'");
	if (!(cam16.h !== void 0 ^ cam16.H !== void 0)) throw new Error("Conversion requires one and only one: 'h' or 'H'");
	if (cam16.J === 0 || cam16.Q === 0) return [
		0,
		0,
		0
	];
	let hRad = 0;
	if (cam16.h !== void 0) hRad = constrain(cam16.h) * deg2rad$1;
	else hRad = invHueQuadrature(cam16.H) * deg2rad$1;
	const cosh = Math.cos(hRad);
	const sinh = Math.sin(hRad);
	let Jroot = 0;
	if (cam16.J !== void 0) Jroot = spow(cam16.J, 1 / 2) * .1;
	else if (cam16.Q !== void 0) Jroot = .25 * env.c * cam16.Q / ((env.aW + 4) * env.flRoot);
	let alpha = 0;
	if (cam16.C !== void 0) alpha = cam16.C / Jroot;
	else if (cam16.M !== void 0) alpha = cam16.M / env.flRoot / Jroot;
	else if (cam16.s !== void 0) alpha = 4e-4 * cam16.s ** 2 * (env.aW + 4) / env.c;
	const t = spow(alpha * Math.pow(1.64 - Math.pow(.29, env.n), -.73), 10 / 9);
	const et = .25 * (Math.cos(hRad + 2) + 3.8);
	const A = env.aW * spow(Jroot, 2 / env.c / env.z);
	const p1 = 5e4 / 13 * env.nc * env.ncb * et;
	const p2 = A / env.nbb;
	const r = 23 * (p2 + .305) * zdiv(t, 23 * p1 + t * (11 * cosh + 108 * sinh));
	const a = r * cosh;
	const b = r * sinh;
	const rgb_c = unadapt(multiplyMatrices(m1, [
		p2,
		a,
		b
	]).map((c) => {
		return c * 1 / 1403;
	}), env.fl);
	return multiplyMatrices(cat16Inv, rgb_c.map((c, i) => {
		return c * env.dRgbInv[i];
	})).map((c) => {
		return c / 100;
	});
}
function toCam16(xyzd65, env) {
	const xyz100 = xyzd65.map((c) => {
		return c * 100;
	});
	const rgbA = adapt$1(multiplyMatrices(cat16, xyz100).map((c, i) => {
		return c * env.dRgb[i];
	}), env.fl);
	const a = rgbA[0] + (-12 * rgbA[1] + rgbA[2]) / 11;
	const b = (rgbA[0] + rgbA[1] - 2 * rgbA[2]) / 9;
	const hRad = (Math.atan2(b, a) % tau + tau) % tau;
	const et = .25 * (Math.cos(hRad + 2) + 3.8);
	const alpha = spow(5e4 / 13 * env.nc * env.ncb * zdiv(et * Math.sqrt(a ** 2 + b ** 2), rgbA[0] + rgbA[1] + 1.05 * rgbA[2] + .305), .9) * Math.pow(1.64 - Math.pow(.29, env.n), .73);
	const Jroot = spow(env.nbb * (2 * rgbA[0] + rgbA[1] + .05 * rgbA[2]) / env.aW, .5 * env.c * env.z);
	const J = 100 * spow(Jroot, 2);
	const Q = 4 / env.c * Jroot * (env.aW + 4) * env.flRoot;
	const C = alpha * Jroot;
	const M = C * env.flRoot;
	const h = constrain(hRad * rad2deg);
	const H = hueQuadrature(h);
	return {
		J,
		C,
		h,
		s: 50 * spow(env.c * alpha / (env.aW + 4), 1 / 2),
		Q,
		M,
		H
	};
}
var cam16 = new ColorSpace({
	id: "cam16-jmh",
	cssId: "--cam16-jmh",
	name: "CAM16-JMh",
	coords: {
		j: {
			refRange: [0, 100],
			name: "J"
		},
		m: {
			refRange: [0, 105],
			name: "Colorfulness"
		},
		h: {
			refRange: [0, 360],
			type: "angle",
			name: "Hue"
		}
	},
	base: xyz_d65,
	fromBase(xyz) {
		const cam16 = toCam16(xyz, viewingConditions$1);
		return [
			cam16.J,
			cam16.M,
			cam16.h
		];
	},
	toBase(cam16) {
		return fromCam16({
			J: cam16[0],
			M: cam16[1],
			h: cam16[2]
		}, viewingConditions$1);
	}
});
const white$2 = WHITES.D65;
const ε$4 = 216 / 24389;
const κ$3 = 24389 / 27;
function toLstar(y) {
	return 116 * (y > ε$4 ? Math.cbrt(y) : (κ$3 * y + 16) / 116) - 16;
}
function fromLstar(lstar) {
	return lstar > 8 ? Math.pow((lstar + 16) / 116, 3) : lstar / κ$3;
}
function fromHct(coords, env) {
	let [h, c, t] = coords;
	let xyz = [];
	let j = 0;
	if (t === 0) return [
		0,
		0,
		0
	];
	let y = fromLstar(t);
	if (t > 0) j = .00379058511492914 * t ** 2 + .608983189401032 * t + .9155088574762233;
	else j = 9514440756550361e-21 * t ** 2 + .08693057439788597 * t - 21.928975842194614;
	const threshold = 2e-12;
	const max_attempts = 15;
	let attempt = 0;
	let last = Infinity;
	while (attempt <= max_attempts) {
		xyz = fromCam16({
			J: j,
			C: c,
			h
		}, env);
		const delta = Math.abs(xyz[1] - y);
		if (delta < last) {
			if (delta <= threshold) return xyz;
			last = delta;
		}
		j = j - (xyz[1] - y) * j / (2 * xyz[1]);
		attempt += 1;
	}
	return fromCam16({
		J: j,
		C: c,
		h
	}, env);
}
function toHct(xyz, env) {
	const t = toLstar(xyz[1]);
	if (t === 0) return [
		0,
		0,
		0
	];
	const cam16 = toCam16(xyz, viewingConditions);
	return [
		constrain(cam16.h),
		cam16.C,
		t
	];
}
const viewingConditions = environment(white$2, 200 / Math.PI * fromLstar(50), fromLstar(50) * 100, "average", false);
var hct = new ColorSpace({
	id: "hct",
	name: "HCT",
	coords: {
		h: {
			refRange: [0, 360],
			type: "angle",
			name: "Hue"
		},
		c: {
			refRange: [0, 145],
			name: "Colorfulness"
		},
		t: {
			refRange: [0, 100],
			name: "Tone"
		}
	},
	base: xyz_d65,
	fromBase(xyz) {
		return toHct(xyz);
	},
	toBase(hct) {
		return fromHct(hct, viewingConditions);
	},
	formats: { color: {
		id: "--hct",
		coords: [
			"<number> | <angle>",
			"<percentage> | <number>",
			"<percentage> | <number>"
		]
	} }
});
const deg2rad = Math.PI / 180;
const ucsCoeff = [
	1,
	.007,
	.0228
];
/**
* Convert HCT chroma and hue (CAM16 JMh colorfulness and hue) using UCS logic for a and b.
* @param {number[]} coords - HCT coordinates.
* @return {number[]}
*/
function convertUcsAb(coords) {
	if (coords[1] < 0) coords = hct.fromBase(hct.toBase(coords));
	const M = Math.log(Math.max(1 + ucsCoeff[2] * coords[1] * viewingConditions.flRoot, 1)) / ucsCoeff[2];
	const hrad = coords[0] * deg2rad;
	const a = M * Math.cos(hrad);
	const b = M * Math.sin(hrad);
	return [
		coords[2],
		a,
		b
	];
}
/**
* Color distance using HCT.
* @param {Color} color - Color to compare.
* @param {Color} sample - Color to compare.
* @return {number[]}
*/
function deltaEHCT(color, sample) {
	[color, sample] = getColor([color, sample]);
	let [t1, a1, b1] = convertUcsAb(hct.from(color));
	let [t2, a2, b2] = convertUcsAb(hct.from(sample));
	return Math.sqrt((t1 - t2) ** 2 + (a1 - a2) ** 2 + (b1 - b2) ** 2);
}
var deltaEMethods = {
	deltaE76,
	deltaECMC,
	deltaE2000,
	deltaEJz,
	deltaEITP,
	deltaEOK,
	deltaEHCT
};
/**
* Calculate the epsilon to 2 degrees smaller than the specified JND.
* @param {Number} jnd - The target "just noticeable difference".
* @returns {Number}
*/
function calcEpsilon(jnd) {
	return Math.max(parseFloat(`1e${(!jnd ? 0 : Math.floor(Math.log10(Math.abs(jnd)))) - 2}`), 1e-6);
}
const GMAPPRESET = {
	"hct": {
		method: "hct.c",
		jnd: 2,
		deltaEMethod: "hct",
		blackWhiteClamp: {}
	},
	"hct-tonal": {
		method: "hct.c",
		jnd: 0,
		deltaEMethod: "hct",
		blackWhiteClamp: {
			channel: "hct.t",
			min: 0,
			max: 100
		}
	}
};
/**
* Force coordinates to be in gamut of a certain color space.
* Mutates the color it is passed.
* @param {Object|string} options object or spaceId string
* @param {string} options.method - How to force into gamut.
*        If "clip", coordinates are just clipped to their reference range.
*        If "css", coordinates are reduced according to the CSS 4 Gamut Mapping Algorithm.
*        If in the form [colorSpaceId].[coordName], that coordinate is reduced
*        until the color is in gamut. Please note that this may produce nonsensical
*        results for certain coordinates (e.g. hue) or infinite loops if reducing the coordinate never brings the color in gamut.
* @param {ColorSpace|string} options.space - The space whose gamut we want to map to
* @param {string} options.deltaEMethod - The delta E method to use while performing gamut mapping.
*        If no method is specified, delta E 2000 is used.
* @param {Number} options.jnd - The "just noticeable difference" to target.
* @param {Object} options.blackWhiteClamp - Used to configure SDR black and clamping.
*        "channel" indicates the "space.channel" to use for determining when to clamp.
*        "min" indicates the lower limit for black clamping and "max" indicates the upper
*        limit for white clamping.
*/
function toGamut(color, { method = defaults.gamut_mapping, space = void 0, deltaEMethod = "", jnd = 2, blackWhiteClamp = {} } = {}) {
	color = getColor(color);
	if (isString(arguments[1])) space = arguments[1];
	else if (!space) space = color.space;
	space = ColorSpace.get(space);
	if (inGamut(color, space, { epsilon: 0 })) return color;
	let spaceColor;
	if (method === "css") spaceColor = toGamutCSS(color, { space });
	else {
		if (method !== "clip" && !inGamut(color, space)) {
			if (Object.prototype.hasOwnProperty.call(GMAPPRESET, method)) ({method, jnd, deltaEMethod, blackWhiteClamp} = GMAPPRESET[method]);
			let de = deltaE2000;
			if (deltaEMethod !== "") {
				for (let m in deltaEMethods) if ("deltae" + deltaEMethod.toLowerCase() === m.toLowerCase()) {
					de = deltaEMethods[m];
					break;
				}
			}
			let clipped = toGamut(to(color, space), {
				method: "clip",
				space
			});
			if (de(color, clipped) > jnd) {
				if (Object.keys(blackWhiteClamp).length === 3) {
					let channelMeta = ColorSpace.resolveCoord(blackWhiteClamp.channel);
					let channel = get(to(color, channelMeta.space), channelMeta.id);
					if (isNone(channel)) channel = 0;
					if (channel >= blackWhiteClamp.max) return to({
						space: "xyz-d65",
						coords: WHITES["D65"]
					}, color.space);
					else if (channel <= blackWhiteClamp.min) return to({
						space: "xyz-d65",
						coords: [
							0,
							0,
							0
						]
					}, color.space);
				}
				let coordMeta = ColorSpace.resolveCoord(method);
				let mapSpace = coordMeta.space;
				let coordId = coordMeta.id;
				let mappedColor = to(color, mapSpace);
				mappedColor.coords.forEach((c, i) => {
					if (isNone(c)) mappedColor.coords[i] = 0;
				});
				let min = (coordMeta.range || coordMeta.refRange)[0];
				let ε = calcEpsilon(jnd);
				let low = min;
				let high = get(mappedColor, coordId);
				while (high - low > ε) {
					let clipped = clone(mappedColor);
					clipped = toGamut(clipped, {
						space,
						method: "clip"
					});
					if (de(mappedColor, clipped) - jnd < ε) low = get(mappedColor, coordId);
					else high = get(mappedColor, coordId);
					set(mappedColor, coordId, (low + high) / 2);
				}
				spaceColor = to(mappedColor, space);
			} else spaceColor = clipped;
		} else spaceColor = to(color, space);
		if (method === "clip" || !inGamut(spaceColor, space, { epsilon: 0 })) {
			let bounds = Object.values(space.coords).map((c) => c.range || []);
			spaceColor.coords = spaceColor.coords.map((c, i) => {
				let [min, max] = bounds[i];
				if (min !== void 0) c = Math.max(min, c);
				if (max !== void 0) c = Math.min(c, max);
				return c;
			});
		}
	}
	if (space !== color.space) spaceColor = to(spaceColor, color.space);
	color.coords = spaceColor.coords;
	return color;
}
toGamut.returns = "color";
const COLORS = {
	WHITE: {
		space: OKLab,
		coords: [
			1,
			0,
			0
		]
	},
	BLACK: {
		space: OKLab,
		coords: [
			0,
			0,
			0
		]
	}
};
/**
* Given a color `origin`, returns a new color that is in gamut using
* the CSS Gamut Mapping Algorithm. If `space` is specified, it will be in gamut
* in `space`, and returned in `space`. Otherwise, it will be in gamut and
* returned in the color space of `origin`.
* @param {Object} origin
* @param {Object} options
* @param {ColorSpace|string} options.space
* @returns {Color}
*/
function toGamutCSS(origin, { space } = {}) {
	const JND = .02;
	const ε = 1e-4;
	origin = getColor(origin);
	if (!space) space = origin.space;
	space = ColorSpace.get(space);
	const oklchSpace = ColorSpace.get("oklch");
	if (space.isUnbounded) return to(origin, space);
	const origin_OKLCH = to(origin, oklchSpace);
	let L = origin_OKLCH.coords[0];
	if (L >= 1) {
		const white = to(COLORS.WHITE, space);
		white.alpha = origin.alpha;
		return to(white, space);
	}
	if (L <= 0) {
		const black = to(COLORS.BLACK, space);
		black.alpha = origin.alpha;
		return to(black, space);
	}
	if (inGamut(origin_OKLCH, space, { epsilon: 0 })) return to(origin_OKLCH, space);
	function clip(_color) {
		const destColor = to(_color, space);
		const spaceCoords = Object.values(space.coords);
		destColor.coords = destColor.coords.map((coord, index) => {
			if ("range" in spaceCoords[index]) {
				const [min, max] = spaceCoords[index].range;
				return clamp(min, coord, max);
			}
			return coord;
		});
		return destColor;
	}
	let min = 0;
	let max = origin_OKLCH.coords[1];
	let min_inGamut = true;
	let current = clone(origin_OKLCH);
	let clipped = clip(current);
	let E = deltaEOK(clipped, current);
	if (E < JND) return clipped;
	while (max - min > ε) {
		const chroma = (min + max) / 2;
		current.coords[1] = chroma;
		if (min_inGamut && inGamut(current, space, { epsilon: 0 })) min = chroma;
		else {
			clipped = clip(current);
			E = deltaEOK(clipped, current);
			if (E < JND) {
				if (JND - E < ε) break;
				else {
					min_inGamut = false;
					min = chroma;
				}
			} else max = chroma;
		}
	}
	return clipped;
}
/**
* Convert to color space and return a new color
* @param {Object|string} space - Color space object or id
* @param {Object} options
* @param {boolean} options.inGamut - Whether to force resulting color in gamut
* @returns {Color}
*/
function to(color, space, { inGamut } = {}) {
	color = getColor(color);
	space = ColorSpace.get(space);
	let coords = space.from(color);
	let ret = {
		space,
		coords,
		alpha: color.alpha
	};
	if (inGamut) ret = toGamut(ret, inGamut === true ? void 0 : inGamut);
	return ret;
}
to.returns = "color";
/**
* Generic toString() method, outputs a color(spaceId ...coords) function, a functional syntax, or custom formats defined by the color space
* @param {Object} options
* @param {number} options.precision - Significant digits
* @param {boolean} options.inGamut - Adjust coordinates to fit in gamut first? [default: false]
*/
function serialize(color, { precision = defaults.precision, format = "default", inGamut: inGamut$1 = true, ...customOptions } = {}) {
	let ret;
	color = getColor(color);
	let formatId = format;
	format = color.space.getFormat(format) ?? color.space.getFormat("default") ?? ColorSpace.DEFAULT_FORMAT;
	let coords = color.coords.slice();
	inGamut$1 ||= format.toGamut;
	if (inGamut$1 && !inGamut(color)) coords = toGamut(clone(color), inGamut$1 === true ? void 0 : inGamut$1).coords;
	if (format.type === "custom") {
		customOptions.precision = precision;
		if (format.serialize) ret = format.serialize(coords, color.alpha, customOptions);
		else throw new TypeError(`format ${formatId} can only be used to parse colors, not for serialization`);
	} else {
		let name = format.name || "color";
		if (format.serializeCoords) coords = format.serializeCoords(coords, precision);
		else if (precision !== null) coords = coords.map((c) => {
			return serializeNumber(c, { precision });
		});
		let args = [...coords];
		if (name === "color") {
			let cssId = format.id || format.ids?.[0] || color.space.id;
			args.unshift(cssId);
		}
		let alpha = color.alpha;
		if (precision !== null) alpha = serializeNumber(alpha, { precision });
		let strAlpha = color.alpha >= 1 || format.noAlpha ? "" : `${format.commas ? "," : " /"} ${alpha}`;
		ret = `${name}(${args.join(format.commas ? ", " : " ")}${strAlpha})`;
	}
	return ret;
}
var REC2020Linear = new RGBColorSpace({
	id: "rec2020-linear",
	cssId: "--rec2020-linear",
	name: "Linear REC.2020",
	white: "D65",
	toXYZ_M: [
		[
			.6369580483012914,
			.14461690358620832,
			.1688809751641721
		],
		[
			.2627002120112671,
			.6779980715188708,
			.05930171646986196
		],
		[
			0,
			.028072693049087428,
			1.060985057710791
		]
	],
	fromXYZ_M: [
		[
			1.716651187971268,
			-.355670783776392,
			-.25336628137366
		],
		[
			-.666684351832489,
			1.616481236634939,
			.0157685458139111
		],
		[
			.017639857445311,
			-.042770613257809,
			.942103121235474
		]
	]
});
const α = 1.09929682680944;
const β = .018053968510807;
var REC2020 = new RGBColorSpace({
	id: "rec2020",
	name: "REC.2020",
	base: REC2020Linear,
	toBase(RGB) {
		return RGB.map(function(val) {
			if (val < β * 4.5) return val / 4.5;
			return Math.pow((val + α - 1) / α, 1 / .45);
		});
	},
	fromBase(RGB) {
		return RGB.map(function(val) {
			if (val >= β) return α * Math.pow(val, .45) - .09929682680944008;
			return 4.5 * val;
		});
	}
});
var P3Linear = new RGBColorSpace({
	id: "p3-linear",
	cssId: "--display-p3-linear",
	name: "Linear P3",
	white: "D65",
	toXYZ_M: [
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
	],
	fromXYZ_M: [
		[
			2.493496911941425,
			-.9313836179191239,
			-.40271078445071684
		],
		[
			-.8294889695615747,
			1.7626640603183463,
			.023624685841943577
		],
		[
			.03584583024378447,
			-.07617238926804182,
			.9568845240076872
		]
	]
});
const toXYZ_M$3 = [
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
const fromXYZ_M$3 = [
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
var sRGBLinear = new RGBColorSpace({
	id: "srgb-linear",
	name: "Linear sRGB",
	white: "D65",
	toXYZ_M: toXYZ_M$3,
	fromXYZ_M: fromXYZ_M$3
});
var KEYWORDS = {
	"aliceblue": [
		240 / 255,
		248 / 255,
		1
	],
	"antiquewhite": [
		250 / 255,
		235 / 255,
		215 / 255
	],
	"aqua": [
		0,
		1,
		1
	],
	"aquamarine": [
		127 / 255,
		1,
		212 / 255
	],
	"azure": [
		240 / 255,
		1,
		1
	],
	"beige": [
		245 / 255,
		245 / 255,
		220 / 255
	],
	"bisque": [
		1,
		228 / 255,
		196 / 255
	],
	"black": [
		0,
		0,
		0
	],
	"blanchedalmond": [
		1,
		235 / 255,
		205 / 255
	],
	"blue": [
		0,
		0,
		1
	],
	"blueviolet": [
		138 / 255,
		43 / 255,
		226 / 255
	],
	"brown": [
		165 / 255,
		42 / 255,
		42 / 255
	],
	"burlywood": [
		222 / 255,
		184 / 255,
		135 / 255
	],
	"cadetblue": [
		95 / 255,
		158 / 255,
		160 / 255
	],
	"chartreuse": [
		127 / 255,
		1,
		0
	],
	"chocolate": [
		210 / 255,
		105 / 255,
		30 / 255
	],
	"coral": [
		1,
		127 / 255,
		80 / 255
	],
	"cornflowerblue": [
		100 / 255,
		149 / 255,
		237 / 255
	],
	"cornsilk": [
		1,
		248 / 255,
		220 / 255
	],
	"crimson": [
		220 / 255,
		20 / 255,
		60 / 255
	],
	"cyan": [
		0,
		1,
		1
	],
	"darkblue": [
		0,
		0,
		139 / 255
	],
	"darkcyan": [
		0,
		139 / 255,
		139 / 255
	],
	"darkgoldenrod": [
		184 / 255,
		134 / 255,
		11 / 255
	],
	"darkgray": [
		169 / 255,
		169 / 255,
		169 / 255
	],
	"darkgreen": [
		0,
		100 / 255,
		0
	],
	"darkgrey": [
		169 / 255,
		169 / 255,
		169 / 255
	],
	"darkkhaki": [
		189 / 255,
		183 / 255,
		107 / 255
	],
	"darkmagenta": [
		139 / 255,
		0,
		139 / 255
	],
	"darkolivegreen": [
		85 / 255,
		107 / 255,
		47 / 255
	],
	"darkorange": [
		1,
		140 / 255,
		0
	],
	"darkorchid": [
		153 / 255,
		50 / 255,
		204 / 255
	],
	"darkred": [
		139 / 255,
		0,
		0
	],
	"darksalmon": [
		233 / 255,
		150 / 255,
		122 / 255
	],
	"darkseagreen": [
		143 / 255,
		188 / 255,
		143 / 255
	],
	"darkslateblue": [
		72 / 255,
		61 / 255,
		139 / 255
	],
	"darkslategray": [
		47 / 255,
		79 / 255,
		79 / 255
	],
	"darkslategrey": [
		47 / 255,
		79 / 255,
		79 / 255
	],
	"darkturquoise": [
		0,
		206 / 255,
		209 / 255
	],
	"darkviolet": [
		148 / 255,
		0,
		211 / 255
	],
	"deeppink": [
		1,
		20 / 255,
		147 / 255
	],
	"deepskyblue": [
		0,
		191 / 255,
		1
	],
	"dimgray": [
		105 / 255,
		105 / 255,
		105 / 255
	],
	"dimgrey": [
		105 / 255,
		105 / 255,
		105 / 255
	],
	"dodgerblue": [
		30 / 255,
		144 / 255,
		1
	],
	"firebrick": [
		178 / 255,
		34 / 255,
		34 / 255
	],
	"floralwhite": [
		1,
		250 / 255,
		240 / 255
	],
	"forestgreen": [
		34 / 255,
		139 / 255,
		34 / 255
	],
	"fuchsia": [
		1,
		0,
		1
	],
	"gainsboro": [
		220 / 255,
		220 / 255,
		220 / 255
	],
	"ghostwhite": [
		248 / 255,
		248 / 255,
		1
	],
	"gold": [
		1,
		215 / 255,
		0
	],
	"goldenrod": [
		218 / 255,
		165 / 255,
		32 / 255
	],
	"gray": [
		128 / 255,
		128 / 255,
		128 / 255
	],
	"green": [
		0,
		128 / 255,
		0
	],
	"greenyellow": [
		173 / 255,
		1,
		47 / 255
	],
	"grey": [
		128 / 255,
		128 / 255,
		128 / 255
	],
	"honeydew": [
		240 / 255,
		1,
		240 / 255
	],
	"hotpink": [
		1,
		105 / 255,
		180 / 255
	],
	"indianred": [
		205 / 255,
		92 / 255,
		92 / 255
	],
	"indigo": [
		75 / 255,
		0,
		130 / 255
	],
	"ivory": [
		1,
		1,
		240 / 255
	],
	"khaki": [
		240 / 255,
		230 / 255,
		140 / 255
	],
	"lavender": [
		230 / 255,
		230 / 255,
		250 / 255
	],
	"lavenderblush": [
		1,
		240 / 255,
		245 / 255
	],
	"lawngreen": [
		124 / 255,
		252 / 255,
		0
	],
	"lemonchiffon": [
		1,
		250 / 255,
		205 / 255
	],
	"lightblue": [
		173 / 255,
		216 / 255,
		230 / 255
	],
	"lightcoral": [
		240 / 255,
		128 / 255,
		128 / 255
	],
	"lightcyan": [
		224 / 255,
		1,
		1
	],
	"lightgoldenrodyellow": [
		250 / 255,
		250 / 255,
		210 / 255
	],
	"lightgray": [
		211 / 255,
		211 / 255,
		211 / 255
	],
	"lightgreen": [
		144 / 255,
		238 / 255,
		144 / 255
	],
	"lightgrey": [
		211 / 255,
		211 / 255,
		211 / 255
	],
	"lightpink": [
		1,
		182 / 255,
		193 / 255
	],
	"lightsalmon": [
		1,
		160 / 255,
		122 / 255
	],
	"lightseagreen": [
		32 / 255,
		178 / 255,
		170 / 255
	],
	"lightskyblue": [
		135 / 255,
		206 / 255,
		250 / 255
	],
	"lightslategray": [
		119 / 255,
		136 / 255,
		153 / 255
	],
	"lightslategrey": [
		119 / 255,
		136 / 255,
		153 / 255
	],
	"lightsteelblue": [
		176 / 255,
		196 / 255,
		222 / 255
	],
	"lightyellow": [
		1,
		1,
		224 / 255
	],
	"lime": [
		0,
		1,
		0
	],
	"limegreen": [
		50 / 255,
		205 / 255,
		50 / 255
	],
	"linen": [
		250 / 255,
		240 / 255,
		230 / 255
	],
	"magenta": [
		1,
		0,
		1
	],
	"maroon": [
		128 / 255,
		0,
		0
	],
	"mediumaquamarine": [
		102 / 255,
		205 / 255,
		170 / 255
	],
	"mediumblue": [
		0,
		0,
		205 / 255
	],
	"mediumorchid": [
		186 / 255,
		85 / 255,
		211 / 255
	],
	"mediumpurple": [
		147 / 255,
		112 / 255,
		219 / 255
	],
	"mediumseagreen": [
		60 / 255,
		179 / 255,
		113 / 255
	],
	"mediumslateblue": [
		123 / 255,
		104 / 255,
		238 / 255
	],
	"mediumspringgreen": [
		0,
		250 / 255,
		154 / 255
	],
	"mediumturquoise": [
		72 / 255,
		209 / 255,
		204 / 255
	],
	"mediumvioletred": [
		199 / 255,
		21 / 255,
		133 / 255
	],
	"midnightblue": [
		25 / 255,
		25 / 255,
		112 / 255
	],
	"mintcream": [
		245 / 255,
		1,
		250 / 255
	],
	"mistyrose": [
		1,
		228 / 255,
		225 / 255
	],
	"moccasin": [
		1,
		228 / 255,
		181 / 255
	],
	"navajowhite": [
		1,
		222 / 255,
		173 / 255
	],
	"navy": [
		0,
		0,
		128 / 255
	],
	"oldlace": [
		253 / 255,
		245 / 255,
		230 / 255
	],
	"olive": [
		128 / 255,
		128 / 255,
		0
	],
	"olivedrab": [
		107 / 255,
		142 / 255,
		35 / 255
	],
	"orange": [
		1,
		165 / 255,
		0
	],
	"orangered": [
		1,
		69 / 255,
		0
	],
	"orchid": [
		218 / 255,
		112 / 255,
		214 / 255
	],
	"palegoldenrod": [
		238 / 255,
		232 / 255,
		170 / 255
	],
	"palegreen": [
		152 / 255,
		251 / 255,
		152 / 255
	],
	"paleturquoise": [
		175 / 255,
		238 / 255,
		238 / 255
	],
	"palevioletred": [
		219 / 255,
		112 / 255,
		147 / 255
	],
	"papayawhip": [
		1,
		239 / 255,
		213 / 255
	],
	"peachpuff": [
		1,
		218 / 255,
		185 / 255
	],
	"peru": [
		205 / 255,
		133 / 255,
		63 / 255
	],
	"pink": [
		1,
		192 / 255,
		203 / 255
	],
	"plum": [
		221 / 255,
		160 / 255,
		221 / 255
	],
	"powderblue": [
		176 / 255,
		224 / 255,
		230 / 255
	],
	"purple": [
		128 / 255,
		0,
		128 / 255
	],
	"rebeccapurple": [
		102 / 255,
		51 / 255,
		153 / 255
	],
	"red": [
		1,
		0,
		0
	],
	"rosybrown": [
		188 / 255,
		143 / 255,
		143 / 255
	],
	"royalblue": [
		65 / 255,
		105 / 255,
		225 / 255
	],
	"saddlebrown": [
		139 / 255,
		69 / 255,
		19 / 255
	],
	"salmon": [
		250 / 255,
		128 / 255,
		114 / 255
	],
	"sandybrown": [
		244 / 255,
		164 / 255,
		96 / 255
	],
	"seagreen": [
		46 / 255,
		139 / 255,
		87 / 255
	],
	"seashell": [
		1,
		245 / 255,
		238 / 255
	],
	"sienna": [
		160 / 255,
		82 / 255,
		45 / 255
	],
	"silver": [
		192 / 255,
		192 / 255,
		192 / 255
	],
	"skyblue": [
		135 / 255,
		206 / 255,
		235 / 255
	],
	"slateblue": [
		106 / 255,
		90 / 255,
		205 / 255
	],
	"slategray": [
		112 / 255,
		128 / 255,
		144 / 255
	],
	"slategrey": [
		112 / 255,
		128 / 255,
		144 / 255
	],
	"snow": [
		1,
		250 / 255,
		250 / 255
	],
	"springgreen": [
		0,
		1,
		127 / 255
	],
	"steelblue": [
		70 / 255,
		130 / 255,
		180 / 255
	],
	"tan": [
		210 / 255,
		180 / 255,
		140 / 255
	],
	"teal": [
		0,
		128 / 255,
		128 / 255
	],
	"thistle": [
		216 / 255,
		191 / 255,
		216 / 255
	],
	"tomato": [
		1,
		99 / 255,
		71 / 255
	],
	"turquoise": [
		64 / 255,
		224 / 255,
		208 / 255
	],
	"violet": [
		238 / 255,
		130 / 255,
		238 / 255
	],
	"wheat": [
		245 / 255,
		222 / 255,
		179 / 255
	],
	"white": [
		1,
		1,
		1
	],
	"whitesmoke": [
		245 / 255,
		245 / 255,
		245 / 255
	],
	"yellow": [
		1,
		1,
		0
	],
	"yellowgreen": [
		154 / 255,
		205 / 255,
		50 / 255
	]
};
let coordGrammar = Array(3).fill("<percentage> | <number>[0, 255]");
let coordGrammarNumber = Array(3).fill("<number>[0, 255]");
var sRGB = new RGBColorSpace({
	id: "srgb",
	name: "sRGB",
	base: sRGBLinear,
	fromBase: (rgb) => {
		return rgb.map((val) => {
			let sign = val < 0 ? -1 : 1;
			let abs = val * sign;
			if (abs > .0031308) return sign * (1.055 * abs ** (1 / 2.4) - .055);
			return 12.92 * val;
		});
	},
	toBase: (rgb) => {
		return rgb.map((val) => {
			let sign = val < 0 ? -1 : 1;
			let abs = val * sign;
			if (abs <= .04045) return val / 12.92;
			return sign * ((abs + .055) / 1.055) ** 2.4;
		});
	},
	formats: {
		"rgb": { coords: coordGrammar },
		"rgb_number": {
			name: "rgb",
			commas: true,
			coords: coordGrammarNumber,
			noAlpha: true
		},
		"color": {},
		"rgba": {
			coords: coordGrammar,
			commas: true,
			lastAlpha: true
		},
		"rgba_number": {
			name: "rgba",
			commas: true,
			coords: coordGrammarNumber
		},
		"hex": {
			type: "custom",
			toGamut: true,
			test: (str) => /^#([a-f0-9]{3,4}){1,2}$/i.test(str),
			parse(str) {
				if (str.length <= 5) str = str.replace(/[a-f0-9]/gi, "$&$&");
				let rgba = [];
				str.replace(/[a-f0-9]{2}/gi, (component) => {
					rgba.push(parseInt(component, 16) / 255);
				});
				return {
					spaceId: "srgb",
					coords: rgba.slice(0, 3),
					alpha: rgba.slice(3)[0]
				};
			},
			serialize: (coords, alpha, { collapse = true } = {}) => {
				if (alpha < 1) coords.push(alpha);
				coords = coords.map((c) => Math.round(c * 255));
				let collapsible = collapse && coords.every((c) => c % 17 === 0);
				return "#" + coords.map((c) => {
					if (collapsible) return (c / 17).toString(16);
					return c.toString(16).padStart(2, "0");
				}).join("");
			}
		},
		"keyword": {
			type: "custom",
			test: (str) => /^[a-z]+$/i.test(str),
			parse(str) {
				str = str.toLowerCase();
				let ret = {
					spaceId: "srgb",
					coords: null,
					alpha: 1
				};
				if (str === "transparent") {
					ret.coords = KEYWORDS.black;
					ret.alpha = 0;
				} else ret.coords = KEYWORDS[str];
				if (ret.coords) return ret;
			}
		}
	}
});
var P3 = new RGBColorSpace({
	id: "p3",
	cssId: "display-p3",
	name: "P3",
	base: P3Linear,
	fromBase: sRGB.fromBase,
	toBase: sRGB.toBase
});
defaults.display_space = sRGB;
let supportsNone;
if (typeof CSS !== "undefined" && CSS.supports) for (let space of [
	lab,
	REC2020,
	P3
]) {
	let str = serialize({
		space,
		coords: space.getMinCoords(),
		alpha: 1
	});
	if (CSS.supports("color", str)) {
		defaults.display_space = space;
		break;
	}
}
/**
* Returns a serialization of the color that can actually be displayed in the browser.
* If the default serialization can be displayed, it is returned.
* Otherwise, the color is converted to Lab, REC2020, or P3, whichever is the widest supported.
* In Node.js, this is basically equivalent to `serialize()` but returns a `String` object instead.
*
* @export
* @param {{space, coords} | Color | string} color
* @param {*} [options={}] Options to be passed to serialize()
* @param {ColorSpace | string} [options.space = defaults.display_space] Color space to use for serialization if default is not supported
* @returns {String} String object containing the serialized color with a color property containing the converted color (or the original, if no conversion was necessary)
*/
function display(color, { space = defaults.display_space, ...options } = {}) {
	let ret = serialize(color, options);
	if (typeof CSS === "undefined" || CSS.supports("color", ret) || !defaults.display_space) {
		ret = new String(ret);
		ret.color = color;
	} else {
		let fallbackColor = color;
		if (color.coords.some(isNone) || isNone(color.alpha)) {
			if (!(supportsNone ??= CSS.supports("color", "hsl(none 50% 50%)"))) {
				fallbackColor = clone(color);
				fallbackColor.coords = fallbackColor.coords.map(skipNone);
				fallbackColor.alpha = skipNone(fallbackColor.alpha);
				ret = serialize(fallbackColor, options);
				if (CSS.supports("color", ret)) {
					ret = new String(ret);
					ret.color = fallbackColor;
					return ret;
				}
			}
		}
		fallbackColor = to(fallbackColor, space);
		ret = new String(serialize(fallbackColor, options));
		ret.color = fallbackColor;
	}
	return ret;
}
function equals(color1, color2) {
	color1 = getColor(color1);
	color2 = getColor(color2);
	return color1.space === color2.space && color1.alpha === color2.alpha && color1.coords.every((c, i) => c === color2.coords[i]);
}
/**
* Relative luminance
*/
function getLuminance(color) {
	return get(color, [xyz_d65, "y"]);
}
function setLuminance(color, value) {
	set(color, [xyz_d65, "y"], value);
}
function register$2(Color) {
	Object.defineProperty(Color.prototype, "luminance", {
		get() {
			return getLuminance(this);
		},
		set(value) {
			setLuminance(this, value);
		}
	});
}
var luminance = /*#__PURE__*/ Object.freeze({
	__proto__: null,
	getLuminance,
	register: register$2,
	setLuminance
});
function contrastWCAG21(color1, color2) {
	color1 = getColor(color1);
	color2 = getColor(color2);
	let Y1 = Math.max(getLuminance(color1), 0);
	let Y2 = Math.max(getLuminance(color2), 0);
	if (Y2 > Y1) [Y1, Y2] = [Y2, Y1];
	return (Y1 + .05) / (Y2 + .05);
}
const normBG = .56;
const normTXT = .57;
const revTXT = .62;
const revBG = .65;
const blkThrs = .022;
const blkClmp = 1.414;
const loClip = .1;
const deltaYmin = 5e-4;
const scaleBoW = 1.14;
const loBoWoffset = .027;
const scaleWoB = 1.14;
function fclamp(Y) {
	if (Y >= blkThrs) return Y;
	return Y + (blkThrs - Y) ** blkClmp;
}
function linearize(val) {
	return (val < 0 ? -1 : 1) * Math.pow(Math.abs(val), 2.4);
}
function contrastAPCA(background, foreground) {
	foreground = getColor(foreground);
	background = getColor(background);
	let S;
	let C;
	let Sapc;
	let R, G, B;
	foreground = to(foreground, "srgb");
	[R, G, B] = foreground.coords;
	let lumTxt = linearize(R) * .2126729 + linearize(G) * .7151522 + linearize(B) * .072175;
	background = to(background, "srgb");
	[R, G, B] = background.coords;
	let lumBg = linearize(R) * .2126729 + linearize(G) * .7151522 + linearize(B) * .072175;
	let Ytxt = fclamp(lumTxt);
	let Ybg = fclamp(lumBg);
	let BoW = Ybg > Ytxt;
	if (Math.abs(Ybg - Ytxt) < deltaYmin) C = 0;
	else if (BoW) {
		S = Ybg ** normBG - Ytxt ** normTXT;
		C = S * scaleBoW;
	} else {
		S = Ybg ** revBG - Ytxt ** revTXT;
		C = S * scaleWoB;
	}
	if (Math.abs(C) < loClip) Sapc = 0;
	else if (C > 0) Sapc = C - loBoWoffset;
	else Sapc = C + loBoWoffset;
	return Sapc * 100;
}
function contrastMichelson(color1, color2) {
	color1 = getColor(color1);
	color2 = getColor(color2);
	let Y1 = Math.max(getLuminance(color1), 0);
	let Y2 = Math.max(getLuminance(color2), 0);
	if (Y2 > Y1) [Y1, Y2] = [Y2, Y1];
	let denom = Y1 + Y2;
	return denom === 0 ? 0 : (Y1 - Y2) / denom;
}
const max = 5e4;
function contrastWeber(color1, color2) {
	color1 = getColor(color1);
	color2 = getColor(color2);
	let Y1 = Math.max(getLuminance(color1), 0);
	let Y2 = Math.max(getLuminance(color2), 0);
	if (Y2 > Y1) [Y1, Y2] = [Y2, Y1];
	return Y2 === 0 ? max : (Y1 - Y2) / Y2;
}
function contrastLstar(color1, color2) {
	color1 = getColor(color1);
	color2 = getColor(color2);
	let L1 = get(color1, [lab, "l"]);
	let L2 = get(color2, [lab, "l"]);
	return Math.abs(L1 - L2);
}
const ε$3 = 216 / 24389;
const ε3 = 24 / 116;
const κ$2 = 24389 / 27;
let white$1 = WHITES.D65;
var lab_d65 = new ColorSpace({
	id: "lab-d65",
	name: "Lab D65",
	coords: {
		l: {
			refRange: [0, 100],
			name: "Lightness"
		},
		a: { refRange: [-125, 125] },
		b: { refRange: [-125, 125] }
	},
	white: white$1,
	base: xyz_d65,
	fromBase(XYZ) {
		let f = XYZ.map((value, i) => value / white$1[i]).map((value) => value > ε$3 ? Math.cbrt(value) : (κ$2 * value + 16) / 116);
		return [
			116 * f[1] - 16,
			500 * (f[0] - f[1]),
			200 * (f[1] - f[2])
		];
	},
	toBase(Lab) {
		let f = [];
		f[1] = (Lab[0] + 16) / 116;
		f[0] = Lab[1] / 500 + f[1];
		f[2] = f[1] - Lab[2] / 200;
		return [
			f[0] > ε3 ? Math.pow(f[0], 3) : (116 * f[0] - 16) / κ$2,
			Lab[0] > 8 ? Math.pow((Lab[0] + 16) / 116, 3) : Lab[0] / κ$2,
			f[2] > ε3 ? Math.pow(f[2], 3) : (116 * f[2] - 16) / κ$2
		].map((value, i) => value * white$1[i]);
	},
	formats: { "lab-d65": { coords: [
		"<number> | <percentage>",
		"<number> | <percentage>[-1,1]",
		"<number> | <percentage>[-1,1]"
	] } }
});
const phi = Math.pow(5, .5) * .5 + .5;
function contrastDeltaPhi(color1, color2) {
	color1 = getColor(color1);
	color2 = getColor(color2);
	let Lstr1 = get(color1, [lab_d65, "l"]);
	let Lstr2 = get(color2, [lab_d65, "l"]);
	let deltaPhiStar = Math.abs(Math.pow(Lstr1, phi) - Math.pow(Lstr2, phi));
	let contrast = Math.pow(deltaPhiStar, 1 / phi) * Math.SQRT2 - 40;
	return contrast < 7.5 ? 0 : contrast;
}
var contrastMethods = /*#__PURE__*/ Object.freeze({
	__proto__: null,
	contrastAPCA,
	contrastDeltaPhi,
	contrastLstar,
	contrastMichelson,
	contrastWCAG21,
	contrastWeber
});
function contrast$1(background, foreground, o = {}) {
	if (isString(o)) o = { algorithm: o };
	let { algorithm, ...rest } = o;
	if (!algorithm) {
		let algorithms = Object.keys(contrastMethods).map((a) => a.replace(/^contrast/, "")).join(", ");
		throw new TypeError(`contrast() function needs a contrast algorithm. Please specify one of: ${algorithms}`);
	}
	background = getColor(background);
	foreground = getColor(foreground);
	for (let a in contrastMethods) if ("contrast" + algorithm.toLowerCase() === a.toLowerCase()) return contrastMethods[a](background, foreground, rest);
	throw new TypeError(`Unknown contrast algorithm: ${algorithm}`);
}
function uv(color) {
	let [X, Y, Z] = getAll(color, xyz_d65);
	let denom = X + 15 * Y + 3 * Z;
	return [4 * X / denom, 9 * Y / denom];
}
function xy(color) {
	let [X, Y, Z] = getAll(color, xyz_d65);
	let sum = X + Y + Z;
	return [X / sum, Y / sum];
}
function register$1(Color) {
	Object.defineProperty(Color.prototype, "uv", { get() {
		return uv(this);
	} });
	Object.defineProperty(Color.prototype, "xy", { get() {
		return xy(this);
	} });
}
var chromaticity = /*#__PURE__*/ Object.freeze({
	__proto__: null,
	register: register$1,
	uv,
	xy
});
function deltaE(c1, c2, o = {}) {
	if (isString(o)) o = { method: o };
	let { method = defaults.deltaE, ...rest } = o;
	for (let m in deltaEMethods) if ("deltae" + method.toLowerCase() === m.toLowerCase()) return deltaEMethods[m](c1, c2, rest);
	throw new TypeError(`Unknown deltaE method: ${method}`);
}
function lighten(color, amount = .25) {
	return set(color, [ColorSpace.get("oklch", "lch"), "l"], (l) => l * (1 + amount));
}
function darken(color, amount = .25) {
	return set(color, [ColorSpace.get("oklch", "lch"), "l"], (l) => l * (1 - amount));
}
var variations = /*#__PURE__*/ Object.freeze({
	__proto__: null,
	darken,
	lighten
});
/**
* Functions related to color interpolation
*/
/**
* Return an intermediate color between two colors
* Signatures: mix(c1, c2, p, options)
*             mix(c1, c2, options)
*             mix(color)
* @param {Color | string} c1 The first color
* @param {Color | string} [c2] The second color
* @param {number} [p=.5] A 0-1 percentage where 0 is c1 and 1 is c2
* @param {Object} [o={}]
* @return {Color}
*/
function mix(c1, c2, p = .5, o = {}) {
	[c1, c2] = [getColor(c1), getColor(c2)];
	if (type(p) === "object") [p, o] = [.5, p];
	return range(c1, c2, o)(p);
}
/**
*
* @param {Color | string | Function} c1 The first color or a range
* @param {Color | string} [c2] The second color if c1 is not a range
* @param {Object} [options={}]
* @return {Color[]}
*/
function steps(c1, c2, options = {}) {
	let colorRange;
	if (isRange(c1)) {
		[colorRange, options] = [c1, c2];
		[c1, c2] = colorRange.rangeArgs.colors;
	}
	let { maxDeltaE, deltaEMethod, steps = 2, maxSteps = 1e3, ...rangeOptions } = options;
	if (!colorRange) {
		[c1, c2] = [getColor(c1), getColor(c2)];
		colorRange = range(c1, c2, rangeOptions);
	}
	let totalDelta = deltaE(c1, c2);
	let actualSteps = maxDeltaE > 0 ? Math.max(steps, Math.ceil(totalDelta / maxDeltaE) + 1) : steps;
	let ret = [];
	if (maxSteps !== void 0) actualSteps = Math.min(actualSteps, maxSteps);
	if (actualSteps === 1) ret = [{
		p: .5,
		color: colorRange(.5)
	}];
	else {
		let step = 1 / (actualSteps - 1);
		ret = Array.from({ length: actualSteps }, (_, i) => {
			let p = i * step;
			return {
				p,
				color: colorRange(p)
			};
		});
	}
	if (maxDeltaE > 0) {
		let maxDelta = ret.reduce((acc, cur, i) => {
			if (i === 0) return 0;
			let ΔΕ = deltaE(cur.color, ret[i - 1].color, deltaEMethod);
			return Math.max(acc, ΔΕ);
		}, 0);
		while (maxDelta > maxDeltaE) {
			maxDelta = 0;
			for (let i = 1; i < ret.length && ret.length < maxSteps; i++) {
				let prev = ret[i - 1];
				let cur = ret[i];
				let p = (cur.p + prev.p) / 2;
				let color = colorRange(p);
				maxDelta = Math.max(maxDelta, deltaE(color, prev.color), deltaE(color, cur.color));
				ret.splice(i, 0, {
					p,
					color: colorRange(p)
				});
				i++;
			}
		}
	}
	ret = ret.map((a) => a.color);
	return ret;
}
/**
* Interpolate to color2 and return a function that takes a 0-1 percentage
* @param {Color | string | Function} color1 The first color or an existing range
* @param {Color | string} [color2] If color1 is a color, this is the second color
* @param {Object} [options={}]
* @returns {Function} A function that takes a 0-1 percentage and returns a color
*/
function range(color1, color2, options = {}) {
	if (isRange(color1)) {
		let [r, options] = [color1, color2];
		return range(...r.rangeArgs.colors, {
			...r.rangeArgs.options,
			...options
		});
	}
	let { space, outputSpace, progression, premultiplied } = options;
	color1 = getColor(color1);
	color2 = getColor(color2);
	color1 = clone(color1);
	color2 = clone(color2);
	let rangeArgs = {
		colors: [color1, color2],
		options
	};
	if (space) space = ColorSpace.get(space);
	else space = ColorSpace.registry[defaults.interpolationSpace] || color1.space;
	outputSpace = outputSpace ? ColorSpace.get(outputSpace) : space;
	color1 = to(color1, space);
	color2 = to(color2, space);
	color1 = toGamut(color1);
	color2 = toGamut(color2);
	if (space.coords.h && space.coords.h.type === "angle") {
		let arc = options.hue = options.hue || "shorter";
		let hue = [space, "h"];
		let [θ1, θ2] = [get(color1, hue), get(color2, hue)];
		if (isNaN(θ1) && !isNaN(θ2)) θ1 = θ2;
		else if (isNaN(θ2) && !isNaN(θ1)) θ2 = θ1;
		[θ1, θ2] = adjust(arc, [θ1, θ2]);
		set(color1, hue, θ1);
		set(color2, hue, θ2);
	}
	if (premultiplied) {
		color1.coords = color1.coords.map((c) => c * color1.alpha);
		color2.coords = color2.coords.map((c) => c * color2.alpha);
	}
	return Object.assign((p) => {
		p = progression ? progression(p) : p;
		let coords = color1.coords.map((start, i) => {
			let end = color2.coords[i];
			return interpolate(start, end, p);
		});
		let alpha = interpolate(color1.alpha, color2.alpha, p);
		let ret = {
			space,
			coords,
			alpha
		};
		if (premultiplied) ret.coords = ret.coords.map((c) => c / alpha);
		if (outputSpace !== space) ret = to(ret, outputSpace);
		return ret;
	}, { rangeArgs });
}
function isRange(val) {
	return type(val) === "function" && !!val.rangeArgs;
}
defaults.interpolationSpace = "lab";
function register(Color) {
	Color.defineFunction("mix", mix, { returns: "color" });
	Color.defineFunction("range", range, { returns: "function<color>" });
	Color.defineFunction("steps", steps, { returns: "array<color>" });
}
var interpolation = /*#__PURE__*/ Object.freeze({
	__proto__: null,
	isRange,
	mix,
	range,
	register,
	steps
});
var HSL = new ColorSpace({
	id: "hsl",
	name: "HSL",
	coords: {
		h: {
			refRange: [0, 360],
			type: "angle",
			name: "Hue"
		},
		s: {
			range: [0, 100],
			name: "Saturation"
		},
		l: {
			range: [0, 100],
			name: "Lightness"
		}
	},
	base: sRGB,
	fromBase: (rgb) => {
		let max = Math.max(...rgb);
		let min = Math.min(...rgb);
		let [r, g, b] = rgb;
		let [h, s, l] = [
			NaN,
			0,
			(min + max) / 2
		];
		let d = max - min;
		if (d !== 0) {
			s = l === 0 || l === 1 ? 0 : (max - l) / Math.min(l, 1 - l);
			switch (max) {
				case r:
					h = (g - b) / d + (g < b ? 6 : 0);
					break;
				case g:
					h = (b - r) / d + 2;
					break;
				case b: h = (r - g) / d + 4;
			}
			h = h * 60;
		}
		if (s < 0) {
			h += 180;
			s = Math.abs(s);
		}
		if (h >= 360) h -= 360;
		return [
			h,
			s * 100,
			l * 100
		];
	},
	toBase: (hsl) => {
		let [h, s, l] = hsl;
		h = h % 360;
		if (h < 0) h += 360;
		s /= 100;
		l /= 100;
		function f(n) {
			let k = (n + h / 30) % 12;
			let a = s * Math.min(l, 1 - l);
			return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
		}
		return [
			f(0),
			f(8),
			f(4)
		];
	},
	formats: {
		"hsl": { coords: [
			"<number> | <angle>",
			"<percentage>",
			"<percentage>"
		] },
		"hsla": {
			coords: [
				"<number> | <angle>",
				"<percentage>",
				"<percentage>"
			],
			commas: true,
			lastAlpha: true
		}
	}
});
var HSV = new ColorSpace({
	id: "hsv",
	name: "HSV",
	coords: {
		h: {
			refRange: [0, 360],
			type: "angle",
			name: "Hue"
		},
		s: {
			range: [0, 100],
			name: "Saturation"
		},
		v: {
			range: [0, 100],
			name: "Value"
		}
	},
	base: HSL,
	fromBase(hsl) {
		let [h, s, l] = hsl;
		s /= 100;
		l /= 100;
		let v = l + s * Math.min(l, 1 - l);
		return [
			h,
			v === 0 ? 0 : 200 * (1 - l / v),
			100 * v
		];
	},
	toBase(hsv) {
		let [h, s, v] = hsv;
		s /= 100;
		v /= 100;
		let l = v * (1 - s / 2);
		return [
			h,
			l === 0 || l === 1 ? 0 : (v - l) / Math.min(l, 1 - l) * 100,
			l * 100
		];
	},
	formats: { color: {
		id: "--hsv",
		coords: [
			"<number> | <angle>",
			"<percentage> | <number>",
			"<percentage> | <number>"
		]
	} }
});
var hwb = new ColorSpace({
	id: "hwb",
	name: "HWB",
	coords: {
		h: {
			refRange: [0, 360],
			type: "angle",
			name: "Hue"
		},
		w: {
			range: [0, 100],
			name: "Whiteness"
		},
		b: {
			range: [0, 100],
			name: "Blackness"
		}
	},
	base: HSV,
	fromBase(hsv) {
		let [h, s, v] = hsv;
		return [
			h,
			v * (100 - s) / 100,
			100 - v
		];
	},
	toBase(hwb) {
		let [h, w, b] = hwb;
		w /= 100;
		b /= 100;
		let sum = w + b;
		if (sum >= 1) return [
			h,
			0,
			w / sum * 100
		];
		let v = 1 - b;
		return [
			h,
			(v === 0 ? 0 : 1 - w / v) * 100,
			v * 100
		];
	},
	formats: { "hwb": { coords: [
		"<number> | <angle>",
		"<percentage> | <number>",
		"<percentage> | <number>"
	] } }
});
var A98Linear = new RGBColorSpace({
	id: "a98rgb-linear",
	cssId: "--a98-rgb-linear",
	name: "Linear Adobe® 98 RGB compatible",
	white: "D65",
	toXYZ_M: [
		[
			.5766690429101305,
			.1855582379065463,
			.1882286462349947
		],
		[
			.29734497525053605,
			.6273635662554661,
			.07529145849399788
		],
		[
			.02703136138641234,
			.07068885253582723,
			.9913375368376388
		]
	],
	fromXYZ_M: [
		[
			2.0415879038107465,
			-.5650069742788596,
			-.34473135077832956
		],
		[
			-.9692436362808795,
			1.8759675015077202,
			.04155505740717557
		],
		[
			.013444280632031142,
			-.11836239223101838,
			1.0151749943912054
		]
	]
});
var a98rgb = new RGBColorSpace({
	id: "a98rgb",
	cssId: "a98-rgb",
	name: "Adobe® 98 RGB compatible",
	base: A98Linear,
	toBase: (RGB) => RGB.map((val) => Math.pow(Math.abs(val), 563 / 256) * Math.sign(val)),
	fromBase: (RGB) => RGB.map((val) => Math.pow(Math.abs(val), 256 / 563) * Math.sign(val))
});
var ProPhotoLinear = new RGBColorSpace({
	id: "prophoto-linear",
	cssId: "--prophoto-rgb-linear",
	name: "Linear ProPhoto",
	white: "D50",
	base: XYZ_D50,
	toXYZ_M: [
		[
			.7977666449006423,
			.13518129740053308,
			.0313477341283922
		],
		[
			.2880748288194013,
			.711835234241873,
			8993693872564e-17
		],
		[
			0,
			0,
			.8251046025104602
		]
	],
	fromXYZ_M: [
		[
			1.3457868816471583,
			-.25557208737979464,
			-.05110186497554526
		],
		[
			-.5446307051249019,
			1.5082477428451468,
			.02052744743642139
		],
		[
			0,
			0,
			1.2119675456389452
		]
	]
});
const Et = 1 / 512;
const Et2 = 16 / 512;
var prophoto = new RGBColorSpace({
	id: "prophoto",
	cssId: "prophoto-rgb",
	name: "ProPhoto",
	base: ProPhotoLinear,
	toBase(RGB) {
		return RGB.map((v) => v < Et2 ? v / 16 : v ** 1.8);
	},
	fromBase(RGB) {
		return RGB.map((v) => v >= Et ? v ** (1 / 1.8) : 16 * v);
	}
});
var oklch = new ColorSpace({
	id: "oklch",
	name: "Oklch",
	coords: {
		l: {
			refRange: [0, 1],
			name: "Lightness"
		},
		c: {
			refRange: [0, .4],
			name: "Chroma"
		},
		h: {
			refRange: [0, 360],
			type: "angle",
			name: "Hue"
		}
	},
	white: "D65",
	base: OKLab,
	fromBase(oklab) {
		let [L, a, b] = oklab;
		let h;
		const ε = 2e-4;
		if (Math.abs(a) < ε && Math.abs(b) < ε) h = NaN;
		else h = Math.atan2(b, a) * 180 / Math.PI;
		return [
			L,
			Math.sqrt(a ** 2 + b ** 2),
			constrain(h)
		];
	},
	toBase(oklch) {
		let [L, C, h] = oklch;
		let a, b;
		if (isNaN(h)) {
			a = 0;
			b = 0;
		} else {
			a = C * Math.cos(h * Math.PI / 180);
			b = C * Math.sin(h * Math.PI / 180);
		}
		return [
			L,
			a,
			b
		];
	},
	formats: { "oklch": { coords: [
		"<percentage> | <number>",
		"<number> | <percentage>[0,1]",
		"<number> | <angle>"
	] } }
});
let white = WHITES.D65;
const ε$2 = 216 / 24389;
const κ$1 = 24389 / 27;
const [U_PRIME_WHITE, V_PRIME_WHITE] = uv({
	space: xyz_d65,
	coords: white
});
var Luv = new ColorSpace({
	id: "luv",
	name: "Luv",
	coords: {
		l: {
			refRange: [0, 100],
			name: "Lightness"
		},
		u: { refRange: [-215, 215] },
		v: { refRange: [-215, 215] }
	},
	white,
	base: xyz_d65,
	fromBase(XYZ) {
		let xyz = [
			skipNone(XYZ[0]),
			skipNone(XYZ[1]),
			skipNone(XYZ[2])
		];
		let y = xyz[1];
		let [up, vp] = uv({
			space: xyz_d65,
			coords: xyz
		});
		if (!Number.isFinite(up) || !Number.isFinite(vp)) return [
			0,
			0,
			0
		];
		let L = y <= ε$2 ? κ$1 * y : 116 * Math.cbrt(y) - 16;
		return [
			L,
			13 * L * (up - U_PRIME_WHITE),
			13 * L * (vp - V_PRIME_WHITE)
		];
	},
	toBase(Luv) {
		let [L, u, v] = Luv;
		if (L === 0 || isNone(L)) return [
			0,
			0,
			0
		];
		u = skipNone(u);
		v = skipNone(v);
		let up = u / (13 * L) + U_PRIME_WHITE;
		let vp = v / (13 * L) + V_PRIME_WHITE;
		let y = L <= 8 ? L / κ$1 : Math.pow((L + 16) / 116, 3);
		return [
			y * (9 * up / (4 * vp)),
			y,
			y * ((12 - 3 * up - 20 * vp) / (4 * vp))
		];
	},
	formats: { color: {
		id: "--luv",
		coords: [
			"<number> | <percentage>",
			"<number> | <percentage>[-1,1]",
			"<number> | <percentage>[-1,1]"
		]
	} }
});
var LCHuv = new ColorSpace({
	id: "lchuv",
	name: "LChuv",
	coords: {
		l: {
			refRange: [0, 100],
			name: "Lightness"
		},
		c: {
			refRange: [0, 220],
			name: "Chroma"
		},
		h: {
			refRange: [0, 360],
			type: "angle",
			name: "Hue"
		}
	},
	base: Luv,
	fromBase(Luv) {
		let [L, u, v] = Luv;
		let hue;
		const ε = .02;
		if (Math.abs(u) < ε && Math.abs(v) < ε) hue = NaN;
		else hue = Math.atan2(v, u) * 180 / Math.PI;
		return [
			L,
			Math.sqrt(u ** 2 + v ** 2),
			constrain(hue)
		];
	},
	toBase(LCH) {
		let [Lightness, Chroma, Hue] = LCH;
		if (Chroma < 0) Chroma = 0;
		if (isNaN(Hue)) Hue = 0;
		return [
			Lightness,
			Chroma * Math.cos(Hue * Math.PI / 180),
			Chroma * Math.sin(Hue * Math.PI / 180)
		];
	},
	formats: { color: {
		id: "--lchuv",
		coords: [
			"<number> | <percentage>",
			"<number> | <percentage>",
			"<number> | <angle>"
		]
	} }
});
const ε$1 = 216 / 24389;
const κ = 24389 / 27;
const m_r0 = fromXYZ_M$3[0][0];
const m_r1 = fromXYZ_M$3[0][1];
const m_r2 = fromXYZ_M$3[0][2];
const m_g0 = fromXYZ_M$3[1][0];
const m_g1 = fromXYZ_M$3[1][1];
const m_g2 = fromXYZ_M$3[1][2];
const m_b0 = fromXYZ_M$3[2][0];
const m_b1 = fromXYZ_M$3[2][1];
const m_b2 = fromXYZ_M$3[2][2];
function distanceFromOriginAngle(slope, intercept, angle) {
	const d = intercept / (Math.sin(angle) - slope * Math.cos(angle));
	return d < 0 ? Infinity : d;
}
function calculateBoundingLines(l) {
	const sub1 = Math.pow(l + 16, 3) / 1560896;
	const sub2 = sub1 > ε$1 ? sub1 : l / κ;
	const s1r = sub2 * (284517 * m_r0 - 94839 * m_r2);
	const s2r = sub2 * (838422 * m_r2 + 769860 * m_r1 + 731718 * m_r0);
	const s3r = sub2 * (632260 * m_r2 - 126452 * m_r1);
	const s1g = sub2 * (284517 * m_g0 - 94839 * m_g2);
	const s2g = sub2 * (838422 * m_g2 + 769860 * m_g1 + 731718 * m_g0);
	const s3g = sub2 * (632260 * m_g2 - 126452 * m_g1);
	const s1b = sub2 * (284517 * m_b0 - 94839 * m_b2);
	const s2b = sub2 * (838422 * m_b2 + 769860 * m_b1 + 731718 * m_b0);
	const s3b = sub2 * (632260 * m_b2 - 126452 * m_b1);
	return {
		r0s: s1r / s3r,
		r0i: s2r * l / s3r,
		r1s: s1r / (s3r + 126452),
		r1i: (s2r - 769860) * l / (s3r + 126452),
		g0s: s1g / s3g,
		g0i: s2g * l / s3g,
		g1s: s1g / (s3g + 126452),
		g1i: (s2g - 769860) * l / (s3g + 126452),
		b0s: s1b / s3b,
		b0i: s2b * l / s3b,
		b1s: s1b / (s3b + 126452),
		b1i: (s2b - 769860) * l / (s3b + 126452)
	};
}
function calcMaxChromaHsluv(lines, h) {
	const hueRad = h / 360 * Math.PI * 2;
	const r0 = distanceFromOriginAngle(lines.r0s, lines.r0i, hueRad);
	const r1 = distanceFromOriginAngle(lines.r1s, lines.r1i, hueRad);
	const g0 = distanceFromOriginAngle(lines.g0s, lines.g0i, hueRad);
	const g1 = distanceFromOriginAngle(lines.g1s, lines.g1i, hueRad);
	const b0 = distanceFromOriginAngle(lines.b0s, lines.b0i, hueRad);
	const b1 = distanceFromOriginAngle(lines.b1s, lines.b1i, hueRad);
	return Math.min(r0, r1, g0, g1, b0, b1);
}
var hsluv = new ColorSpace({
	id: "hsluv",
	name: "HSLuv",
	coords: {
		h: {
			refRange: [0, 360],
			type: "angle",
			name: "Hue"
		},
		s: {
			range: [0, 100],
			name: "Saturation"
		},
		l: {
			range: [0, 100],
			name: "Lightness"
		}
	},
	base: LCHuv,
	gamutSpace: sRGB,
	fromBase(lch) {
		let [l, c, h] = [
			skipNone(lch[0]),
			skipNone(lch[1]),
			skipNone(lch[2])
		];
		let s;
		if (l > 99.9999999) {
			s = 0;
			l = 100;
		} else if (l < 1e-8) {
			s = 0;
			l = 0;
		} else s = c / calcMaxChromaHsluv(calculateBoundingLines(l), h) * 100;
		return [
			h,
			s,
			l
		];
	},
	toBase(hsl) {
		let [h, s, l] = [
			skipNone(hsl[0]),
			skipNone(hsl[1]),
			skipNone(hsl[2])
		];
		let c;
		if (l > 99.9999999) {
			l = 100;
			c = 0;
		} else if (l < 1e-8) {
			l = 0;
			c = 0;
		} else c = calcMaxChromaHsluv(calculateBoundingLines(l), h) / 100 * s;
		return [
			l,
			c,
			h
		];
	},
	formats: { color: {
		id: "--hsluv",
		coords: [
			"<number> | <angle>",
			"<percentage> | <number>",
			"<percentage> | <number>"
		]
	} }
});
fromXYZ_M$3[0][0];
fromXYZ_M$3[0][1];
fromXYZ_M$3[0][2];
fromXYZ_M$3[1][0];
fromXYZ_M$3[1][1];
fromXYZ_M$3[1][2];
fromXYZ_M$3[2][0];
fromXYZ_M$3[2][1];
fromXYZ_M$3[2][2];
function distanceFromOrigin(slope, intercept) {
	return Math.abs(intercept) / Math.sqrt(Math.pow(slope, 2) + 1);
}
function calcMaxChromaHpluv(lines) {
	let r0 = distanceFromOrigin(lines.r0s, lines.r0i);
	let r1 = distanceFromOrigin(lines.r1s, lines.r1i);
	let g0 = distanceFromOrigin(lines.g0s, lines.g0i);
	let g1 = distanceFromOrigin(lines.g1s, lines.g1i);
	let b0 = distanceFromOrigin(lines.b0s, lines.b0i);
	let b1 = distanceFromOrigin(lines.b1s, lines.b1i);
	return Math.min(r0, r1, g0, g1, b0, b1);
}
var hpluv = new ColorSpace({
	id: "hpluv",
	name: "HPLuv",
	coords: {
		h: {
			refRange: [0, 360],
			type: "angle",
			name: "Hue"
		},
		s: {
			range: [0, 100],
			name: "Saturation"
		},
		l: {
			range: [0, 100],
			name: "Lightness"
		}
	},
	base: LCHuv,
	gamutSpace: "self",
	fromBase(lch) {
		let [l, c, h] = [
			skipNone(lch[0]),
			skipNone(lch[1]),
			skipNone(lch[2])
		];
		let s;
		if (l > 99.9999999) {
			s = 0;
			l = 100;
		} else if (l < 1e-8) {
			s = 0;
			l = 0;
		} else s = c / calcMaxChromaHpluv(calculateBoundingLines(l)) * 100;
		return [
			h,
			s,
			l
		];
	},
	toBase(hsl) {
		let [h, s, l] = [
			skipNone(hsl[0]),
			skipNone(hsl[1]),
			skipNone(hsl[2])
		];
		let c;
		if (l > 99.9999999) {
			l = 100;
			c = 0;
		} else if (l < 1e-8) {
			l = 0;
			c = 0;
		} else c = calcMaxChromaHpluv(calculateBoundingLines(l)) / 100 * s;
		return [
			l,
			c,
			h
		];
	},
	formats: { color: {
		id: "--hpluv",
		coords: [
			"<number> | <angle>",
			"<percentage> | <number>",
			"<percentage> | <number>"
		]
	} }
});
const Yw = 203;
const n = 2610 / 2 ** 14;
const ninv = 2 ** 14 / 2610;
const m = 2523 / 32;
const minv = 32 / 2523;
const c1 = 3424 / 4096;
const c2 = 2413 / 128;
const c3 = 2392 / 128;
var rec2100Pq = new RGBColorSpace({
	id: "rec2100pq",
	cssId: "rec2100-pq",
	name: "REC.2100-PQ",
	base: REC2020Linear,
	toBase(RGB) {
		return RGB.map(function(val) {
			return (Math.max(val ** minv - c1, 0) / (c2 - c3 * val ** minv)) ** ninv * 1e4 / Yw;
		});
	},
	fromBase(RGB) {
		return RGB.map(function(val) {
			let x = Math.max(val * Yw / 1e4, 0);
			return ((c1 + c2 * x ** n) / (1 + c3 * x ** n)) ** m;
		});
	}
});
const a = .17883277;
const b = .28466892;
const c = .55991073;
const scale = 3.7743;
var rec2100Hlg = new RGBColorSpace({
	id: "rec2100hlg",
	cssId: "rec2100-hlg",
	name: "REC.2100-HLG",
	referred: "scene",
	base: REC2020Linear,
	toBase(RGB) {
		return RGB.map(function(val) {
			if (val <= .5) return val ** 2 / 3 * scale;
			return (Math.exp((val - c) / a) + b) / 12 * scale;
		});
	},
	fromBase(RGB) {
		return RGB.map(function(val) {
			val /= scale;
			if (val <= 1 / 12) return Math.sqrt(3 * val);
			return a * Math.log(12 * val - b) + c;
		});
	}
});
const CATs = {};
hooks.add("chromatic-adaptation-start", (env) => {
	if (env.options.method) env.M = adapt(env.W1, env.W2, env.options.method);
});
hooks.add("chromatic-adaptation-end", (env) => {
	if (!env.M) env.M = adapt(env.W1, env.W2, env.options.method);
});
function defineCAT({ id, toCone_M, fromCone_M }) {
	CATs[id] = arguments[0];
}
function adapt(W1, W2, id = "Bradford") {
	let method = CATs[id];
	let [ρs, γs, βs] = multiplyMatrices(method.toCone_M, W1);
	let [ρd, γd, βd] = multiplyMatrices(method.toCone_M, W2);
	let scaled_cone_M = multiplyMatrices([
		[
			ρd / ρs,
			0,
			0
		],
		[
			0,
			γd / γs,
			0
		],
		[
			0,
			0,
			βd / βs
		]
	], method.toCone_M);
	return multiplyMatrices(method.fromCone_M, scaled_cone_M);
}
defineCAT({
	id: "von Kries",
	toCone_M: [
		[
			.40024,
			.7076,
			-.08081
		],
		[
			-.2263,
			1.16532,
			.0457
		],
		[
			0,
			0,
			.91822
		]
	],
	fromCone_M: [
		[
			1.8599363874558397,
			-1.1293816185800916,
			.21989740959619328
		],
		[
			.3611914362417676,
			.6388124632850422,
			-6370596838649899e-21
		],
		[
			0,
			0,
			1.0890636230968613
		]
	]
});
defineCAT({
	id: "Bradford",
	toCone_M: [
		[
			.8951,
			.2664,
			-.1614
		],
		[
			-.7502,
			1.7135,
			.0367
		],
		[
			.0389,
			-.0685,
			1.0296
		]
	],
	fromCone_M: [
		[
			.9869929054667121,
			-.14705425642099013,
			.15996265166373122
		],
		[
			.4323052697233945,
			.5183602715367774,
			.049291228212855594
		],
		[
			-.00852866457517732,
			.04004282165408486,
			.96848669578755
		]
	]
});
defineCAT({
	id: "CAT02",
	toCone_M: [
		[
			.7328,
			.4296,
			-.1624
		],
		[
			-.7036,
			1.6975,
			.0061
		],
		[
			.003,
			.0136,
			.9834
		]
	],
	fromCone_M: [
		[
			1.0961238208355142,
			-.27886900021828726,
			.18274517938277307
		],
		[
			.4543690419753592,
			.4735331543074117,
			.07209780371722911
		],
		[
			-.009627608738429355,
			-.00569803121611342,
			1.0153256399545427
		]
	]
});
defineCAT({
	id: "CAT16",
	toCone_M: [
		[
			.401288,
			.650173,
			-.051461
		],
		[
			-.250268,
			1.204414,
			.045854
		],
		[
			-.002079,
			.048952,
			.953127
		]
	],
	fromCone_M: [
		[
			1.862067855087233,
			-1.0112546305316845,
			.14918677544445172
		],
		[
			.3875265432361372,
			.6214474419314753,
			-.008973985167612521
		],
		[
			-.01584149884933386,
			-.03412293802851557,
			1.0499644368778496
		]
	]
});
Object.assign(WHITES, {
	A: [
		1.0985,
		1,
		.35585
	],
	C: [
		.98074,
		1,
		1.18232
	],
	D55: [
		.95682,
		1,
		.92149
	],
	D75: [
		.94972,
		1,
		1.22638
	],
	E: [
		1,
		1,
		1
	],
	F2: [
		.99186,
		1,
		.67393
	],
	F7: [
		.95041,
		1,
		1.08747
	],
	F11: [
		1.00962,
		1,
		.6435
	]
});
WHITES.ACES = [
	.32168 / .33767,
	1,
	.34065 / .33767
];
var ACEScg = new RGBColorSpace({
	id: "acescg",
	cssId: "--acescg",
	name: "ACEScg",
	coords: {
		r: {
			range: [0, 65504],
			name: "Red"
		},
		g: {
			range: [0, 65504],
			name: "Green"
		},
		b: {
			range: [0, 65504],
			name: "Blue"
		}
	},
	referred: "scene",
	white: WHITES.ACES,
	toXYZ_M: [
		[
			.6624541811085053,
			.13400420645643313,
			.1561876870049078
		],
		[
			.27222871678091454,
			.6740817658111484,
			.05368951740793705
		],
		[
			-.005574649490394108,
			.004060733528982826,
			1.0103391003129971
		]
	],
	fromXYZ_M: [
		[
			1.6410233796943257,
			-.32480329418479,
			-.23642469523761225
		],
		[
			-.6636628587229829,
			1.6153315916573379,
			.016756347685530137
		],
		[
			.011721894328375376,
			-.008284441996237409,
			.9883948585390215
		]
	]
});
const ε = 2 ** -16;
const ACES_min_nonzero = -.35828683;
const ACES_cc_max = (Math.log2(65504) + 9.72) / 17.52;
var acescc = new RGBColorSpace({
	id: "acescc",
	cssId: "--acescc",
	name: "ACEScc",
	coords: {
		r: {
			range: [ACES_min_nonzero, ACES_cc_max],
			name: "Red"
		},
		g: {
			range: [ACES_min_nonzero, ACES_cc_max],
			name: "Green"
		},
		b: {
			range: [ACES_min_nonzero, ACES_cc_max],
			name: "Blue"
		}
	},
	referred: "scene",
	base: ACEScg,
	toBase(RGB) {
		const low = (9.72 - 15) / 17.52;
		return RGB.map(function(val) {
			if (val <= low) return (2 ** (val * 17.52 - 9.72) - ε) * 2;
			else if (val < ACES_cc_max) return 2 ** (val * 17.52 - 9.72);
			else return 65504;
		});
	},
	fromBase(RGB) {
		return RGB.map(function(val) {
			if (val <= 0) return (Math.log2(ε) + 9.72) / 17.52;
			else if (val < ε) return (Math.log2(ε + val * .5) + 9.72) / 17.52;
			else return (Math.log2(val) + 9.72) / 17.52;
		});
	}
});
var spaces = /*#__PURE__*/ Object.freeze({
	__proto__: null,
	A98RGB: a98rgb,
	A98RGB_Linear: A98Linear,
	ACEScc: acescc,
	ACEScg,
	CAM16_JMh: cam16,
	HCT: hct,
	HPLuv: hpluv,
	HSL,
	HSLuv: hsluv,
	HSV,
	HWB: hwb,
	ICTCP: ictcp,
	JzCzHz: jzczhz,
	Jzazbz,
	LCH: lch,
	LCHuv,
	Lab: lab,
	Lab_D65: lab_d65,
	Luv,
	OKLCH: oklch,
	OKLab,
	P3,
	P3_Linear: P3Linear,
	ProPhoto: prophoto,
	ProPhoto_Linear: ProPhotoLinear,
	REC_2020: REC2020,
	REC_2020_Linear: REC2020Linear,
	REC_2100_HLG: rec2100Hlg,
	REC_2100_PQ: rec2100Pq,
	XYZ_ABS_D65: XYZ_Abs_D65,
	XYZ_D50,
	XYZ_D65: xyz_d65,
	sRGB,
	sRGB_Linear: sRGBLinear
});
/**
* Class that represents a color
*/
var Color = class Color {
	/**
	* Creates an instance of Color.
	* Signatures:
	* - `new Color(stringToParse)`
	* - `new Color(otherColor)`
	* - `new Color({space, coords, alpha})`
	* - `new Color(space, coords, alpha)`
	* - `new Color(spaceId, coords, alpha)`
	*/
	constructor(...args) {
		let color;
		if (args.length === 1) color = getColor(args[0]);
		let space, coords, alpha;
		if (color) {
			space = color.space || color.spaceId;
			coords = color.coords;
			alpha = color.alpha;
		} else [space, coords, alpha] = args;
		Object.defineProperty(this, "space", {
			value: ColorSpace.get(space),
			writable: false,
			enumerable: true,
			configurable: true
		});
		this.coords = coords ? coords.slice() : [
			0,
			0,
			0
		];
		this.alpha = alpha > 1 || alpha === void 0 ? 1 : alpha < 0 ? 0 : alpha;
		for (let i = 0; i < this.coords.length; i++) if (this.coords[i] === "NaN") this.coords[i] = NaN;
		for (let id in this.space.coords) Object.defineProperty(this, id, {
			get: () => this.get(id),
			set: (value) => this.set(id, value)
		});
	}
	get spaceId() {
		return this.space.id;
	}
	clone() {
		return new Color(this.space, this.coords, this.alpha);
	}
	toJSON() {
		return {
			spaceId: this.spaceId,
			coords: this.coords,
			alpha: this.alpha
		};
	}
	display(...args) {
		let ret = display(this, ...args);
		ret.color = new Color(ret.color);
		return ret;
	}
	/**
	* Get a color from the argument passed
	* Basically gets us the same result as new Color(color) but doesn't clone an existing color object
	*/
	static get(color, ...args) {
		if (color instanceof Color) return color;
		return new Color(color, ...args);
	}
	static defineFunction(name, code, o = code) {
		let { instance = true, returns } = o;
		let func = function(...args) {
			let ret = code(...args);
			if (returns === "color") ret = Color.get(ret);
			else if (returns === "function<color>") {
				let f = ret;
				ret = function(...args) {
					let ret = f(...args);
					return Color.get(ret);
				};
				Object.assign(ret, f);
			} else if (returns === "array<color>") ret = ret.map((c) => Color.get(c));
			return ret;
		};
		if (!(name in Color)) Color[name] = func;
		if (instance) Color.prototype[name] = function(...args) {
			return func(this, ...args);
		};
	}
	static defineFunctions(o) {
		for (let name in o) Color.defineFunction(name, o[name], o[name]);
	}
	static extend(exports) {
		if (exports.register) exports.register(Color);
		else for (let name in exports) Color.defineFunction(name, exports[name]);
	}
};
Color.defineFunctions({
	get,
	getAll,
	set,
	setAll,
	to,
	equals,
	inGamut,
	toGamut,
	distance,
	toString: serialize
});
Object.assign(Color, {
	util,
	hooks,
	WHITES,
	Space: ColorSpace,
	spaces: ColorSpace.registry,
	parse,
	defaults
});
for (let key of Object.keys(spaces)) ColorSpace.register(spaces[key]);
/**
* This plugin defines getters and setters for color[spaceId]
* e.g. color.lch on *any* color gives us the lch coords
*/
for (let id in ColorSpace.registry) addSpaceAccessors(id, ColorSpace.registry[id]);
hooks.add("colorspace-init-end", (space) => {
	addSpaceAccessors(space.id, space);
	space.aliases?.forEach((alias) => {
		addSpaceAccessors(alias, space);
	});
});
function addSpaceAccessors(id, space) {
	let propId = id.replace(/-/g, "_");
	Object.defineProperty(Color.prototype, propId, {
		get() {
			let ret = this.getAll(id);
			if (typeof Proxy === "undefined") return ret;
			return new Proxy(ret, {
				has: (obj, property) => {
					try {
						ColorSpace.resolveCoord([space, property]);
						return true;
					} catch (e) {}
					return Reflect.has(obj, property);
				},
				get: (obj, property, receiver) => {
					if (property && typeof property !== "symbol" && !(property in obj)) {
						let { index } = ColorSpace.resolveCoord([space, property]);
						if (index >= 0) return obj[index];
					}
					return Reflect.get(obj, property, receiver);
				},
				set: (obj, property, value, receiver) => {
					if (property && typeof property !== "symbol" && !(property in obj) || property >= 0) {
						let { index } = ColorSpace.resolveCoord([space, property]);
						if (index >= 0) {
							obj[index] = value;
							this.setAll(id, obj);
							return true;
						}
					}
					return Reflect.set(obj, property, value, receiver);
				}
			});
		},
		set(coords) {
			this.setAll(id, coords);
		},
		configurable: true,
		enumerable: true
	});
}
Color.extend(deltaEMethods);
Color.extend({ deltaE });
Object.assign(Color, { deltaEMethods });
Color.extend(variations);
Color.extend({ contrast: contrast$1 });
Color.extend(chromaticity);
Color.extend(luminance);
Color.extend(interpolation);
Color.extend(contrastMethods);
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
	const s = q ** 2 + c;
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
const DEFAULT_CONFIG = {
	lang: void 0,
	message: void 0,
	abortEarly: void 0,
	abortPipeEarly: void 0
};
/**
* Returns the global configuration.
*
* @param config The config to merge.
*
* @returns The configuration.
*/
/* @__NO_SIDE_EFFECTS__ */
function getGlobalConfig(config$1) {
	if (!config$1 && true) return DEFAULT_CONFIG;
	return {
		lang: config$1?.lang ?? void 0,
		message: config$1?.message,
		abortEarly: config$1?.abortEarly ?? void 0,
		abortPipeEarly: config$1?.abortPipeEarly ?? void 0
	};
}
/**
* Stringifies an unknown input to a literal or type string.
*
* @param input The unknown input.
*
* @returns A literal or type string.
*
* @internal
*/
/* @__NO_SIDE_EFFECTS__ */
function _stringify(input) {
	const type = typeof input;
	if (type === "string") return `"${input}"`;
	if (type === "number" || type === "bigint" || type === "boolean") return `${input}`;
	if (type === "object" || type === "function") return (input && Object.getPrototypeOf(input)?.constructor?.name) ?? "null";
	return type;
}
/**
* Adds an issue to the dataset.
*
* @param context The issue context.
* @param label The issue label.
* @param dataset The input dataset.
* @param config The configuration.
* @param other The optional props.
*
* @internal
*/
function _addIssue(context, label, dataset, config$1, other) {
	const input = other && "input" in other ? other.input : dataset.value;
	const expected = other?.expected ?? context.expects ?? null;
	const received = other?.received ?? /* @__PURE__ */ _stringify(input);
	const issue = {
		kind: context.kind,
		type: context.type,
		input,
		expected,
		received,
		message: `Invalid ${label}: ${expected ? `Expected ${expected} but r` : "R"}eceived ${received}`,
		requirement: context.requirement,
		path: other?.path,
		issues: other?.issues,
		lang: config$1.lang,
		abortEarly: config$1.abortEarly,
		abortPipeEarly: config$1.abortPipeEarly
	};
	const isSchema = context.kind === "schema";
	const message$1 = other?.message ?? context.message ?? (context.reference, issue.lang, void 0) ?? (isSchema ? (issue.lang, void 0) : null) ?? config$1.message ?? (issue.lang, void 0);
	if (message$1 !== void 0) issue.message = typeof message$1 === "function" ? message$1(issue) : message$1;
	if (isSchema) dataset.typed = false;
	if (dataset.issues) dataset.issues.push(issue);
	else dataset.issues = [issue];
}
const _standardCache = /* @__PURE__ */ new WeakMap();
/**
* Returns the Standard Schema properties.
*
* @param context The schema context.
*
* @returns The Standard Schema properties.
*/
/* @__NO_SIDE_EFFECTS__ */
function _getStandardProps(context) {
	let cached = _standardCache.get(context);
	if (!cached) {
		cached = {
			version: 1,
			vendor: "valibot",
			validate(value$1) {
				return context["~run"]({ value: value$1 }, /* @__PURE__ */ getGlobalConfig());
			}
		};
		_standardCache.set(context, cached);
	}
	return cached;
}
/**
* Disallows inherited object properties and prevents object prototype
* pollution by disallowing certain keys.
*
* @param object The object to check.
* @param key The key to check.
*
* @returns Whether the key is allowed.
*
* @internal
*/
/* @__NO_SIDE_EFFECTS__ */
function _isValidObjectKey(object$1, key) {
	return Object.prototype.hasOwnProperty.call(object$1, key) && key !== "__proto__" && key !== "prototype" && key !== "constructor";
}
/**
* Joins multiple `expects` values with the given separator.
*
* @param values The `expects` values.
* @param separator The separator.
*
* @returns The joined `expects` property.
*
* @internal
*/
/* @__NO_SIDE_EFFECTS__ */
function _joinExpects(values$1, separator) {
	const list = [...new Set(values$1)];
	if (list.length > 1) return `(${list.join(` ${separator} `)})`;
	return list[0] ?? "never";
}
/**
* Creates a raw transformation action.
*
* @param action The transformation action.
*
* @returns A raw transform action.
*/
/* @__NO_SIDE_EFFECTS__ */
function rawTransform(action) {
	return {
		kind: "transformation",
		type: "raw_transform",
		reference: rawTransform,
		async: false,
		"~run"(dataset, config$1) {
			const output = action({
				dataset,
				config: config$1,
				addIssue: (info) => _addIssue(this, info?.label ?? "input", dataset, config$1, info),
				NEVER: null
			});
			if (dataset.issues) dataset.typed = false;
			else dataset.value = output;
			return dataset;
		}
	};
}
/**
* Returns the fallback value of the schema.
*
* @param schema The schema to get it from.
* @param dataset The output dataset if available.
* @param config The config if available.
*
* @returns The fallback value.
*/
/* @__NO_SIDE_EFFECTS__ */
function getFallback(schema, dataset, config$1) {
	return typeof schema.fallback === "function" ? schema.fallback(dataset, config$1) : schema.fallback;
}
/**
* Returns the default value of the schema.
*
* @param schema The schema to get it from.
* @param dataset The input dataset if available.
* @param config The config if available.
*
* @returns The default value.
*/
/* @__NO_SIDE_EFFECTS__ */
function getDefault(schema, dataset, config$1) {
	return typeof schema.default === "function" ? schema.default(dataset, config$1) : schema.default;
}
/* @__NO_SIDE_EFFECTS__ */
function literal(literal_, message$1) {
	return {
		kind: "schema",
		type: "literal",
		reference: literal,
		expects: /* @__PURE__ */ _stringify(literal_),
		async: false,
		literal: literal_,
		message: message$1,
		get "~standard"() {
			return /* @__PURE__ */ _getStandardProps(this);
		},
		"~run"(dataset, config$1) {
			if (dataset.value === this.literal) dataset.typed = true;
			else _addIssue(this, "type", dataset, config$1);
			return dataset;
		}
	};
}
/* @__NO_SIDE_EFFECTS__ */
function optional(wrapped, default_) {
	return {
		kind: "schema",
		type: "optional",
		reference: optional,
		expects: `(${wrapped.expects} | undefined)`,
		async: false,
		wrapped,
		default: default_,
		get "~standard"() {
			return /* @__PURE__ */ _getStandardProps(this);
		},
		"~run"(dataset, config$1) {
			if (dataset.value === void 0) {
				if (this.default !== void 0) dataset.value = /* @__PURE__ */ getDefault(this, dataset, config$1);
				if (dataset.value === void 0) {
					dataset.typed = true;
					return dataset;
				}
			}
			return this.wrapped["~run"](dataset, config$1);
		}
	};
}
/* @__NO_SIDE_EFFECTS__ */
function picklist(options, message$1) {
	return {
		kind: "schema",
		type: "picklist",
		reference: picklist,
		expects: /* @__PURE__ */ _joinExpects(options.map(_stringify), "|"),
		async: false,
		options,
		message: message$1,
		get "~standard"() {
			return /* @__PURE__ */ _getStandardProps(this);
		},
		"~run"(dataset, config$1) {
			if (this.options.includes(dataset.value)) dataset.typed = true;
			else _addIssue(this, "type", dataset, config$1);
			return dataset;
		}
	};
}
/* @__NO_SIDE_EFFECTS__ */
function record(key, value$1, message$1) {
	return {
		kind: "schema",
		type: "record",
		reference: record,
		expects: "Object",
		async: false,
		key,
		value: value$1,
		message: message$1,
		get "~standard"() {
			return /* @__PURE__ */ _getStandardProps(this);
		},
		"~run"(dataset, config$1) {
			const input = dataset.value;
			if (input && typeof input === "object") {
				dataset.typed = true;
				dataset.value = {};
				for (const entryKey in input) if (/* @__PURE__ */ _isValidObjectKey(input, entryKey)) {
					const entryValue = input[entryKey];
					const keyDataset = this.key["~run"]({ value: entryKey }, config$1);
					if (keyDataset.issues) {
						const pathItem = {
							type: "object",
							origin: "key",
							input,
							key: entryKey,
							value: entryValue
						};
						for (const issue of keyDataset.issues) {
							issue.path = [pathItem];
							dataset.issues?.push(issue);
						}
						if (!dataset.issues) dataset.issues = keyDataset.issues;
						if (config$1.abortEarly) {
							dataset.typed = false;
							break;
						}
					}
					const valueDataset = this.value["~run"]({ value: entryValue }, config$1);
					if (valueDataset.issues) {
						const pathItem = {
							type: "object",
							origin: "value",
							input,
							key: entryKey,
							value: entryValue
						};
						for (const issue of valueDataset.issues) {
							if (issue.path) issue.path.unshift(pathItem);
							else issue.path = [pathItem];
							dataset.issues?.push(issue);
						}
						if (!dataset.issues) dataset.issues = valueDataset.issues;
						if (config$1.abortEarly) {
							dataset.typed = false;
							break;
						}
					}
					if (!keyDataset.typed || !valueDataset.typed) dataset.typed = false;
					if (keyDataset.typed) dataset.value[keyDataset.value] = valueDataset.value;
				}
			} else _addIssue(this, "type", dataset, config$1);
			return dataset;
		}
	};
}
/* @__NO_SIDE_EFFECTS__ */
function strictObject(entries$1, message$1) {
	return {
		kind: "schema",
		type: "strict_object",
		reference: strictObject,
		expects: "Object",
		async: false,
		entries: entries$1,
		message: message$1,
		get "~standard"() {
			return /* @__PURE__ */ _getStandardProps(this);
		},
		"~run"(dataset, config$1) {
			const input = dataset.value;
			if (input && typeof input === "object") {
				dataset.typed = true;
				dataset.value = {};
				for (const key in this.entries) {
					const valueSchema = this.entries[key];
					if (key in input || (valueSchema.type === "exact_optional" || valueSchema.type === "optional" || valueSchema.type === "nullish") && valueSchema.default !== void 0) {
						const value$1 = key in input ? input[key] : /* @__PURE__ */ getDefault(valueSchema);
						const valueDataset = valueSchema["~run"]({ value: value$1 }, config$1);
						if (valueDataset.issues) {
							const pathItem = {
								type: "object",
								origin: "value",
								input,
								key,
								value: value$1
							};
							for (const issue of valueDataset.issues) {
								if (issue.path) issue.path.unshift(pathItem);
								else issue.path = [pathItem];
								dataset.issues?.push(issue);
							}
							if (!dataset.issues) dataset.issues = valueDataset.issues;
							if (config$1.abortEarly) {
								dataset.typed = false;
								break;
							}
						}
						if (!valueDataset.typed) dataset.typed = false;
						dataset.value[key] = valueDataset.value;
					} else if (valueSchema.fallback !== void 0) dataset.value[key] = /* @__PURE__ */ getFallback(valueSchema);
					else if (valueSchema.type !== "exact_optional" && valueSchema.type !== "optional" && valueSchema.type !== "nullish") {
						_addIssue(this, "key", dataset, config$1, {
							input: void 0,
							expected: `"${key}"`,
							path: [{
								type: "object",
								origin: "key",
								input,
								key,
								value: input[key]
							}]
						});
						if (config$1.abortEarly) break;
					}
				}
				if (!dataset.issues || !config$1.abortEarly) {
					for (const key in input) if (!(key in this.entries)) {
						_addIssue(this, "key", dataset, config$1, {
							input: key,
							expected: "never",
							path: [{
								type: "object",
								origin: "key",
								input,
								key,
								value: input[key]
							}]
						});
						break;
					}
				}
			} else _addIssue(this, "type", dataset, config$1);
			return dataset;
		}
	};
}
/* @__NO_SIDE_EFFECTS__ */
function string(message$1) {
	return {
		kind: "schema",
		type: "string",
		reference: string,
		expects: "string",
		async: false,
		message: message$1,
		get "~standard"() {
			return /* @__PURE__ */ _getStandardProps(this);
		},
		"~run"(dataset, config$1) {
			if (typeof dataset.value === "string") dataset.typed = true;
			else _addIssue(this, "type", dataset, config$1);
			return dataset;
		}
	};
}
/* @__NO_SIDE_EFFECTS__ */
function pipe(...pipe$1) {
	return {
		...pipe$1[0],
		pipe: pipe$1,
		get "~standard"() {
			return /* @__PURE__ */ _getStandardProps(this);
		},
		"~run"(dataset, config$1) {
			for (const item of pipe$1) if (item.kind !== "metadata") {
				if (dataset.issues && (item.kind === "schema" || item.kind === "transformation")) {
					dataset.typed = false;
					break;
				}
				if (!dataset.issues || !config$1.abortEarly && !config$1.abortPipeEarly) dataset = item["~run"](dataset, config$1);
			}
			return dataset;
		}
	};
}
/**
* Parses an unknown input based on a schema.
*
* @param schema The schema to be used.
* @param input The input to be parsed.
* @param config The parse configuration.
*
* @returns The parse result.
*/
/* @__NO_SIDE_EFFECTS__ */
function safeParse(schema, input, config$1) {
	const dataset = schema["~run"]({ value: input }, /* @__PURE__ */ getGlobalConfig(config$1));
	return {
		typed: dataset.typed,
		success: !dataset.issues,
		output: dataset.value,
		issues: dataset.issues
	};
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
const HexColorSchema = /* @__PURE__ */ pipe(/* @__PURE__ */ string("must be a color string"), /* @__PURE__ */ rawTransform(({ dataset, addIssue, NEVER }) => {
	try {
		return normalizeHex(dataset.value, "color");
	} catch {
		addIssue({ message: "must be a valid opaque color" });
		return NEVER;
	}
}));
const SeedsSchema = /* @__PURE__ */ strictObject({
	surface: HexColorSchema,
	neutral: HexColorSchema,
	accent: HexColorSchema,
	terminal: /* @__PURE__ */ record(/* @__PURE__ */ picklist(TERMINAL_COLOR_NAMES), HexColorSchema),
	overrides: /* @__PURE__ */ optional(/* @__PURE__ */ record(/* @__PURE__ */ picklist(PALETTE_COLOR_NAMES), HexColorSchema))
});
const ConfigSchema = /* @__PURE__ */ strictObject({
	mode: /* @__PURE__ */ picklist(["dark", "light"], "must be \"dark\" or \"light\""),
	modes: /* @__PURE__ */ strictObject({
		dark: SeedsSchema,
		light: SeedsSchema
	})
});
const RecipeSchema = /* @__PURE__ */ strictObject({
	version: /* @__PURE__ */ literal(1, "must be version 1"),
	config: ConfigSchema,
	colors: /* @__PURE__ */ record(/* @__PURE__ */ string(), HexColorSchema)
});
function validationError(label, issues) {
	const issue = issues[0];
	const path = issue?.path?.map(({ key }) => String(key)).join(".");
	return /* @__PURE__ */ new TypeError(`${path ? `${label}.${path}` : label} ${issue?.message ?? "is invalid"}`);
}
const DEFAULT_SEEDS = {
	dark: {
		surface: "#111318",
		neutral: "#8b8d98",
		accent: "#3d63dd",
		terminal: {}
	},
	light: {
		surface: "#f9fafb",
		neutral: "#8b8d98",
		accent: "#3d63dd",
		terminal: {}
	}
};
function defaultSeeds(mode) {
	return {
		...DEFAULT_SEEDS[mode],
		terminal: {}
	};
}
function parseConfig(input) {
	const result = /* @__PURE__ */ safeParse(ConfigSchema, input);
	if (!result.success) throw validationError("config", result.issues);
	return result.output;
}
function parseRecipe(input) {
	const result = /* @__PURE__ */ safeParse(RecipeSchema, input);
	if (!result.success) throw validationError("recipe", result.issues);
	return result.output;
}
function parseConfigJson(input) {
	try {
		return parseConfig(JSON.parse(input));
	} catch (error) {
		if (error instanceof SyntaxError) throw new TypeError(`Invalid config JSON: ${error.message}`, { cause: error });
		throw error;
	}
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
		scales = Object.fromEntries(scaleNames.map((name) => [name, oklchScale(name, mode)]));
		scaleCache.set(mode, scales);
	}
	return scales;
}
function grayScales(mode) {
	const scales = allScales(mode);
	return Object.fromEntries(grayScaleNames.map((name) => [name, scales[name]]));
}
function toHexScale(scale, label) {
	return scale.map((color, index) => normalizeHex(color.to("srgb").toString({ format: "hex" }), `${label}.${index + 1}`));
}
function generateRadixColors({ appearance, background, gray, accent }) {
	const backgroundColor = new Color(background).to("oklch");
	const grayScaleColors = getScaleFromColor(new Color(gray).to("oklch"), grayScales(appearance), backgroundColor);
	const accentBaseColor = new Color(accent).to("oklch");
	let accentScaleColors = getScaleFromColor(accentBaseColor, allScales(appearance), backgroundColor);
	const accentBaseHex = accentBaseColor.to("srgb").toString({ format: "hex" });
	if (accentBaseHex === "#000" || accentBaseHex === "#fff") accentScaleColors = grayScaleColors.map((color) => color.clone());
	const [accent9Color, accentContrastColor] = getStep9Colors(accentScaleColors, accentBaseColor);
	accentScaleColors[8] = accent9Color;
	accentScaleColors[9] = getButtonHoverColor(accent9Color, [accentScaleColors]);
	accentScaleColors[10].coords[1] = Math.min(Math.max(accentScaleColors[8].coords[1] ?? 0, accentScaleColors[7].coords[1] ?? 0), accentScaleColors[10].coords[1] ?? 0);
	accentScaleColors[11].coords[1] = Math.min(Math.max(accentScaleColors[8].coords[1] ?? 0, accentScaleColors[7].coords[1] ?? 0), accentScaleColors[11].coords[1] ?? 0);
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
	buttonHoverColor.coords[1] = closestColor.coords[1] ?? 0;
	buttonHoverColor.coords[2] = closestColor.coords[2] ?? 0;
	return buttonHoverColor;
}
function getScaleFromColor(source, scales, backgroundColor) {
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
	if (!closestColors.every((color) => grayScaleNamesStr.includes(color.scale)) && grayScaleNamesStr.includes(closestColors[0]?.scale ?? "")) while (grayScaleNamesStr.includes(closestColors[1]?.scale ?? "")) closestColors.splice(1, 1);
	const colorA = closestColors[0];
	const colorB = closestColors[1];
	if (!colorA || !colorB) throw new Error("Unable to find Radix reference scales");
	const a = colorB.distance;
	const b = colorA.distance;
	const c = colorA.color.deltaEOK(colorB.color);
	const cosA = (b ** 2 + c ** 2 - a ** 2) / (2 * b * c);
	const sinA = Math.sin(Math.acos(cosA));
	const cosB = (a ** 2 + c ** 2 - b ** 2) / (2 * a * c);
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
	const ratioC = (source.coords[1] ?? 0) / (baseColor.coords[1] ?? 0);
	scale.forEach((color) => {
		color.coords[1] = Math.min((source.coords[1] ?? 0) * 1.5, (color.coords[1] ?? 0) * ratioC);
		color.coords[2] = source.coords[2] ?? 0;
	});
	if ((scale[0].coords[0] ?? 0) > .5) {
		const lightnessScale = scale.map(({ coords }) => coords[0] ?? 0);
		const newLightnessScale = transposeProgressionStart(Math.max(0, Math.min(1, backgroundColor.coords[0] ?? 0)), [1, ...lightnessScale], lightModeEasing);
		newLightnessScale.shift();
		newLightnessScale.forEach((lightness, index) => {
			scale[index].coords[0] = lightness;
		});
		return scale;
	}
	const ease = [...darkModeEasing];
	const referenceBackgroundColorLightness = scale[0].coords[0] ?? 0;
	const ratioL = Math.max(0, Math.min(1, backgroundColor.coords[0] ?? 0)) / referenceBackgroundColorLightness;
	if (ratioL > 1) {
		const maxRatio = 1.5;
		for (let index = 0; index < ease.length; index += 1) {
			const metaRatio = (ratioL - 1) * (maxRatio / .5);
			ease[index] = ratioL > maxRatio ? 0 : Math.max(0, (ease[index] ?? 0) * (1 - metaRatio));
		}
	}
	const lightnessScale = scale.map(({ coords }) => coords[0] ?? 0);
	transposeProgressionStart(backgroundColor.coords[0] ?? 0, lightnessScale, ease).forEach((lightness, index) => {
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
		const lastIndex = values.length - 1;
		return value - ((values[0] ?? 0) - to) * bezier(...curve)(1 - index / lastIndex);
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
	const colors = {
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
		brown: terminal.brown,
		...seeds.overrides
	};
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
//#region src/theme/atomic-write.ts
function atomicWrite(file, content) {
	const directory = path.dirname(file);
	fs.mkdirSync(directory, { recursive: true });
	const mode = fs.existsSync(file) ? fs.statSync(file).mode & 511 : 420;
	const temporary = path.join(directory, `.${path.basename(file)}.${process.pid}.${randomBytes(6).toString("hex")}`);
	let descriptor;
	try {
		descriptor = fs.openSync(temporary, "wx", mode);
		fs.writeFileSync(descriptor, content, "utf8");
		fs.fsyncSync(descriptor);
		fs.closeSync(descriptor);
		descriptor = void 0;
		fs.renameSync(temporary, file);
		const directoryDescriptor = fs.openSync(directory, "r");
		try {
			fs.fsyncSync(directoryDescriptor);
		} finally {
			fs.closeSync(directoryDescriptor);
		}
	} finally {
		if (descriptor !== void 0) fs.closeSync(descriptor);
		fs.rmSync(temporary, { force: true });
	}
}
//#endregion
//#region src/theme/command.ts
function runThemeSet(slug, options) {
	if (options.runThemeSet) {
		options.runThemeSet(slug);
		return;
	}
	const result = spawnSync("omarchy", [
		"theme",
		"set",
		slug
	], {
		encoding: "utf8",
		env: options.env ?? process.env
	});
	if (result.error) throw result.error;
	if (result.status !== 0) throw new Error(result.stderr.trim() || result.stdout.trim() || `omarchy theme set exited ${result.status}`);
}
//#endregion
//#region src/theme/paths.ts
function resolveThemePaths(options = {}) {
	const env = options.env ?? process.env;
	const home = path.resolve(options.home ?? env.HOME ?? "");
	if (!home || home === path.parse(home).root) throw new Error("HOME is not set to a usable directory");
	const omarchyPath = path.resolve(options.omarchyPath ?? env.OMARCHY_PATH ?? "/usr/share/omarchy");
	const currentDir = path.join(home, ".local/state/omarchy/current");
	const chromarchyState = path.join(home, ".local/state/omarchy/chromarchy");
	return {
		home,
		omarchyPath,
		currentDir,
		currentThemeName: path.join(currentDir, "theme.name"),
		stockThemes: path.join(omarchyPath, "themes"),
		userThemes: path.join(home, ".config/omarchy/themes"),
		chromarchyState,
		mutationLock: path.join(chromarchyState, "mutation.lock"),
		undo: path.join(chromarchyState, "undo.json"),
		recipes: path.join(chromarchyState, "recipes")
	};
}
function validateSlug(value) {
	const slug = value.trim();
	if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) throw new Error(`Invalid current theme slug '${slug}'`);
	return slug;
}
function managedThemeSlug(options = {}) {
	return validateSlug(options.targetSlug ?? "chromarchy");
}
//#endregion
//#region src/theme/mutation-lock.ts
function readOwner(lock) {
	let value;
	try {
		value = JSON.parse(fs.readFileSync(path.join(lock, "owner.json"), "utf8"));
	} catch (error) {
		throw new Error(`Chromarchy mutation lock '${lock}' has malformed ownership data; remove it manually only after confirming no Chromarchy command is running`, { cause: error });
	}
	const owner = value;
	if (!Number.isSafeInteger(owner.pid) || (owner.pid ?? 0) <= 0 || typeof owner.token !== "string" || owner.token.length === 0) throw new Error(`Chromarchy mutation lock '${lock}' has malformed ownership data; remove it manually only after confirming no Chromarchy command is running`);
	return owner;
}
function acquire(options) {
	const paths = resolveThemePaths(options);
	fs.mkdirSync(paths.chromarchyState, { recursive: true });
	const token = randomBytes(16).toString("hex");
	try {
		fs.mkdirSync(paths.mutationLock);
	} catch (error) {
		if (error.code !== "EEXIST") throw error;
		const owner = readOwner(paths.mutationLock);
		throw new Error(`Chromarchy mutation is already running or left a lock '${paths.mutationLock}' (pid ${owner.pid}); remove it manually only after confirming no Chromarchy command is running`);
	}
	try {
		fs.writeFileSync(path.join(paths.mutationLock, "owner.json"), `${JSON.stringify({
			pid: process.pid,
			token
		})}\n`);
		return {
			lock: paths.mutationLock,
			token
		};
	} catch (error) {
		fs.rmSync(paths.mutationLock, {
			recursive: true,
			force: true
		});
		throw error;
	}
}
function withMutationLock(body, options = {}) {
	const ownership = acquire(options);
	try {
		return body();
	} finally {
		try {
			if (readOwner(ownership.lock).token === ownership.token) fs.rmSync(ownership.lock, { recursive: true });
		} catch {}
	}
}
//#endregion
//#region src/theme/render.ts
const COLOR_LINE = /^(\s*)([A-Za-z_][A-Za-z0-9_]*)(\s*=\s*)"([^"]*)"(\s*(?:#.*)?)$/;
function parseTheme(source) {
	const colors = {};
	let mode;
	for (const line of source.split(/\r?\n/)) {
		const match = COLOR_LINE.exec(line);
		if (!match) continue;
		const key = match[2];
		const rawValue = match[4];
		if (!key || !rawValue) continue;
		if (key === "mode") {
			if (rawValue === "dark" || rawValue === "light") mode = rawValue;
			continue;
		}
		if (/^#[\da-f]{6}$/i.test(rawValue)) colors[key] = normalizeHex(rawValue, key);
	}
	if (!mode) throw new Error("colors.toml has no valid mode key");
	if (!colors.background || !colors.foreground || !colors.accent) throw new Error("colors.toml is missing background, foreground, or accent");
	return {
		mode,
		colors
	};
}
function renderPalette(source, mode, colors) {
	let modeUpdated = false;
	const remaining = new Map(Object.entries(colors).map(([key, value]) => [key, normalizeHex(value, key)]));
	const updated = [];
	const lines = source.split(/\r?\n/).map((line) => {
		const match = COLOR_LINE.exec(line);
		if (!match) return line;
		const indent = match[1] ?? "";
		const key = match[2];
		const separator = match[3] ?? " = ";
		const suffix = match[5] ?? "";
		if (!key) return line;
		if (key === "mode") {
			modeUpdated = true;
			return `${indent}${key}${separator}"${mode}"${suffix}`;
		}
		const value = remaining.get(key);
		if (!value || key.startsWith("hyprland_")) return line;
		remaining.delete(key);
		updated.push(key);
		return `${indent}${key}${separator}"${value}"${suffix}`;
	});
	if (!modeUpdated) throw new Error("colors.toml has no mode key");
	const missing = [...remaining.entries()].filter(([key]) => !key.startsWith("hyprland_"));
	if (missing.length > 0) {
		while (lines.length > 0 && lines.at(-1) === "") lines.pop();
		lines.push("", "# Added by Chromarchy");
		for (const [key, value] of missing) {
			lines.push(`${key} = "${value}"`);
			updated.push(key);
		}
	}
	return {
		text: `${lines.join("\n")}\n`,
		updated
	};
}
//#endregion
//#region src/theme/state.ts
const TERMINAL_SEED_NAMES = [
	"red",
	"yellow",
	"green",
	"cyan",
	"blue",
	"magenta",
	"orange",
	"brown"
];
function currentThemeContext(options = {}) {
	const paths = resolveThemePaths(options);
	if (!fs.existsSync(paths.currentThemeName)) throw new Error("No current Omarchy theme");
	const slug = validateSlug(fs.readFileSync(paths.currentThemeName, "utf8"));
	const target = path.join(paths.userThemes, slug, "colors.toml");
	const stock = path.join(paths.stockThemes, slug, "colors.toml");
	const source = fs.existsSync(target) ? target : stock;
	if (!fs.existsSync(source)) throw new Error(`Theme '${slug}' has no colors.toml`);
	return {
		slug,
		source,
		target,
		sourceText: fs.readFileSync(source, "utf8")
	};
}
function inferredConfig(mode, colors) {
	const surface = colors.lighter_background ?? colors.background;
	const accent = colors.accent;
	if (!surface || !accent) throw new Error("Theme is missing background or accent");
	const terminal = Object.fromEntries(TERMINAL_SEED_NAMES.flatMap((name) => colors[name] ? [[name, colors[name]]] : []));
	return {
		mode,
		modes: {
			dark: mode === "dark" ? {
				surface,
				neutral: colors.muted ?? colors.dark_foreground ?? colors.foreground ?? "#8b8d98",
				accent,
				terminal
			} : defaultSeeds("dark"),
			light: mode === "light" ? {
				surface,
				neutral: colors.muted ?? colors.dark_foreground ?? colors.foreground ?? "#8b8d98",
				accent,
				terminal
			} : defaultSeeds("light")
		}
	};
}
function paletteMatches(current, generated) {
	return Object.entries(generated).every(([key, value]) => current[key] === value);
}
function configPath(slug, options) {
	return path.join(resolveThemePaths(options).recipes, `${slug}.json`);
}
function readSavedConfig(slug, mode, colors, options) {
	const file = configPath(slug, options);
	if (!fs.existsSync(file)) return void 0;
	try {
		const recipe = parseRecipe(JSON.parse(fs.readFileSync(file, "utf8")));
		const requiredKeys = Object.keys(generatePalette(recipe.config).colors);
		return recipe.config.mode === mode && requiredKeys.every((key) => recipe.colors[key] !== void 0) && paletteMatches(colors, recipe.colors) ? recipe.config : void 0;
	} catch {
		return;
	}
}
function getThemeState(options = {}) {
	const context = currentThemeContext(options);
	const parsed = parseTheme(context.sourceText);
	const colors = Object.fromEntries(Object.entries(parsed.colors).map(([key, value]) => [key, normalizeHex(value, key)]));
	const config = readSavedConfig(context.slug, parsed.mode, colors, options) ?? inferredConfig(parsed.mode, colors);
	return {
		slug: context.slug,
		name: context.slug.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" "),
		mode: parsed.mode,
		source: context.source,
		target: context.target,
		colors,
		config,
		undoAvailable: undoStatus(options).available
	};
}
function undoStatus(options = {}) {
	const paths = resolveThemePaths(options);
	if (!fs.existsSync(paths.undo)) return { available: false };
	try {
		const snapshot = JSON.parse(fs.readFileSync(paths.undo, "utf8"));
		if (snapshot.version !== 1) return { available: false };
		const current = currentThemeContext(options);
		const slug = typeof snapshot.slug === "string" ? validateSlug(snapshot.slug) : "";
		return {
			available: slug === current.slug,
			slug
		};
	} catch {
		return { available: false };
	}
}
function savedRecipePath(slug, options = {}) {
	return configPath(validateSlug(slug), options);
}
//#endregion
//#region src/theme/managed-theme.ts
function copyThemeLayer(source, target) {
	if (!fs.existsSync(source)) return;
	fs.cpSync(source, target, {
		recursive: true,
		force: true,
		filter: (entry) => path.basename(entry) !== ".git"
	});
}
function openManagedThemeUnlocked(options = {}) {
	const paths = resolveThemePaths(options);
	const slug = managedThemeSlug(options);
	const target = path.join(paths.userThemes, slug);
	const current = currentThemeContext(options);
	if (!fs.existsSync(target)) {
		const temporary = path.join(paths.userThemes, `.${slug}.${process.pid}.${randomBytes(6).toString("hex")}`);
		fs.mkdirSync(paths.userThemes, { recursive: true });
		try {
			copyThemeLayer(path.join(paths.stockThemes, current.slug), temporary);
			copyThemeLayer(path.join(paths.userThemes, current.slug), temporary);
			if (!fs.existsSync(path.join(temporary, "colors.toml"))) throw new Error(`Current theme '${current.slug}' cannot be copied: colors.toml is missing`);
			fs.renameSync(temporary, target);
			runThemeSet(slug, options);
		} finally {
			fs.rmSync(temporary, {
				recursive: true,
				force: true
			});
		}
	} else if (current.slug !== slug) runThemeSet(slug, options);
	const state = getThemeState(options);
	if (state.slug !== slug) throw new Error(`Theme activation returned '${state.slug}' instead of '${slug}'`);
	return state;
}
//#endregion
//#region src/theme/apply.ts
function snapshotFile(file) {
	return fs.existsSync(file) ? {
		existed: true,
		content: fs.readFileSync(file, "utf8")
	} : { existed: false };
}
function restoreFile(file, snapshot) {
	if (snapshot.existed) {
		atomicWrite(file, snapshot.content ?? "");
		return;
	}
	fs.rmSync(file, { force: true });
	try {
		fs.rmdirSync(path.dirname(file));
	} catch {}
}
function parseUndoSnapshot(raw) {
	const value = JSON.parse(raw);
	if (value.version !== 1 || typeof value.slug !== "string" || !value.target || typeof value.target.existed !== "boolean" || value.target.existed && typeof value.target.content !== "string" || !value.recipe || typeof value.recipe.existed !== "boolean" || value.recipe.existed && typeof value.recipe.content !== "string") throw new Error("Undo snapshot is invalid");
	return {
		version: 1,
		slug: validateSlug(value.slug),
		target: value.target,
		recipe: value.recipe,
		createdAt: typeof value.createdAt === "number" ? value.createdAt : 0
	};
}
function applyPaletteUnlocked(input, options) {
	const config = parseConfig(input);
	const proposal = generatePalette(config);
	const context = currentThemeContext(options);
	const managedSlug = managedThemeSlug(options);
	if (context.slug !== managedSlug) throw new Error(`Chromarchy only writes theme '${managedSlug}', current theme is '${context.slug}'`);
	const paths = resolveThemePaths(options);
	const configFile = savedRecipePath(context.slug, options);
	const snapshot = {
		version: 1,
		slug: context.slug,
		target: snapshotFile(context.target),
		recipe: snapshotFile(configFile),
		createdAt: (options.now ?? Date.now)()
	};
	const previousUndo = snapshotFile(paths.undo);
	const rendered = renderPalette(context.sourceText, proposal.mode, proposal.colors);
	atomicWrite(paths.undo, `${JSON.stringify(snapshot)}\n`);
	try {
		atomicWrite(context.target, rendered.text);
		atomicWrite(configFile, `${JSON.stringify({
			version: 1,
			config,
			colors: proposal.colors
		}, null, 2)}\n`);
		runThemeSet(context.slug, options);
	} catch (error) {
		restoreFile(context.target, snapshot.target);
		restoreFile(configFile, snapshot.recipe);
		restoreFile(paths.undo, previousUndo);
		try {
			runThemeSet(context.slug, options);
		} catch {}
		throw error;
	}
	return {
		ok: true,
		slug: context.slug,
		target: context.target,
		updated: rendered.updated,
		state: getThemeState(options)
	};
}
function applyManagedPalette(input, options = {}) {
	return withMutationLock(() => {
		const previous = currentThemeContext(options);
		const managedSlug = managedThemeSlug(options);
		const managedDirectory = path.join(resolveThemePaths(options).userThemes, managedSlug);
		const managedExisted = fs.existsSync(managedDirectory);
		try {
			openManagedThemeUnlocked(options);
			return applyPaletteUnlocked(input, options);
		} catch (error) {
			const failures = [error];
			let restored = false;
			try {
				if (currentThemeContext(options).slug !== previous.slug) runThemeSet(previous.slug, options);
				const actual = currentThemeContext(options).slug;
				if (actual !== previous.slug) throw new Error(`Theme restoration returned '${actual}' instead of '${previous.slug}'`);
				restored = true;
			} catch (restorationError) {
				failures.push(restorationError);
			}
			if (!managedExisted && restored) try {
				fs.rmSync(managedDirectory, {
					recursive: true,
					force: true
				});
			} catch (cleanupError) {
				failures.push(cleanupError);
			}
			if (failures.length > 1) throw new AggregateError(failures, "Palette apply failed and recovery was incomplete");
			throw error;
		}
	}, options);
}
function undoPaletteUnlocked(options) {
	const paths = resolveThemePaths(options);
	if (!undoStatus(options).available) throw new Error("Nothing to undo for the current theme");
	const snapshot = parseUndoSnapshot(fs.readFileSync(paths.undo, "utf8"));
	const context = currentThemeContext(options);
	if (snapshot.slug !== context.slug) throw new Error(`Undo belongs to theme '${snapshot.slug}', current theme is '${context.slug}'`);
	const recipeFile = savedRecipePath(context.slug, options);
	const beforeTarget = snapshotFile(context.target);
	const beforeRecipe = snapshotFile(recipeFile);
	try {
		restoreFile(context.target, snapshot.target);
		restoreFile(recipeFile, snapshot.recipe);
		runThemeSet(context.slug, options);
	} catch (error) {
		restoreFile(context.target, beforeTarget);
		restoreFile(recipeFile, beforeRecipe);
		try {
			runThemeSet(context.slug, options);
		} catch {}
		throw error;
	}
	fs.rmSync(paths.undo, { force: true });
	return {
		ok: true,
		slug: context.slug,
		target: context.target,
		updated: [],
		state: getThemeState(options)
	};
}
function undoPalette(options = {}) {
	return withMutationLock(() => undoPaletteUnlocked(options), options);
}
//#endregion
//#region src/worker.ts
function startGenerationWorker(input, output) {
	createInterface({
		input,
		crlfDelay: Infinity
	}).on("line", (line) => {
		let id = null;
		try {
			const request = JSON.parse(line);
			if (!Number.isSafeInteger(request.id)) throw new TypeError("Worker request id must be an integer");
			id = request.id;
			output.write(`${JSON.stringify({
				id,
				result: generatePalette(parseConfig(request.config))
			})}\n`);
		} catch (error) {
			output.write(`${JSON.stringify({
				id,
				error: error instanceof Error ? error.message : String(error)
			})}\n`);
		}
	});
}
//#endregion
//#region src/cli.ts
const VERSION = "0.8.0";
function smokeColor() {
	return new Color("oklch", [
		.65,
		.2,
		280
	]).to("srgb").toString({ format: "hex" });
}
function configArgument(args) {
	const index = args.indexOf("--config-json");
	const value = index >= 0 ? args[index + 1] : void 0;
	if (!value) throw new TypeError(`${args[0]} requires --config-json <json>`);
	return value;
}
function main(args) {
	try {
		if (args.includes("--version")) {
			process.stdout.write(`${VERSION}\n`);
			return 0;
		}
		if (args.includes("--smoke")) {
			process.stdout.write(`${JSON.stringify({
				ok: true,
				hex: smokeColor()
			})}\n`);
			return 0;
		}
		if (args[0] === "worker") {
			startGenerationWorker(process.stdin, process.stdout);
			return 0;
		}
		if (args[0] === "generate") {
			process.stdout.write(`${JSON.stringify(generatePalette(parseConfigJson(configArgument(args))))}\n`);
			return 0;
		}
		if (args[0] === "open") {
			process.stdout.write(`${JSON.stringify(getThemeState())}\n`);
			return 0;
		}
		if (args[0] === "apply") {
			process.stdout.write(`${JSON.stringify(applyManagedPalette(parseConfigJson(configArgument(args))))}\n`);
			return 0;
		}
		if (args[0] === "undo") {
			process.stdout.write(`${JSON.stringify(undoPalette())}\n`);
			return 0;
		}
		if (args[0] === "undo-status") {
			process.stdout.write(`${JSON.stringify(undoStatus())}\n`);
			return 0;
		}
		process.stderr.write("Usage: chromarchy [--version|--smoke]|open|worker|generate --config-json <json>|apply --config-json <json>|undo|undo-status\n");
		return 2;
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		process.stderr.write(`chromarchy: ${message}\n`);
		return 1;
	}
}
//#endregion
//#region src/chromarchy.ts
process.exitCode = main(process.argv.slice(2));
//#endregion
export {};
