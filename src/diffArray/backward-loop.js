/**
 * @param {import('./internal').VNode} oldVNode
 * @param {import('./internal').VNode} newVNode
 */
function diff(oldVNode, newVNode) {
	if (oldVNode) {
		newVNode._dom = oldVNode._dom;
	} else {
		newVNode._dom = document.createTextNode(newVNode.key);
	}
}

/**
 * @param {import('./internal').VNode} newParentVNode
 * @param {import('./internal').VNode} oldParentVNode
 * @param {Node} parentDom
 */
export function diffChildren(newParentVNode, oldParentVNode, parentDom) {
	// algorithm assumes oldArr matches result

	const newChildren = newParentVNode._children;
	const oldChildren = oldParentVNode._children;

	let i, j, newVNode, oldVNode;

	// Find matching old nodes
	for (i = 0; i < newChildren.length; i++) {
		newVNode = newChildren[i];

		if (newVNode != null) {
			oldVNode = oldChildren[i];

			if (oldVNode && oldVNode.key === newVNode.key) {
				// oldArr[i] = undefined;
				newVNode._oldIndex = i;
				oldVNode._newIndex = i;
			} else {
				for (j = 0; j < oldChildren.length; j++) {
					oldVNode = oldChildren[j];
					if (oldVNode && newVNode.key === oldVNode.key) {
						// oldArr[j] = undefined;
						newVNode._oldIndex = j;
						oldVNode._newIndex = i;
						break;
					}
					oldVNode = null;
				}
			}

			diff(oldVNode, newVNode);
		}

		// if (oldChild == null) {
		//   if (i >= oldArr.length) {
		//     newChild._refSibling = true;
		//   } else {
		//     newChild._refSibling = oldArr[i];
		//   }
		// }
	}

	placeChildren(newChildren, oldChildren, parentDom);

	// Remove old nodes
	i = oldChildren.length;
	while (--i >= 0) {
		// if (oldChildren[i]._newIndex == null) {
		if (oldChildren[i] != null) {
			parentDom.removeChild(oldChildren[i]._dom);
		}
	}
}

/**
 * @param {import('./internal').VNode[]} newChildren
 * @param {import('./internal').VNode[]} oldChildren
 * @param {Node} parentDom
 */
function placeChildren(newChildren, oldChildren, parentDom) {
	// Insert new nodes
	let i = newChildren.length - 1;
	let j = oldChildren.length - 1;
	let prevOldChild = null;
	while (i >= 0) {
		let newChild = newChildren[i];
		let oldChild = oldChildren[j];

		// oldChild = oldChild == null ? null : oldChild;
		// console.log(
		// 	"j",
		// 	j,
		// 	"o",
		// 	oldChild && oldChild.key,
		// 	"o._nI:",
		// 	oldChild && oldChild._newIndex,
		// 	"--",
		// 	"i",
		// 	i,
		// 	"n",
		// 	newChild && newChild.key,
		// 	"n._oI:",
		// 	newChild && newChild._oldIndex,
		// 	// oldChild._newIndex < newChild._oldIndex,
		// 	oldChild && oldChild._newIndex - newChild._oldIndex,
		// 	oldChild && oldChild._newIndex - i
		// );

		if (j < 0) {
			// No more old children so just insert new children
			let refNode = prevOldChild ? prevOldChild._dom : null;
			parentDom.insertBefore(newChild._dom, refNode);

			prevOldChild = newChild;

			i--;
			if (newChild._oldIndex != null) {
				oldChildren[newChild._oldIndex] = null;
			}
		} else if (oldChild == null) {
			j--;
		} else if (newChild == null) {
			i--;
		} else if (oldChild._newIndex == null) {
			// Skip over old children that don't have a match in new children (they will be removed)
			j--;
			prevOldChild = oldChild;
		} else if (newChild.key == oldChild.key) {
			j--;
			prevOldChild = oldChild;

			i--;
			if (newChild._oldIndex != null) {
				oldChildren[newChild._oldIndex] = null;
			}
		} else if (i - oldChild._newIndex > newChildren.length / 2) {
			console.log('skipping', oldChild.key);

			j--;
			prevOldChild = oldChild;
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

			prevOldChild = newChild;

			i--;
			if (newChild._oldIndex != null) {
				oldChildren[newChild._oldIndex] = null;
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

/**
 * @param {import('./internal').VNode[]} newChildren
 * @param {import('./internal').VNode[]} oldChildren
 * @param {Node} parentDom
 */
function placeChildren2(newChildren, oldChildren, parentDom) {
	let i = newChildren.length - 1;
	let prevOldDom = null;

	while (i >= 0) {
		let newVNode = newChildren[i];
		let oldVNode =
			newVNode._oldIndex != null ? oldChildren[newVNode._oldIndex] : null;

		if (oldVNode == null || newVNode._oldIndex != i) {
			parentDom.insertBefore(newVNode._dom, prevOldDom);
		}

		prevOldDom = newVNode._dom;
		i--;
	}
}