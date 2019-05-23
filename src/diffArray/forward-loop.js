import { unmount, coerceToVNode } from "./create-element";

const EMPTY_ARR = [];

/**
 * @param {import('./internal').VNode} oldVNode
 * @param {import('./internal').VNode} newVNode
 */
function diff(oldVNode, newVNode) {
	if (oldVNode) {
		newVNode._dom = oldVNode._dom;
	} else if (newVNode.type == null) {
		newVNode._dom = document.createTextNode(newVNode.props);
	} else {
		throw new Error(`Unknown type: ${newVNode.type}`);
	}
}

/**
 * @param {Node} parentDom
 * @param {import('./internal').VNode} newParentVNode
 * @param {import('./internal').VNode} oldParentVNode
 */
export function diffChildren(parentDom, newParentVNode, oldParentVNode) {
	// algorithm assumes oldArr matches result

	const newChildren =
		newParentVNode._children ||
		(newParentVNode._children =
			newParentVNode.props.children == null
				? EMPTY_ARR
				: Array.isArray(newParentVNode.props.children)
				? newParentVNode.props.children
				: [newParentVNode.props.children]);
	const oldChildren = (oldParentVNode && oldParentVNode._children) || EMPTY_ARR;

	let i, j, newVNode, oldVNode;

	// Find matching old nodes
	for (i = 0; i < newChildren.length; i++) {
		// TODO: Hmmm potentially modifying array given to user (props.children)
		newVNode = newChildren[i] = coerceToVNode(newChildren[i]);

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

	placeChildren(parentDom, newChildren, oldChildren);

	// Remove old nodes
	i = oldChildren.length;
	while (--i >= 0) {
		// if (oldChildren[i]._newIndex == null) {
		if (oldChildren[i] != null) {
			unmount(oldChildren[i]);
		}
	}
}

/**
 * @param {Node} parentDom
 * @param {import('./internal').VNode[]} newChildren
 * @param {import('./internal').VNode[]} oldChildren
 */
function placeChildren(parentDom, newChildren, oldChildren) {
	// Insert new nodes
	let i = 0;
	let j = 0;
	let nextOldDom = getNextDom(oldChildren, j);
	while (i < newChildren.length) {
		let newChild = newChildren[i];
		let oldChild = oldChildren[j];

		oldChild = oldChild == null ? null : oldChild;
		console.log(
			"j",
			j,
			"o",
			oldChild && oldChild.key,
			"o._nI:",
			oldChild && oldChild._newIndex,
			"--",
			"i",
			i,
			"n",
			newChild && newChild.key,
			"n._oI:",
			newChild && newChild._oldIndex,
			"nOD:",
			nextOldDom && nextOldDom.key,
			"diff:",
			// oldChild._newIndex < newChild._oldIndex,
			// oldChild && oldChild._newIndex - newChild._oldIndex,
			// oldChild && oldChild._newIndex - i,
			newChild && newChild._oldIndex - i,
			oldChildren.length / 2
		);

		if (j >= oldChildren.length) {
			// No more old children so just insert new children
			parentDom.appendChild(newChild._dom);

			i++;
			if (newChild._oldIndex != null) {
				oldChildren[newChild._oldIndex] = null;
			}
		} else if (oldChild == null) {
			j++;
		} else if (newChild == null) {
			i++;
		} else if (oldChild._newIndex == null) {
			// Skip over old children that don't have a match in new children (they will be removed)
			j++;
		} else if (newChild.key == oldChild.key) {
			j++;
			nextOldDom = getNextDom(oldChildren, j);

			i++;
			if (newChild._oldIndex != null) {
				oldChildren[newChild._oldIndex] = null;
			}
		} else if (
			newChild._oldIndex - i > 0 &&
			newChild._oldIndex - i < oldChildren.length / 2
		) {
			console.log("skipping", oldChild.key);
			j++;
		} else {
			let refNode = nextOldDom ? nextOldDom._dom : null;
			parentDom.insertBefore(newChild._dom, refNode);

			i++;
			if (newChild._oldIndex != null) {
				oldChildren[newChild._oldIndex] = null;
			}
		}
	}
}

function getNextDom(oldChildren, j) {
	let k = j;
	let nextDom = null;
	while (k < oldChildren.length && nextDom == null) {
		nextDom = oldChildren[k];
		k++;
	}
	return nextDom;
}
