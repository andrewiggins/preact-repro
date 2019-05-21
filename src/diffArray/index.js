// import "./arrays";
import { runTests } from "./runTest";
import { diffChildren } from "./backward-loop";
import { diffChildren as forwardDiffChildren } from "./forward-loop";
import { preactDiffChildren } from "./preact";

if (location.href.indexOf("preact") != -1) {
	runTests(preactDiffChildren);
	console.log("preact diffChildren");
} else if (location.href.indexOf("forward") != -1) {
	runTests(forwardDiffChildren);
	console.log("forward diffChildren");
} else {
	runTests(diffChildren);
	console.log("backward diffChildren");
}
