// import "./arrays";
import { runTests } from "./runTest";
import { diffChildren } from "./backward-loop";
import { preactDiffChildren } from "./preact";

if (location.href.indexOf('preact') != -1) {
	runTests(preactDiffChildren);
}
else {
	runTests(diffChildren);
}
