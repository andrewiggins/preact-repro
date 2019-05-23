import { startCapturingLogs, stopCapturing } from "./logCall";
import { isEqual } from "./isEqual";
import { createElement, coerceToVNode, Fragment } from "./create-element";

const sumFailedResults = array =>
	array.reduce((sum, didSucceed) => (!didSucceed ? sum + 1 : sum), 0);

const sumFailedDiffs = array =>
	array.reduce((sum, diff) => (diff > 0 ? sum + 1 : sum), 0);

const sumImprovementDiffs = array =>
	array.reduce((sum, diff) => (diff < 0 ? sum + 1 : sum), 0);

const parentKey = "parent";

/**
 * @param {(parentDom: Node, newVNode: import('./internal').VNode, oldVNode: import('./internal').VNode) => void} diffChildren
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
		const expected = newArr.flat().join("");

		const oldParentVNode = generateHtml(oldArr);
		const newParentVNode = createElement(
			oldParentVNode.type,
			{ key: parentKey },
			newArr
		);
		const parentDom = oldParentVNode._dom;

		const original = parentDom.textContent;

		startCapturingLogs();
		diffChildren(parentDom, newParentVNode, oldParentVNode);
		const log = stopCapturing();
		const domOps = log.filter(log => log[0] !== "log");
		const actualOpCount = domOps.length;

		const actual = parentDom.textContent;
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

	run([0, 1], [0, 1, [2, 3]], "Append Fragment", 2);
	run([0, 1, [2, 3]], [0, 1], "Pop Fragment", 2);

	run([2, 3], [[0, 1], 2, 3], "Prepend Fragment", 2);
	run([[0, 1], 2, 3], [2, 3], "Remove Fragment from beginning", 2);

	run([0, 3], [0, [1, 2], 3], "Insert Fragment in middle", 2);
	run([0, [1, 2], 3], [0, 3], "Remove Fragment from middle", 2);

	run([[0, 1], 2, 3], [2, 3, [0, 1]], "Move Fragment to end", 2);
	run([2, 3, [0, 1]], [[0, 1], 2, 3], "Move Fragment to beginning", 2);

	run([0, [1, 2], 4], [0, [1, 2, 3], 4], "Inside Fragment: Append", 1);
	run([0, [1, 2, 3], 4], [0, [1, 2], 4], "Inside Fragment: Pop", 1);

	run([0, [2, 3], 4], [0, [1, 2, 3], 4], "Inside Fragment: Prepend", 1);
	run(
		[0, [1, 2, 3], 4],
		[0, [2, 3], 4],
		"Inside Fragment: Remove from beginning",
		1
	);

	run(
		[0, [1, 3], 4],
		[0, [1, 2, 3], 4],
		"Inside Fragment: Insert in middle",
		1
	);
	run(
		[0, [1, 2, 3], 4],
		[0, [1, 3], 4],
		"Inside Fragment: Remove from middle",
		1
	);

	run(
		[0, [1, 2, 3, 4], 5],
		[0, [2, 3, 4, 1], 5],
		"Inside Fragment: Move to end",
		1
	);
	run(
		[0, [2, 3, 4, 1], 5],
		[0, [1, 2, 3, 4], 5],
		"Inside Fragment: Move to beginning",
		1
	);

	console.log("Correctness Failed:", sumFailedResults(correctnessResults));
	console.log("Op Count Failed:", sumFailedDiffs(opCountDiffs));
	console.log("Op Count Improved:", sumImprovementDiffs(opCountDiffs));
}

/**
 * @param {number[]} array
 * @returns {import('./internal').VNode}
 */
function generateHtml(array) {
	let vnodes = array.map(toOldVNodes);

	let parentDom = document.createElement("div");
	forEachDomVNode(vnodes, vnode => {
		if (vnode != null && vnode.type == null) {
			vnode._dom = document.createTextNode(vnode.props.toString());
			parentDom.appendChild(vnode._dom);
		}
	});

	const parentVNode = createElement("div", { key: parentKey }, vnodes);
	parentVNode._children = parentVNode.props.children;
	parentVNode._dom = parentDom;

	return parentVNode;
}

const normalizeChildren = children =>
	children == null ? [] : Array.isArray(children) ? children : [children];

/** Coerce values to VNodes and assign _children for Fragments */
function toOldVNodes(possibleVNode) {
	const vnode = coerceToVNode(possibleVNode);
	if (vnode != null && vnode.type === Fragment) {
		vnode._children = normalizeChildren(vnode.props.children).map(toOldVNodes);
	}

	return vnode;
}

/**
 * @param {any} possibleVNode
 * @param {(vnode: import('./internal').VNode, i: number) => void} callback
 * @param {number} [i]
 */
function forEachDomVNode(possibleVNode, callback, i = 0) {
	if (possibleVNode == null) {
	} else if (Array.isArray(possibleVNode)) {
		possibleVNode.forEach(child => forEachDomVNode(child, callback, i++));
	} else if (
		possibleVNode.type != null &&
		typeof possibleVNode.type != "string"
	) {
		possibleVNode._children.forEach(child =>
			forEachDomVNode(child, callback, i++)
		);
	} else {
		callback(possibleVNode, i);
	}
}
