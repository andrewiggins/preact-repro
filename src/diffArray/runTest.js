import { startCapturingLogs, stopCapturing } from "./logCall";
import { isEqual } from "./isEqual";
import { createElement, coerceToVNode } from "./create-element";

const sumFailedResults = array =>
	array.reduce((sum, didSucceed) => (!didSucceed ? sum + 1 : sum), 0);

const sumFailedDiffs = array =>
	array.reduce((sum, diff) => (diff > 0 ? sum + 1 : sum), 0);

const sumImprovementDiffs = array =>
	array.reduce((sum, diff) => (diff < 0 ? sum + 1 : sum), 0);

const parentKey = "parent";

/**
 * @param {(newVNode: import('./internal').VNode, oldVNode: import('./internal').VNode, parentDom: Node) => void} diffChildren
 */
export function runTests(diffChildren) {
	const correctnessResults = [];
	const opCountDiffs = [];

	/**
	 * @param {any[]} oldArr
	 * @param {any[]} newArr
	 * @param {string} label
	 * @param {number} expectedOpCount
	 */
	function run(oldArr, newArr, label, expectedOpCount) {
		const oldParentVNode = generateHtml(oldArr);
		const newParentVNode = createElement(
			oldParentVNode.type,
			{ key: parentKey },
			...newArr // Copy newArr to preserve the original
		);
		const parentDom = oldParentVNode._dom;

		const original = parentDom.textContent;

		startCapturingLogs();
		diffChildren(newParentVNode, oldParentVNode, parentDom);
		const log = stopCapturing();
		const domOps = log.filter(log => log[0] !== "log");
		const actualOpCount = domOps.length;

		const actual = parentDom.textContent;
		const expected = newArr.join("");
		const result = isEqual(actual, expected);
		const opCountDiff = actualOpCount - expectedOpCount;

		if (opCountDiff !== 0 || result === false) {
			console.group(label);
		} else {
			console.groupCollapsed(label);
		}

		log.forEach(args => console.log(...args));
		console.log(result, `${original} => ${actual}`, expected);
		console.log(opCountDiff <= 0, actualOpCount, "<=", expectedOpCount);
		console.groupEnd();

		correctnessResults.push(result);
		opCountDiffs.push(opCountDiff);
	}

	run([0, 1, 2], [0, 1, 2], "No diff:", 0);

	run([], [0], "Append 0:", 1);
	run([0], [0, 1], "Append 1:", 1);
	run([0, 1], [0, 1, 2], "Append 2:", 1);
	run([0, 1, 2], [0, 1, 2, 3], "Append 3:", 1);

	run([0], [], "Pop 0:", 1);
	run([0, 1], [0], "Pop 1:", 1);
	run([0, 1, 2], [0, 1], "Pop 2:", 1);
	run([0, 1, 2, 3], [0, 1, 2], "Pop 3:", 1);

	run([1, 2], [0, 1, 2], "Prepend:", 1);
	run([0, 1, 2], [1, 2], "Remove from beginning:", 1);

	run([0, 2], [0, 1, 2], "Insert in middle:", 1);
	run([0, 1, 3, 4], [0, 1, 2, 3, 4], "Insert in middle 2:", 1);
	run([0, 2, 3], [0, 1, 2, 3], "Insert in middle left:", 1);
	run([0, 1, 3], [0, 1, 2, 3], "Insert in middle right:", 1);

	run([0, 1, 2], [0, 2], "Remove from middle:", 1);
	run([0, 1, 2, 3, 4], [0, 1, 3, 4], "Remove from middle 2:", 1);
	run([0, 1, 2, 3], [0, 2, 3], "Remove from middle left:", 1);
	run([0, 1, 2, 3], [0, 1, 3], "Remove from middle right:", 1);

	run([0, 1], [1, 0], "Swap:", 1);

	run([0, 1, 2, 3], [0, 2, 1, 3], "Swap in middle (forward):", 1);
	run([0, 2, 1, 3], [0, 1, 2, 3], "Swap in middle (backward):", 1);

	run([0, 1, 2, 3], [1, 2, 3, 0], "Move to end", 1);
	run([1, 2, 3, 0], [0, 1, 2, 3], "Move to beginning", 1);

	run([0, 1, 2, 3], [3, 2, 1, 0], "Reverse", 3);

	run(
		[0, 1, 2, 3, 4, 5, 6, 7],
		[0, 1, 3, 4, 5, 6, 2, 7],
		"Single jump forward:",
		1
	);
	run(
		[0, 1, 3, 4, 5, 6, 2, 7],
		[0, 1, 2, 3, 4, 5, 6, 7],
		"Single jump backward:",
		4
	);

	run(
		[0, 1, 2, 3, 4, 5, 6, 7],
		[0, 1, 2, 3, 5, 6, 4, 7],
		"Single jump forward short:",
		1
	);
	run(
		[0, 1, 2, 3, 5, 6, 4, 7],
		[0, 1, 2, 3, 4, 5, 6, 7],
		"Single jump backward short:",
		2
	);

	run(
		[0, 1, 2, 3, 4, 5, 6, 7],
		[0, 2, 3, 4, 5, 6, 1, 7],
		"Single jump forward long:",
		1
	);
	run(
		[0, 2, 3, 4, 5, 6, 1, 7],
		[0, 1, 2, 3, 4, 5, 6, 7],
		"Single jump backward long:",
		1
	);

	run([0, 1, 2, 3, 4, 5], [2, 0, 4, 1, 5, 3], "Multiple jump forward:", 3);
	run([2, 0, 4, 1, 5, 3], [0, 1, 2, 3, 4, 5], "Multiple jump backward:", 3);

	run(
		[0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
		[0, 9, 7, 1, 8, 2, 3, 4, 6, 5],
		"Multiple jump forward 2:",
		7
	);
	run(
		[0, 9, 7, 1, 8, 2, 3, 4, 6, 5],
		[0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
		"Multiple jump backward 2:",
		4
	);

	run(
		[5, 8, 3, 2, 4, 0, 6, 7, 1, 9],
		[0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
		"Wild! movement",
		7
	);
	run(
		[5, 8, 3, 2, 4, 0, 6, 7, 1],
		[0, 1, 2, 3, 5, 6, 7, 8, 9],
		"Wild! movement, addition, removal",
		8
	);
	run(
		[5, 8, 3, 2, 0, 6, 7, 1],
		[0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
		"Wild! movement, addition 2",
		8
	);

	run([0], [null], "To null placeholder 0", 1);
	run([0, 1], [0, null], "To null placeholder end", 1);
	run([0, 1], [null, 1], "To null placeholder beginning", 1);
	run([0, 1, 2], [0, null, 2], "To null placeholder middle", 1);
	run([0, 1, 2], [0, null, 1, 2], "Insert null", 0);

	run([null], [0], "From null placeholder 0", 1);
	run([0, null], [0, 1], "From null placeholder end", 1);
	run([null, 1], [0, 1], "From null placeholder beginning", 1);
	run([0, null, 2], [0, 1, 2], "From null placeholder middle", 1);
	// run([0, null, 1, 2], [0, 1, 2], "Remove null", 0); // TODO: Weird edge case maybe not worth covering, though maybe unmounting null is worth it?

	console.log("Correctness Failed:", sumFailedResults(correctnessResults));
	console.log("Op Count Failed:", sumFailedDiffs(opCountDiffs));
	console.log("Op Count Improved:", sumImprovementDiffs(opCountDiffs));
}

/**
 * @param {number[]} array
 * @returns {import('./internal').VNode}
 */
function generateHtml(array) {
	let parentDom = document.createElement("div");
	let vnodes = [];
	for (let i = 0; i < array.length; i++) {
		let value = array[i];
		if (value != null) {
			let dom = document.createTextNode(value.toString());
			parentDom.appendChild(dom);

			let vnode = coerceToVNode(value);
			vnode._dom = dom;
			vnodes.push(vnode);
		} else {
			vnodes.push(null);
		}
	}

	const parentVNode = createElement("div", { key: parentKey }, vnodes);
	parentVNode._children = parentVNode.props.children;
	parentVNode._dom = parentDom;

	return parentVNode;
}
