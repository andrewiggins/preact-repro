let shouldLog = false;
let log = [];

export function startLogging() {
	initDomLogging();
	log = [];
	shouldLog = true;
}

export function stopLogging() {
	shouldLog = false;
	return log;
}

/**
 * Modify obj's original method to log calls and arguments on logger object
 * @template T
 * @param {T} obj
 * @param {keyof T} method
 */
function logCall(obj, method) {
	const original = obj[method];
	obj[method] = function(...args) {
		original.apply(this, args);

		if (shouldLog) {
			args = args.map(arg => (arg instanceof Text ? arg.data : arg));
			log.push([method, ...args]);
			console.log(method, ...args);
		}
	};
}

let initialized = false;
export function initDomLogging() {
	if (!initialized) {
		logCall(Node.prototype, "appendChild");
		logCall(Node.prototype, "insertBefore");
		logCall(Node.prototype, "replaceChild");
		logCall(Node.prototype, "removeChild");
		initialized = true;
	}
}
