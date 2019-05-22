import { runTests } from "./runTest";

if (location.href.indexOf("preact") != -1) {
	import("./preact").then(({ preactDiffChildren }) => {
		runTests(preactDiffChildren);
		console.log("preact diffChildren");
	});
} else if (location.href.indexOf("forward") != -1) {
	import("./forward-loop").then(({ diffChildren }) => {
		runTests(diffChildren);
		console.log("forward diffChildren");
	});
} else {
	import("./backward-loop").then(({ diffChildren }) => {
		runTests(diffChildren);
		console.log("backward diffChildren");
	});
}
