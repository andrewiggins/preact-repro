export function expect(actualValue) {
	return {
	  to: {
		equal(expectedValue, message) {
		  if (actualValue !== expectedValue) {
			const errorMsg = `'${actualValue}' (actual) does not equal '${expectedValue}' (expected). Message: ${message}`;
			console.error(errorMsg);
			throw new Error(errorMsg);
		  }
		}
	  }
	};
  }
