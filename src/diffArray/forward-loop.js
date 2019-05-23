import { unmount, coerceToVNode, Fragment } from "./create-element";

const EMPTY_ARR = [];

/**
 * @param {Node} parentDom
 * @param {import('./internal').VNode} oldVNode
 * @param {import('./internal').VNode} newVNode
 */
function diff(parentDom, oldVNode, newVNode) {
	if (newVNode.type == Fragment || (oldVNode && oldVNode.type == Fragment)) {
		diffChildren(parentDom, newVNode, oldVNode);
	} else if (oldVNode) {
		newVNode._dom = oldVNode._dom;
	} else if (newVNode.type == null) {
		newVNode._dom = document.createTextNode(newVNode.props);
	} else {
		throw new Error(`Unknown type: ${newVNode.type}`);
	}
}

// TODO: Fragment challenges
// * placeChildren does have access to Fragments oldChildren
// * _oldIndex, _newIndex are in the context of the local oldChildren array,
//	which is different from the "array" and index of `forEachDomVNode`.
//
//	Perhaps pass a `continuationIndex` into diffChildren when going traversing
//	down components and Fragments
//
// * Unmounting doesn't see the full oldChildren array?
//
// Fundamentally, the diff loop and place loop are different :(

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

			if (
				oldVNode === null ||
				(oldVNode &&
					(oldVNode.key != null
						? newVNode.key === oldVNode.key
						: newVNode.key == null && newVNode.type === oldVNode.type))
			) {
				// oldArr[i] = undefined;
				newVNode._oldIndex = i;

				if (oldVNode) {
					oldVNode._newIndex = i;
				}
			} else {
				for (j = 0; j < oldChildren.length; j++) {
					oldVNode = oldChildren[j];
					if (
						oldVNode &&
						(oldVNode.key != null
							? newVNode.key === oldVNode.key
							: newVNode.key == null && newVNode.type === oldVNode.type)
					) {
						// oldArr[j] = undefined;
						newVNode._oldIndex = j;
						oldVNode._newIndex = i;
						break;
					}
					oldVNode = null;
				}
			}

			diff(parentDom, oldVNode, newVNode);
		}

		// if (oldChild == null) {
		//   if (i >= oldArr.length) {
		//     newChild._refSibling = true;
		//   } else {
		//     newChild._refSibling = oldArr[i];
		//   }
		// }
	}

	if (newParentVNode.type == null || typeof newParentVNode.type == 'string') {
		placeChildren(parentDom, newChildren, oldChildren);
	}

	// Remove old nodes
	i = oldChildren.length;
	while (--i >= 0) {
		// if (oldChildren[i]._newIndex == null) {
		if (oldChildren[i] != null && oldChildren[i]._newIndex == null) {
			unmount(oldChildren[i]);
			oldChildren[i] = null;
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
	forEachDomVNode(newChildren, (newChild, i) => {
		const originalIndex = i;
		while (i == originalIndex) {
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
	});
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
