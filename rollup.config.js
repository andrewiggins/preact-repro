import path from "path";
import buble from "rollup-plugin-buble";
import alias from "rollup-plugin-alias";
import nodeResolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";

const p = (...paths) => path.join(__dirname, ...paths);

export default {
	input: "./src/index.js",
	output: {
		dir: "./dist",
		format: "iife"
	},
	plugins: [
		nodeResolve(),
		commonjs(),
		buble({
			jsx: 'createElement'
		}),
		alias({
			"preact/hooks": p("lib/preact/hooks.js"),
			preact: p("lib/preact/index.js")
		})
	]
};
