export function isEqual(obj1, obj2) {
	const obj1Type = typeof obj1;
	const obj2Type = typeof obj2;

	const isObj1Array = Array.isArray(obj1);
	const isObj2Array = Array.isArray(obj2);

	if (obj1Type !== obj2Type) {
		return false;
	}

	if (isObj1Array !== isObj2Array) {
		return false;
	}

	if (isObj1Array) {
		if (obj1.length !== obj2.length) {
			return false;
		}

		for (let i = 0; i < obj1.length; i++) {
			if (!isEqual(obj1[i], obj2[i])) {
				return false;
			}
		}
	}
	else if (obj1Type === "object") {
		let obj1Keys = Object.keys(obj1);
		let obj2Keys = Object.keys(obj2);

		if (obj1Keys.length != obj2Keys.length) {
			return false;
		}

		for (let i = 0; i < obj1Keys.length; i++) {
			let obj1Key = obj1Keys[i];
			if (!isEqual(obj1[obj1Key], obj2[obj1Key])) {
				return false;
			}
		}

		for (let i = 0; i < obj2Keys.length; i++) {
			let obj2Key = obj2Keys[i];
			if (!isEqual(obj1[obj2Key], obj2[obj2Key])) {
				return false;
			}
		}
	}
	else {
		return obj1 === obj2;
	}

	return true;
}
