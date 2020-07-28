import path from "path";
import alias from "@rollup/plugin-alias";
import sucrase from "@rollup/plugin-sucrase";
import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

const p = (...paths) => path.join(__dirname, ...paths);

export default {
	input: "./src/index.js",
	preserveEntrySignatures: false, // Per rollup warning
	output: {
		dir: "./dist",
		format: "esm",
		chunkFileNames: "[name].js", // Keep consistent names for easier debugging
	},
	plugins: [
		nodeResolve(),
		commonjs(),
		sucrase({
			transforms: ["jsx"],
			jsxPragma: "createElement",
			jsxFragPragma: "Fragment",
		}),
		alias({
			entries: {
				"preact/hooks": p("lib/preact/hooks.js"),
				preact: p("lib/preact/index.js"),
			},
		}),
	],
};
