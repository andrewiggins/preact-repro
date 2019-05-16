import { isEqual } from "./isEqual";
import { startLogging, stopLogging } from "./logCall";

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

function diff(oldChild, newChild) {
	if (oldChild) {
		newChild._dom = oldChild._dom;
	} else {
		newChild._dom = document.createTextNode(newChild.key);
	}
}

function diffChildren(newArr, oldArr, parentDom) {
	// algorithm assumes oldArr matches result

	let i, j, newChild, oldChild;

	// Find matching old nodes
	for (i = 0; i < newArr.length; i++) {
		newChild = newArr[i];
		oldChild = oldArr[i];

		if (oldChild && oldChild.key === newChild.key) {
			// oldArr[i] = undefined;
			newChild._oldIndex = i;
			oldChild._newIndex = i;
		} else {
			for (j = 0; j < oldArr.length; j++) {
				oldChild = oldArr[j];
				if (oldChild && newChild.key === oldChild.key) {
					// oldArr[j] = undefined;
					newChild._oldIndex = j;
					oldChild._newIndex = i;
					break;
				}
				oldChild = null;
			}
		}

		diff(oldChild, newChild);

		// if (oldChild == null) {
		//   if (i >= oldArr.length) {
		//     newChild._refSibling = true;
		//   } else {
		//     newChild._refSibling = oldArr[i];
		//   }
		// }
	}

	// Insert new nodes
	i = newArr.length - 1;
	j = oldArr.length - 1;
	let prevOldChild = null;
	while (i >= 0) {
		newChild = newArr[i];
		oldChild = oldArr[j];

		// TODO: To explore
		// const insert = newChild => parentDom.insertBefore(
		// 	newChild._dom,
		// 	prevOldChild && prevOldChild._dom
		// ), i--;
		//
		// if (j==0) { insert(); }
		// else if (oldChild == null) { j--; }
		// else if (newChild == null) { i--; }
		// else if (...) {...}
		//
		// Maybe try making the insert() case the final else case

		if (j >= 0 && oldChild == null) {
			// Skip over null old children if there are more in the list
			j--;
		} else if (oldChild && oldChild._newIndex == null) {
			// Skip over old children that don't have a match in new children (they will be removed)
			prevOldChild = oldChild;
			j--;
		} else if (newChild) {
			// Skip over null new children

			if (oldChild && newChild.key == oldChild.key) {
				i--;
				j--;

				prevOldChild = oldChild;
				// oldArr[j] = null;
			} else {
				let refNode = prevOldChild ? prevOldChild._dom : null;
				parentDom.insertBefore(newChild._dom, refNode);
				i--;
			}

			if (newChild._oldIndex != null) {
				oldArr[newChild._oldIndex] = null;
			}
		} else {
			i--;
		}

		// let refNode = newChild._refSibling;
		// if (refNode != null) {
		//   if (refNode === true) {
		//     result.appendChild(newChild);
		//   } else {
		//     result.insertBefore(newChild, refNode);
		//   }
		//   newChild._refSibling = null;
		// }
	}

	// Remove old nodes
	i = oldArr.length;
	while (--i >= 0) {
		if (oldArr[i] != null) {
			parentDom.removeChild(oldArr[i]._dom);
		}
	}
}

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
	console.log(isEqual(actual, expected), `${original} => ${actual}`, expected);
	console.groupEnd();
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
