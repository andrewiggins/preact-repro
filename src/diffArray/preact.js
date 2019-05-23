import { coerceToVNode, unmount, Fragment } from "./create-element";

const EMPTY_ARR = [];
const EMPTY_OBJ = {};

/**
 * @param {Node} parentDom
 * @param {import('./internal').VNode} newVNode
 * @param {import('./internal').VNode} oldVNode
 * @param {Node} oldDom
 */
function diff(parentDom, newVNode, oldVNode, oldDom) {
	let tmp;

	if (newVNode.type == Fragment || (oldVNode && oldVNode.type == Fragment)) {
		diffChildren(parentDom, newVNode, oldVNode, oldDom);

		let i = newVNode._children.length;
		if (i && (tmp = newVNode._children[0]) != null) {
			newVNode._dom = tmp._dom;

			// If the last child is a Fragment, use _lastDomChild, else use _dom
			// We have no guarantee that the last child rendered something into the
			// dom, so we iterate backwards to find the last child with a dom node.
			while (i--) {
				tmp = newVNode._children[i];
				if ((newVNode._lastDomChild = tmp && (tmp._lastDomChild || tmp._dom))) {
					break;
				}
			}
		}
	} else if (oldVNode) {
		newVNode._dom = oldVNode._dom;
	} else if (newVNode.type == null) {
		newVNode._dom = document.createTextNode(newVNode.props);
	} else {
		throw new Error(`Unknown type: ${newVNode.type}`);
	}

	return newVNode._dom;
}

/**
 * Largely inspired by Preact's current algorithm
 * @param {Node} parentDom
 * @param {import('./internal').VNode} newParentVNode
 * @param {import('./internal').VNode} oldParentVNode
 * @param {Node} [oldDom]
 */
function diffChildren(parentDom, newParentVNode, oldParentVNode, oldDom) {
	let newVNode, i, j, oldVNode, newDom, sibDom;

	// let newChildren = newParentVNode._children || toChildArray(newParentVNode.props.children, newParentVNode._children=[], coerceToVNode);
	let newChildren =
		newParentVNode._children ||
		(newParentVNode._children =
			newParentVNode.props.children == null
				? EMPTY_ARR
				: Array.isArray(newParentVNode.props.children)
				? newParentVNode.props.children
				: [newParentVNode.props.children]);
	// This is a compression of oldParentVNode!=null && oldParentVNode != EMPTY_OBJ && oldParentVNode._children || EMPTY_ARR
	// as EMPTY_OBJ._children should be `undefined`.
	let oldChildren = (oldParentVNode && oldParentVNode._children) || EMPTY_ARR;

	let oldChildrenLength = oldChildren.length;

	// Only in very specific places should this logic be invoked (top level `render` and `diffElementNodes`).
	// I'm using `EMPTY_OBJ` to signal when `diffChildren` is invoked in these situations. I can't use `null`
	// for this purpose, because `null` is a valid value for `oldDom` which can mean to skip to this logic
	// (e.g. if mounting a new tree in which the old DOM should be ignored (usually for Fragments).
	if (oldDom == EMPTY_OBJ) {
		oldDom = null;
		for (i = 0; !oldDom && i < oldChildrenLength; i++) {
			oldDom = oldChildren[i] && oldChildren[i]._dom;
		}
	}

	for (i = 0; i < newChildren.length; i++) {
		// TODO: Hmmm potentially modifying array given to user (props.children)
		newVNode = newChildren[i] = coerceToVNode(newChildren[i]);

		if (newVNode != null) {
			// Check if we find a corresponding element in oldChildren.
			// If found, delete the array item by setting to `undefined`.
			// We use `undefined`, as `null` is reserved for empty placeholders
			// (holes).
			oldVNode = oldChildren[i];

			if (
				oldVNode === null ||
				(oldVNode &&
					(oldVNode.key != null
						? newVNode.key === oldVNode.key
						: newVNode.key == null && newVNode.type === oldVNode.type))
			) {
				oldChildren[i] = undefined;
			} else {
				// Either oldVNode === undefined or oldChildrenLength > 0,
				// so after this loop oldVNode == null or oldVNode is a valid value.
				for (j = 0; j < oldChildrenLength; j++) {
					oldVNode = oldChildren[j];
					if (
						oldVNode &&
						(oldVNode.key != null
							? newVNode.key === oldVNode.key
							: newVNode.key == null && newVNode.type === oldVNode.type)
					) {
						oldChildren[j] = undefined;
						break;
					}
					oldVNode = null;
				}
			}

			// Morph the old element into the new one, but don't append it to the dom yet
			newDom = diff(parentDom, newVNode, oldVNode, oldDom);

			// Only proceed if the vnode has not been unmounted by `diff()` above.
			if (newDom != null) {
				if (newVNode._lastDomChild != null) {
					// Only Fragments or components that return Fragment like VNodes will
					// have a non-null _lastDomChild. Continue the diff from the end of
					// this Fragment's DOM tree.
					newDom = newVNode._lastDomChild;
				}
				// else if (excessDomChildren==oldVNode || newDom!=oldDom || newDom.parentNode==null) {
				else if (
					oldVNode == null ||
					newDom != oldDom ||
					newDom.parentNode == null
				) {
					// NOTE: excessDomChildren==oldVNode above:
					// This is a compression of excessDomChildren==null && oldVNode==null!
					// The values only have the same type when `null`.

					outer: if (oldDom == null || oldDom.parentNode !== parentDom) {
						parentDom.appendChild(newDom);
					} else {
						// `j<oldChildrenLength; j+=2` is an alternative to `j++<oldChildrenLength/2`
						for (
							sibDom = oldDom, j = 0;
							(sibDom = sibDom.nextSibling) && j < oldChildrenLength;
							j += 2
						) {
							if (sibDom == newDom) {
								break outer;
							}
						}
						parentDom.insertBefore(newDom, oldDom);
					}
				}

				oldDom = newDom.nextSibling;
			}
		}
	}

	// Remove children that are not part of any vnode. Only used by `hydrate`
	// if (excessDomChildren!=null && newParentVNode.type!==Fragment) for (i=excessDomChildren.length; i--; ) if (excessDomChildren[i]!=null) removeNode(excessDomChildren[i]);

	// Remove remaining oldChildren if there are any.
	for (i = oldChildrenLength; i--; )
		if (oldChildren[i] != null) unmount(oldChildren[i]);
}

export const preactDiffChildren = (newVNode, oldVNode, parentDom) =>
	diffChildren(parentDom, newVNode, oldVNode, EMPTY_OBJ);
