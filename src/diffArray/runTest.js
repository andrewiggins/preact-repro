import { startLogging, stopLogging } from "./logCall";
import { isEqual } from "./isEqual";

const parentKey = "parent";

/**
 * @param {(newVNode: import('./internal').VNode, oldVNode: import('./internal').VNode, parentDom: Node) => void} diffChildren
 */
export function runTests(diffChildren) {
	const results = [];

	/**
	 * @param {number[]} oldArr
	 * @param {number[]} newArr
	 * @param {string} label
	 * @param {number} expectedOpCount
	 */
	function run(oldArr, newArr, label, expectedOpCount) {
		console.group(label);

		const [oldVNode, parentDom] = generateHtml(oldArr);
		const newVNode = { key: parentKey, _children: newArr.map(coerceToVNode) };

		const original = parentDom.textContent;

		startLogging();
		diffChildren(newVNode, oldVNode, parentDom);
		const actualOpCount = stopLogging().length;

		const actual = parentDom.textContent;
		const expected = newArr.join("");
		const result = isEqual(actual, expected);
		console.log(result, `${original} => ${actual}`, expected);

		const opCountResult = actualOpCount <= expectedOpCount;
		console.log(opCountResult, actualOpCount, "<=", expectedOpCount);

		console.groupEnd();

		results.push(result && opCountResult);
	}

	run([0, 1, 2], [0, 1, 2], "No diff:", 0);

	run([0, 1], [0, 1, 2], "Append:", 1);
	run([0, 1, 2], [0, 1], "Remove from end:", 1);

	run([1, 2], [0, 1, 2], "Prepend:", 1);
	run([0, 1, 2], [1, 2], "Remove from beginning:", 1);

	run([0, 2], [0, 1, 2], "Insert in middle:", 1);
	run([0, 1, 2], [0, 2], "Remove from middle:", 1);

	run([0, 1], [1, 0], "Swap:", 1);

	run([0, 1, 2, 3], [0, 2, 1, 3], "Swap in middle (forward):", 1);
	run([0, 2, 1, 3], [0, 1, 2, 3], "Swap in middle (backward):", 1);

	run([0, 1, 2, 3], [1, 2, 3, 0], "Move to end", 1);
	run([1, 2, 3, 0], [0, 1, 2, 3], "Move to beginning", 1);

	run([0, 1, 2, 3], [3, 2, 1, 0], "Reverse", 3);

	run([0, 1, 2, 3, 4, 5, 6, 7], [0, 1, 3, 4, 5, 6, 2, 7], "Single jump forward:", 1);
	run([0, 1, 3, 4, 5, 6, 2, 7], [0, 1, 2, 3, 4, 5, 6, 7], "Single jump backward:", 4);

	run([0, 1, 2, 3, 4, 5], [2, 0, 4, 1, 5, 3], "Multiple jump forward:", 3);
	run([2, 0, 4, 1, 5, 3], [0, 1, 2, 3, 4, 5], "Multiple jump backward:", 3);

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

	console.log(
		"Failed:",
		results.reduce((sum, didSucceed) => (didSucceed ? sum : sum + 1), 0)
	);
}

/**
 * Coerce an untrusted value into a VNode
 * Specifically, this should be used anywhere a user could provide a boolean, string, or number where
 * a VNode or Component is desired instead
 * @param {boolean | string | number | import('./internal').VNode} possibleVNode A possible VNode
 * @returns {import('./internal').VNode | null}
 */
export function coerceToVNode(possibleVNode) {
	if (possibleVNode == null || typeof possibleVNode === "boolean") return null;
	if (typeof possibleVNode === "string" || typeof possibleVNode === "number") {
		return { key: possibleVNode };
	}

	// if (Array.isArray(possibleVNode)) {
	// 	return createElement(Fragment, null, possibleVNode);
	// }

	// // Clone vnode if it has already been used. ceviche/#57
	// if (possibleVNode._dom!=null || possibleVNode._component!=null) {
	// 	let vnode = createVNode(possibleVNode.type, possibleVNode.props, possibleVNode.key, null);
	// 	vnode._dom = possibleVNode._dom;
	// 	return vnode;
	// }

	return possibleVNode;
}

/**
 * @param {number[]} array
 * @returns {[import('./internal').VNode, Node]}
 */
function generateHtml(array) {
	let parent = document.createElement("div");
	let vnodes = [];

	for (let i = 0; i < array.length; i++) {
		let value = array[i];
		let dom = document.createTextNode(value.toString());

		parent.appendChild(dom);
		vnodes.push({ key: value, _dom: dom });
	}

	return [{ key: parentKey, _children: vnodes }, parent];
}
