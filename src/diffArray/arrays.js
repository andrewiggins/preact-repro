import { isEqual } from "./isEqual";

const EMPTY_OBJ = {};

// #region Add Node methods to Array
/**
 * Move an element in an array from one index to another
 * @param {any[]} values The array of values
 * @param {number} from The index to move from
 * @param {number} to The index to move to
 */
function move(values, from, to) {
	const value = values[from];
	values.splice(from, 1);
	values.splice(to, 0, value);
}

Array.prototype.appendChild = function(newChild) {
	console.log("appendChild", newChild.key);
	this.push(newChild);
};
Array.prototype.insertBefore = function(newChild, refChild) {
	if (newChild == null) {
		throw new Error(`insertBefore: newChild cannnot be null.`);
	}

	if (refChild == null || refChild === EMPTY_OBJ) {
		console.log("insertBefore", newChild.key, refChild && refChild.key);
		this.push(newChild);
	} else {
		const refIndex = this.indexOf(refChild);
		if (refIndex === -1) {
			throw new Error(`insertBefore: refChild (${refChild}) was not found.`);
		}

		console.log("insertBefore", newChild.key, refChild && refChild.key);
		this.splice(refIndex, 0, newChild);
	}
};
Array.prototype.replaceChild = function(newChild, oldChild) {
	const index = this.indexOf(oldChild);
	if (index === -1) {
		throw new Error(`replaceChild: oldChild (${oldChild}) was not found.`);
	}

	console.log("replaceChild", newChild.key, oldChild.key);
	return this.splice(index, 1, newChild)[0];
};
Array.prototype.removeChild = function(oldChild) {
	if (oldChild == null) {
		throw new Error(`removeChild: oldChild cannot be null`);
	}

	const index = this.indexOf(oldChild);
	if (index === -1) {
		throw new Error(`removeChild: oldChild was not found.`);
	}

	console.log("removeChild", oldChild.key);
	return this.splice(index, 1)[0];
};
//#endregion

function diffArrays(newArr, oldArr, result) {
	// algorithm assumes oldArr matches result

	let i, j;

	// Find matching old nodes
	for (i = 0; i < newArr.length; i++) {
		let newChild = newArr[i];
		let oldChild = oldArr[i];

		// if (oldChild && oldChild.key === newChild.key) {
		//   oldArr[i] = undefined;
		// } else {
		//   for (j = 0; j < oldArr.length; j++) {
		//     oldChild = oldArr[j];
		//     if (oldChild && newChild.key === oldChild.key) {
		//       oldArr[j] = undefined;
		//       break;
		//     }
		//     oldChild = null;
		//   }
		// }

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
		let newChild = newArr[i];
		let oldChild = oldArr[j];
		if (newChild) {
			if (oldChild && newChild.key == oldChild.key) {
				i--;

				prevOldChild = oldChild;
				oldArr[j] = null;
				j--;
			} else {
				result.insertBefore(newChild, prevOldChild);
				i--;
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
			result.removeChild(oldArr[i]);
		}
	}
}

const wrap = arr => arr.map(key => ({ key }));
const unwrap = arr => arr.map(obj => obj.key);
function run(oldArr, newArr, label) {
	console.log(label);

	oldArr = wrap(oldArr);
	newArr = wrap(newArr);

	let actual = [...oldArr];
	let expected = [...newArr];
	diffArrays(newArr, oldArr, actual);

	actual = unwrap(actual);
	expected = unwrap(expected);
	console.log(isEqual(actual, expected), actual, expected);
	// console.log();
}

// no diff
run([0, 1, 2], [0, 1, 2], "No diff:");

// append
run([0, 1], [0, 1, 2], "Append:");

// insert
run([0, 2], [0, 1, 2], "Insert:");

// prepend
run([1, 2], [0, 1, 2], "Prepend:");

// remove
run([0, 1, 2], [0, 2], "Remove:");

// move forward
run([0, 1, 2, 3], [1, 2, 0, 3], "Move forward:");

// move backward
run([0, 1, 2, 3], [1, 2, 0, 3], "Move backward:");
