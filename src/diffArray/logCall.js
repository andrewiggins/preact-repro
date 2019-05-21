let log = [];
let restores = [];

export function startCapturingLogs() {
	if (restores.length == 0) {
		restores = [
			logCall(Node.prototype, "appendChild"),
			logCall(Node.prototype, "insertBefore"),
			logCall(Node.prototype, "replaceChild"),
			logCall(Node.prototype, "removeChild"),
			logCall(console, "log", false)
		];
	}
}

export function stopCapturing() {
	let restore = restores.pop();
	while (restore != null) {
		restore();
		restore = restores.pop();
	}

	let capturedLog = log;
	log = [];

	return capturedLog;
}

/**
 * Modify obj's original method to log calls and arguments on logger object
 * @template T
 * @param {T} obj
 * @param {keyof T} method
 * @param {boolean} callOriginal
 */
function logCall(obj, method, callOriginal = true) {
	const original = obj[method];
	obj[method] = function(...args) {
		if (callOriginal) {
			original.apply(this, args);
		}

		args = args.map(arg => (arg instanceof Text ? arg.data : arg));
		log.push([method, ...args]);
	};

	return () => (obj[method] = original);
}
