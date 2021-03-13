import { readdirSync } from "fs";
import path from "path";
import alias from "@rollup/plugin-alias";
import sucrase from "@rollup/plugin-sucrase";
import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

const p = (...paths) => path.join(__dirname, ...paths);

const input = Object.fromEntries(
	readdirSync("src").map((entry) => [
		entry.replace(/\.[a-zA-z]+$/, ""),
		`src/${entry}`,
	])
);
console.log(input);

export default {
	input,
	preserveEntrySignatures: false, // Per rollup warning
	output: {
		dir: "./dist",
		format: "esm",
		chunkFileNames: "[name].js", // Keep consistent names for easier debugging
	},
	plugins: [
		nodeResolve(),
		sucrase({
			transforms: ["jsx"],
			jsxPragma: "createElement",
			jsxFragPragma: "Fragment",
			production: true,
		}),
		commonjs(),
		alias({
			entries: {
				"preact/hooks": p("lib/preact/hooks.js"),
				preact: p("lib/preact/index.js"),
			},
		}),
	],
};
