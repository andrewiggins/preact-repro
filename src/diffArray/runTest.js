import { startLogging, stopLogging } from "./logCall";
import { isEqual } from "./isEqual";

const parentKey = "parent";

export function runTests(diffChildren) {
	const results = [];
	function run(oldArr, newArr, label) {
		console.group(label);

		const [oldVNode, parentDom] = generateHtml(oldArr);
		const newVNode = { key: parentKey, _children: newArr.map(coerceToVNode) };

		const original = parentDom.textContent;

		startLogging();
		diffChildren(newVNode, oldVNode, parentDom);
		stopLogging();

		const actual = parentDom.textContent;
		const expected = newArr.join("");
		const result = isEqual(actual, expected);
		console.log(result, `${original} => ${actual}`, expected);
		console.groupEnd();

		results.push(result);
	}

	run([0, 1, 2], [0, 1, 2], "No diff:");

	run([0, 1], [0, 1, 2], "Append:");
	run([0, 1, 2], [0, 1], "Remove from end:");

	run([1, 2], [0, 1, 2], "Prepend:");
	run([0, 1, 2], [1, 2], "Remove from beginning:");

	run([0, 2], [0, 1, 2], "Insert in middle:");
	run([0, 1, 2], [0, 2], "Remove from middle:");

	run([0, 1], [1, 0], "Swap:");

	run([0, 1, 2, 3], [0, 2, 1, 3], "Swap in middle (forward):");
	run([0, 2, 1, 3], [0, 1, 2, 3], "Swap in middle (backward):");

	run([0, 1, 2, 3], [1, 2, 3, 0], "Move to end");
	run([1, 2, 3, 0], [0, 1, 2, 3], "Move to beginning");

	run([0, 1, 2, 3], [3, 2, 1, 0], "Reverse");

	run([0, 1, 2, 3], [1, 2, 0, 3], "Jump forward:");
	run([1, 2, 0, 3], [0, 1, 2, 3], "Jump backward:");

	run(
		[5, 8, 3, 2, 4, 0, 6, 7, 1, 9],
		[0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
		"Wild! movement"
	);
	// run([5, 8, 3, 2, 4, 0, 6, 7, 1, 9], [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], "Wild! movement, addition, removal");

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
