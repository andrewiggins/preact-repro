import { startLogging, stopLogging } from "./logCall";
import { isEqual } from "./isEqual";

export function runTests(diffChildren) {
	const results = [];
	const toVNodes = arr => arr.map(key => ({ key }));
	const toKeys = arr => arr.map(obj => obj.key);
	function run(oldArr, newArr, label) {
		console.group(label);

		const [oldVNodes, parentDom] = generateHtml(oldArr);
		const newVNodes = toVNodes(newArr);

		const original = parentDom.textContent;

		startLogging();
		diffChildren(newVNodes, oldVNodes, parentDom);
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
 * @param {number[]} array
 * @returns {[any[], Node]}
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

	return [vnodes, parent];
}
