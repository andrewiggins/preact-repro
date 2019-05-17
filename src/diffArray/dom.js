import { runTests } from "./runTest";

function diff(oldChild, newChild) {
	if (oldChild) {
		newChild._dom = oldChild._dom;
	} else {
		newChild._dom = document.createTextNode(newChild.key);
	}
}

function diffChildren(newVNode, oldVNode, parentDom) {
	// algorithm assumes oldArr matches result

	const newArr = newVNode._children;
	const oldArr = oldVNode._children;

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

	placeChildren(newArr, oldArr, parentDom);

	// Remove old nodes
	i = oldArr.length;
	while (--i >= 0) {
		if (oldArr[i] != null) {
			parentDom.removeChild(oldArr[i]._dom);
		}
	}
}

function placeChildren(newArr, oldArr, parentDom) {
	// Insert new nodes
	let i = newArr.length - 1;
	let j = oldArr.length - 1;
	let prevOldChild = null;
	while (i >= 0) {
		let newChild = newArr[i];
		let oldChild = oldArr[j];

		if (j < 0) {
			// No more old children so just insert new children
			let refNode = prevOldChild ? prevOldChild._dom : null;
			parentDom.insertBefore(newChild._dom, refNode);
			i--;

			if (newChild._oldIndex != null) {
				oldArr[newChild._oldIndex] = null;
			}
		} else if (oldChild == null) {
			j--;
		} else if (newChild == null) {
			i--;
		} else if (oldChild._newIndex == null) {
			// Skip over old children that don't have a match in new children (they will be removed)
			prevOldChild = oldChild;
			j--;
		} else {
			if (newChild.key == oldChild.key) {
				i--;
				j--;

				prevOldChild = oldChild;
				// oldArr[j] = null;
			} else if (oldChild._newIndex < newChild._oldIndex) {
				console.log(
					"oldChild._newIndex:",
					oldChild._newIndex,
					"newChild._oldIndex:",
					newChild._oldIndex,
					oldChild._newIndex < newChild._oldIndex
				);
				console.log(oldChild.key, prevOldChild && prevOldChild.key);

				j--;
				prevOldChild = oldChild;
				continue;
			} else {
				// console.log(
				// 	"oldChild._newIndex:",
				// 	oldChild._newIndex,
				// 	"newChild._oldIndex:",
				// 	newChild._oldIndex,
				// 	oldChild._newIndex < newChild._oldIndex
				// );

				let refNode = prevOldChild ? prevOldChild._dom : null;
				parentDom.insertBefore(newChild._dom, refNode);
				i--;
			}

			if (newChild._oldIndex != null) {
				oldArr[newChild._oldIndex] = null;
			}
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
}

runTests(diffChildren);
