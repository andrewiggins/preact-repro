import {
	useState,
	useReducer,
	useEffect,
	useLayoutEffect,
	useRef,
	useImperativeHandle,
	useMemo,
	useCallback,
	useContext,
	useDebugValue,
} from "preact/hooks";
export * from "preact/hooks";
import {
	Component,
	createElement,
	options,
	toChildArray,
	Fragment,
	render,
	hydrate,
	cloneElement,
	createRef,
	createContext,
} from "preact";
export {
	createElement,
	createContext,
	createRef,
	Fragment,
	Component,
} from "preact";

/**
 * Assign properties from `props` to `obj`
 * @template O, P The obj and props types
 * @param {O} obj The object to copy properties to
 * @param {P} props The object to copy properties from
 * @returns {O & P}
 */
function assign(obj, props) {
	for (var i in props) {
		obj[i] = props[i];
	}

	return (
		/** @type {O & P} */
		obj
	);
}
/**
 * Check if two objects have a different shape
 * @param {object} a
 * @param {object} b
 * @returns {boolean}
 */

function shallowDiffers(a, b) {
	for (var i in a) {
		if (i !== "__source" && !(i in b)) {
			return true;
		}
	}

	for (var _i in b) {
		if (_i !== "__source" && a[_i] !== b[_i]) {
			return true;
		}
	}

	return false;
}

/**
 * Component class with a predefined `shouldComponentUpdate` implementation
 */

function PureComponent(p) {
	this.props = p;
}
PureComponent.prototype = new Component(); // Some third-party libraries check if this property is present

PureComponent.prototype.isPureReactComponent = true;

PureComponent.prototype.shouldComponentUpdate = function (props, state) {
	return shallowDiffers(this.props, props) || shallowDiffers(this.state, state);
};

/**
 * Memoize a component, so that it only updates when the props actually have
 * changed. This was previously known as `React.pure`.
 * @param {import('./internal').FunctionComponent} c functional component
 * @param {(prev: object, next: object) => boolean} [comparer] Custom equality function
 * @returns {import('./internal').FunctionComponent}
 */

function memo(c, comparer) {
	function shouldUpdate(nextProps) {
		var ref = this.props.ref;
		var updateRef = ref == nextProps.ref;

		if (!updateRef && ref) {
			ref.call ? ref(null) : (ref.current = null);
		}

		if (!comparer) {
			return shallowDiffers(this.props, nextProps);
		}

		return !comparer(this.props, nextProps) || !updateRef;
	}

	function Memoed(props) {
		this.shouldComponentUpdate = shouldUpdate;
		return createElement(c, props);
	}

	Memoed.displayName = "Memo(" + (c.displayName || c.name) + ")";
	Memoed.prototype.isReactComponent = true;
	Memoed.__f = true;
	return Memoed;
}

var oldDiffHook = options.__b;

options.__b = function (vnode) {
	if (vnode.type && vnode.type.__f && vnode.ref) {
		vnode.props.ref = vnode.ref;
		vnode.ref = null;
	}

	if (oldDiffHook) {
		oldDiffHook(vnode);
	}
};

var REACT_FORWARD_SYMBOL =
	(typeof Symbol != "undefined" &&
		Symbol.for &&
		Symbol.for("react.forward_ref")) ||
	0xf47;
/**
 * Pass ref down to a child. This is mainly used in libraries with HOCs that
 * wrap components. Using `forwardRef` there is an easy way to get a reference
 * of the wrapped component instead of one of the wrapper itself.
 * @param {import('./index').ForwardFn} fn
 * @returns {import('./internal').FunctionComponent}
 */

function forwardRef(fn) {
	// We always have ref in props.ref, except for
	// mobx-react. It will call this function directly
	// and always pass ref as the second argument.
	function Forwarded(props, ref) {
		var clone = assign({}, props);
		delete clone.ref;
		ref = props.ref || ref;
		return fn(
			clone,
			!ref || (typeof ref === "object" && !("current" in ref)) ? null : ref
		);
	} // mobx-react checks for this being present

	Forwarded.$$typeof = REACT_FORWARD_SYMBOL; // mobx-react heavily relies on implementation details.
	// It expects an object here with a `render` property,
	// and prototype.render will fail. Without this
	// mobx-react throws.

	Forwarded.render = Forwarded;
	Forwarded.prototype.isReactComponent = Forwarded.__f = true;
	Forwarded.displayName = "ForwardRef(" + (fn.displayName || fn.name) + ")";
	return Forwarded;
}

var mapFn = function mapFn(children, fn) {
	if (children == null) {
		return null;
	}
	return toChildArray(toChildArray(children).map(fn));
}; // This API is completely unnecessary for Preact, so it's basically passthrough.

var Children = {
	map: mapFn,
	forEach: mapFn,
	count: function count(children) {
		return children ? toChildArray(children).length : 0;
	},
	only: function only(children) {
		var normalized = toChildArray(children);
		if (normalized.length !== 1) {
			throw "Children.only";
		}
		return normalized[0];
	},
	toArray: toChildArray,
};

var oldCatchError = options.__e;

options.__e = function (error, newVNode, oldVNode) {
	if (error.then) {
		/** @type {import('./internal').Component} */
		var component;
		var vnode = newVNode;

		for (; (vnode = vnode.__); ) {
			if ((component = vnode.__c) && component.__c) {
				if (newVNode.__e == null) {
					newVNode.__e = oldVNode.__e;
					newVNode.__k = oldVNode.__k;
				} // Don't call oldCatchError if we found a Suspense

				return component.__c(error, newVNode);
			}
		}
	}

	oldCatchError(error, newVNode, oldVNode);
};

var oldUnmount = options.unmount;

options.unmount = function (vnode) {
	/** @type {import('./internal').Component} */
	var component = vnode.__c;

	if (component && component.__R) {
		component.__R();
	} // if the component is still hydrating
	// most likely it is because the component is suspended
	// we set the vnode.type as `null` so that it is not a typeof function
	// so the unmount will remove the vnode._dom

	if (component && vnode.__h === true) {
		vnode.type = null;
	}

	if (oldUnmount) {
		oldUnmount(vnode);
	}
};

function detachedClone(vnode, detachedParent, parentDom) {
	if (vnode) {
		if (vnode.__c && vnode.__c.__H) {
			vnode.__c.__H.__.forEach(function (effect) {
				if (typeof effect.__c == "function") {
					effect.__c();
				}
			});

			vnode.__c.__H = null;
		}

		vnode = assign({}, vnode);

		if (vnode.__c != null) {
			if (vnode.__c.__P === parentDom) {
				vnode.__c.__P = detachedParent;
			}

			vnode.__c = null;
		}

		vnode.__k =
			vnode.__k &&
			vnode.__k.map(function (child) {
				return detachedClone(child, detachedParent, parentDom);
			});
	}

	return vnode;
}

function removeOriginal(vnode, detachedParent, originalParent) {
	if (vnode) {
		vnode.__v = null;
		vnode.__k =
			vnode.__k &&
			vnode.__k.map(function (child) {
				return removeOriginal(child, detachedParent, originalParent);
			});

		if (vnode.__c) {
			if (vnode.__c.__P === detachedParent) {
				if (vnode.__e) {
					originalParent.insertBefore(vnode.__e, vnode.__d);
				}

				vnode.__c.__e = true;
				vnode.__c.__P = originalParent;
			}
		}
	}

	return vnode;
} // having custom inheritance instead of a class here saves a lot of bytes

function Suspense() {
	// we do not call super here to golf some bytes...
	this.__u = 0;
	this._suspenders = null;
	this.__b = null;
} // Things we do here to save some bytes but are not proper JS inheritance:
// - call `new Component()` as the prototype
// - do not set `Suspense.prototype.constructor` to `Suspense`

Suspense.prototype = new Component();
/**
 * @this {import('./internal').SuspenseComponent}
 * @param {Promise} promise The thrown promise
 * @param {import('./internal').VNode<any, any>} suspendingVNode The suspending component
 */

Suspense.prototype.__c = function (promise, suspendingVNode) {
	var suspendingComponent = suspendingVNode.__c;
	/** @type {import('./internal').SuspenseComponent} */

	var c = this;

	if (c._suspenders == null) {
		c._suspenders = [];
	}

	c._suspenders.push(suspendingComponent);

	var resolve = suspended(c.__v);
	var resolved = false;

	var onResolved = function onResolved() {
		if (resolved) {
			return;
		}
		resolved = true;
		suspendingComponent.__R = null;

		if (resolve) {
			resolve(onSuspensionComplete);
		} else {
			onSuspensionComplete();
		}
	};

	suspendingComponent.__R = onResolved;

	var onSuspensionComplete = function onSuspensionComplete() {
		if (!--c.__u) {
			// If the suspension was during hydration we don't need to restore the
			// suspended children into the _children array
			if (c.state.__e) {
				var suspendedVNode = c.state.__e;
				c.__v.__k[0] = removeOriginal(
					suspendedVNode,
					suspendedVNode.__c.__P,
					suspendedVNode.__c.__O
				);
			}

			c.setState({
				__e: (c.__b = null),
			});

			var _suspended;

			while ((_suspended = c._suspenders.pop())) {
				_suspended.forceUpdate();
			}
		}
	};
	/**
	 * We do not set `suspended: true` during hydration because we want the actual markup
	 * to remain on screen and hydrate it when the suspense actually gets resolved.
	 * While in non-hydration cases the usual fallback -> component flow would occour.
	 */

	var wasHydrating = suspendingVNode.__h === true;

	if (!c.__u++ && !wasHydrating) {
		c.setState({
			__e: (c.__b = c.__v.__k[0]),
		});
	}

	promise.then(onResolved, onResolved);
};

Suspense.prototype.componentWillUnmount = function () {
	this._suspenders = [];
};
/**
 * @this {import('./internal').SuspenseComponent}
 * @param {import('./internal').SuspenseComponent["props"]} props
 * @param {import('./internal').SuspenseState} state
 */

Suspense.prototype.render = function (props, state) {
	if (this.__b) {
		// When the Suspense's _vnode was created by a call to createVNode
		// (i.e. due to a setState further up in the tree)
		// it's _children prop is null, in this case we "forget" about the parked vnodes to detach
		if (this.__v.__k) {
			var detachedParent = document.createElement("div");
			var detachedComponent = this.__v.__k[0].__c;
			this.__v.__k[0] = detachedClone(
				this.__b,
				detachedParent,
				(detachedComponent.__O = detachedComponent.__P)
			);
		}

		this.__b = null;
	} // Wrap fallback tree in a VNode that prevents itself from being marked as aborting mid-hydration:

	/** @type {import('./internal').VNode} */

	var fallback = state.__e && createElement(Fragment, null, props.fallback);
	if (fallback) {
		fallback.__h = null;
	}
	return [
		createElement(Fragment, null, state.__e ? null : props.children),
		fallback,
	];
};
/**
 * Checks and calls the parent component's _suspended method, passing in the
 * suspended vnode. This is a way for a parent (e.g. SuspenseList) to get notified
 * that one of its children/descendants suspended.
 *
 * The parent MAY return a callback. The callback will get called when the
 * suspension resolves, notifying the parent of the fact.
 * Moreover, the callback gets function `unsuspend` as a parameter. The resolved
 * child descendant will not actually get unsuspended until `unsuspend` gets called.
 * This is a way for the parent to delay unsuspending.
 *
 * If the parent does not return a callback then the resolved vnode
 * gets unsuspended immediately when it resolves.
 *
 * @param {import('./internal').VNode} vnode
 * @returns {((unsuspend: () => void) => void)?}
 */

function suspended(vnode) {
	/** @type {import('./internal').Component} */
	var component = vnode.__.__c;
	return component && component.__e && component.__e(vnode);
}
function lazy(loader) {
	var prom;
	var component;
	var error;

	function Lazy(props) {
		if (!prom) {
			prom = loader();
			prom.then(
				function (exports) {
					component = exports.default || exports;
				},
				function (e) {
					error = e;
				}
			);
		}

		if (error) {
			throw error;
		}

		if (!component) {
			throw prom;
		}

		return createElement(component, props);
	}

	Lazy.displayName = "Lazy";
	Lazy.__f = true;
	return Lazy;
}

var SUSPENDED_COUNT = 0;
var RESOLVED_COUNT = 1;
var NEXT_NODE = 2; // Having custom inheritance instead of a class here saves a lot of bytes.

function SuspenseList() {
	this._next = null;
	this._map = null;
} // Mark one of child's earlier suspensions as resolved.
// Some pending callbacks may become callable due to this
// (e.g. the last suspended descendant gets resolved when
// revealOrder === 'together'). Process those callbacks as well.

var resolve = function resolve(list, child, node) {
	if (++node[RESOLVED_COUNT] === node[SUSPENDED_COUNT]) {
		// The number a child (or any of its descendants) has been suspended
		// matches the number of times it's been resolved. Therefore we
		// mark the child as completely resolved by deleting it from ._map.
		// This is used to figure out when *all* children have been completely
		// resolved when revealOrder is 'together'.
		list._map.delete(child);
	} // If revealOrder is falsy then we can do an early exit, as the
	// callbacks won't get queued in the node anyway.
	// If revealOrder is 'together' then also do an early exit
	// if all suspended descendants have not yet been resolved.

	if (
		!list.props.revealOrder ||
		(list.props.revealOrder[0] === "t" && list._map.size)
	) {
		return;
	} // Walk the currently suspended children in order, calling their
	// stored callbacks on the way. Stop if we encounter a child that
	// has not been completely resolved yet.

	node = list._next;

	while (node) {
		while (node.length > 3) {
			node.pop()();
		}

		if (node[RESOLVED_COUNT] < node[SUSPENDED_COUNT]) {
			break;
		}

		list._next = node = node[NEXT_NODE];
	}
}; // Things we do here to save some bytes but are not proper JS inheritance:
// - call `new Component()` as the prototype
// - do not set `Suspense.prototype.constructor` to `Suspense`

SuspenseList.prototype = new Component();

SuspenseList.prototype.__e = function (child) {
	var list = this;
	var delegated = suspended(list.__v);

	var node = list._map.get(child);

	node[SUSPENDED_COUNT]++;
	return function (unsuspend) {
		var wrappedUnsuspend = function wrappedUnsuspend() {
			if (!list.props.revealOrder) {
				// Special case the undefined (falsy) revealOrder, as there
				// is no need to coordinate a specific order or unsuspends.
				unsuspend();
			} else {
				node.push(unsuspend);
				resolve(list, child, node);
			}
		};

		if (delegated) {
			delegated(wrappedUnsuspend);
		} else {
			wrappedUnsuspend();
		}
	};
};

SuspenseList.prototype.render = function (props) {
	this._next = null;
	this._map = new Map();
	var children = toChildArray(props.children);

	if (props.revealOrder && props.revealOrder[0] === "b") {
		// If order === 'backwards' (or, well, anything starting with a 'b')
		// then flip the child list around so that the last child will be
		// the first in the linked list.
		children.reverse();
	} // Build the linked list. Iterate through the children in reverse order
	// so that `_next` points to the first linked list node to be resolved.

	for (var i = children.length; i--; ) {
		// Create a new linked list node as an array of form:
		// 	[suspended_count, resolved_count, next_node]
		// where suspended_count and resolved_count are numeric counters for
		// keeping track how many times a node has been suspended and resolved.
		//
		// Note that suspended_count starts from 1 instead of 0, so we can block
		// processing callbacks until componentDidMount has been called. In a sense
		// node is suspended at least until componentDidMount gets called!
		//
		// Pending callbacks are added to the end of the node:
		// 	[suspended_count, resolved_count, next_node, callback_0, callback_1, ...]
		this._map.set(children[i], (this._next = [1, 0, this._next]));
	}

	return props.children;
};

SuspenseList.prototype.componentDidUpdate = SuspenseList.prototype.componentDidMount = function () {
	var _this = this;

	// Iterate through all children after mounting for two reasons:
	// 1. As each node[SUSPENDED_COUNT] starts from 1, this iteration increases
	//    each node[RELEASED_COUNT] by 1, therefore balancing the counters.
	//    The nodes can now be completely consumed from the linked list.
	// 2. Handle nodes that might have gotten resolved between render and
	//    componentDidMount.
	this._map.forEach(function (node, child) {
		resolve(_this, child, node);
	});
};

/**
 * @param {import('../../src/index').RenderableProps<{ context: any }>} props
 */

function ContextProvider(props) {
	this.getChildContext = function () {
		return props.context;
	};

	return props.children;
}
/**
 * Portal component
 * @this {import('./internal').Component}
 * @param {object | null | undefined} props
 *
 * TODO: use createRoot() instead of fake root
 */

function Portal(props) {
	var _this = this;

	var container = props._container;

	_this.componentWillUnmount = function () {
		render(null, _this._temp);
		_this._temp = null;
		_this._container = null;
	}; // When we change container we should clear our old container and
	// indicate a new mount.

	if (_this._container && _this._container !== container) {
		_this.componentWillUnmount();
	} // When props.vnode is undefined/false/null we are dealing with some kind of
	// conditional vnode. This should not trigger a render.

	if (props.__v) {
		if (!_this._temp) {
			_this._container = container; // Create a fake DOM parent node that manages a subset of `container`'s children:

			_this._temp = {
				nodeType: 1,
				parentNode: container,
				childNodes: [],
				appendChild: function appendChild(child) {
					this.childNodes.push(child);

					_this._container.appendChild(child);
				},
				insertBefore: function insertBefore(child, before) {
					this.childNodes.push(child);

					_this._container.appendChild(child);
				},
				removeChild: function removeChild(child) {
					this.childNodes.splice(this.childNodes.indexOf(child) >>> 1, 1);

					_this._container.removeChild(child);
				},
			};
		} // Render our wrapping element into temp.

		render(
			createElement(
				ContextProvider,
				{
					context: _this.context,
				},
				props.__v
			),
			_this._temp
		);
	} // When we come from a conditional render, on a mounted
	// portal we should clear the DOM.
	else if (_this._temp) {
		_this.componentWillUnmount();
	}
}
/**
 * Create a `Portal` to continue rendering the vnode tree at a different DOM node
 * @param {import('./internal').VNode} vnode The vnode to render
 * @param {import('./internal').PreactElement} container The DOM node to continue rendering in to.
 */

function createPortal(vnode, container) {
	return createElement(Portal, {
		__v: vnode,
		_container: container,
	});
}

var REACT_ELEMENT_TYPE =
	(typeof Symbol != "undefined" && Symbol.for && Symbol.for("react.element")) ||
	0xeac7;
var CAMEL_PROPS = /^(?:accent|alignment|arabic|baseline|cap|clip(?!PathU)|color|fill|flood|font|glyph(?!R)|horiz|marker(?!H|W|U)|overline|paint|stop|strikethrough|stroke|text(?!L)|underline|unicode|units|v|vector|vert|word|writing|x(?!C))[A-Z]/; // Input types for which onchange should not be converted to oninput.
// type="file|checkbox|radio", plus "range" in IE11.
// (IE11 doesn't support Symbol, which we use here to turn `rad` into `ra` which matches "range")

var onChangeInputType = function onChangeInputType(type) {
	return (typeof Symbol != "undefined" && typeof Symbol() == "symbol"
		? /fil|che|rad/i
		: /fil|che|ra/i
	).test(type);
}; // Some libraries like `react-virtualized` explicitly check for this.

Component.prototype.isReactComponent = {}; // `UNSAFE_*` lifecycle hooks
// Preact only ever invokes the unprefixed methods.
// Here we provide a base "fallback" implementation that calls any defined UNSAFE_ prefixed method.
// - If a component defines its own `componentDidMount()` (including via defineProperty), use that.
// - If a component defines `UNSAFE_componentDidMount()`, `componentDidMount` is the alias getter/setter.
// - If anything assigns to an `UNSAFE_*` property, the assignment is forwarded to the unprefixed property.
// See https://github.com/preactjs/preact/issues/1941

[
	"componentWillMount",
	"componentWillReceiveProps",
	"componentWillUpdate",
].forEach(function (key) {
	Object.defineProperty(Component.prototype, key, {
		configurable: true,
		get: function get() {
			return this["UNSAFE_" + key];
		},
		set: function set(v) {
			Object.defineProperty(this, key, {
				configurable: true,
				writable: true,
				value: v,
			});
		},
	});
});
/**
 * Proxy render() since React returns a Component reference.
 * @param {import('./internal').VNode} vnode VNode tree to render
 * @param {import('./internal').PreactElement} parent DOM node to render vnode tree into
 * @param {() => void} [callback] Optional callback that will be called after rendering
 * @returns {import('./internal').Component | null} The root component reference or null
 */

function render$1(vnode, parent, callback) {
	// React destroys any existing DOM nodes, see #1727
	// ...but only on the first render, see #1828
	if (parent.__k == null) {
		parent.textContent = "";
	}

	render(vnode, parent);
	if (typeof callback == "function") {
		callback();
	}
	return vnode ? vnode.__c : null;
}
function hydrate$1(vnode, parent, callback) {
	hydrate(vnode, parent);
	if (typeof callback == "function") {
		callback();
	}
	return vnode ? vnode.__c : null;
}
var oldEventHook = options.event;

options.event = function (e) {
	if (oldEventHook) {
		e = oldEventHook(e);
	}
	e.persist = empty;
	e.isPropagationStopped = isPropagationStopped;
	e.isDefaultPrevented = isDefaultPrevented;
	return (e.nativeEvent = e);
};

function empty() {}

function isPropagationStopped() {
	return this.cancelBubble;
}

function isDefaultPrevented() {
	return this.defaultPrevented;
}

var classNameDescriptor = {
	configurable: true,
	get: function get() {
		return this.class;
	},
};
var oldVNodeHook = options.vnode;

options.vnode = function (vnode) {
	var type = vnode.type;
	var props = vnode.props;
	var normalizedProps = props; // only normalize props on Element nodes

	if (typeof type === "string") {
		normalizedProps = {};

		for (var i in props) {
			var value = props[i];

			if (i === "value" && "defaultValue" in props && value == null) {
				// Skip applying value if it is null/undefined and we already set
				// a default value
				continue;
			} else if (
				i === "defaultValue" &&
				"value" in props &&
				props.value == null
			) {
				// `defaultValue` is treated as a fallback `value` when a value prop is present but null/undefined.
				// `defaultValue` for Elements with no value prop is the same as the DOM defaultValue property.
				i = "value";
			} else if (i === "download" && value === true) {
				// Calling `setAttribute` with a truthy value will lead to it being
				// passed as a stringified value, e.g. `download="true"`. React
				// converts it to an empty string instead, otherwise the attribute
				// value will be used as the file name and the file will be called
				// "true" upon downloading it.
				value = "";
			} else if (/ondoubleclick/i.test(i)) {
				i = "ondblclick";
			} else if (
				/^onchange(textarea|input)/i.test(i + type) &&
				!onChangeInputType(props.type)
			) {
				i = "oninput";
			} else if (/^on(Ani|Tra|Tou|BeforeInp)/.test(i)) {
				i = i.toLowerCase();
			} else if (CAMEL_PROPS.test(i)) {
				i = i.replace(/[A-Z0-9]/, "-$&").toLowerCase();
			} else if (value === null) {
				value = undefined;
			}

			normalizedProps[i] = value;
		} // Add support for array select values: <select multiple value={[]} />

		if (
			type == "select" &&
			normalizedProps.multiple &&
			Array.isArray(normalizedProps.value)
		) {
			// forEach() always returns undefined, which we abuse here to unset the value prop.
			normalizedProps.value = toChildArray(props.children).forEach(function (
				child
			) {
				child.props.selected =
					normalizedProps.value.indexOf(child.props.value) != -1;
			});
		} // Adding support for defaultValue in select tag

		if (type == "select" && normalizedProps.defaultValue != null) {
			normalizedProps.value = toChildArray(props.children).forEach(function (
				child
			) {
				if (normalizedProps.multiple) {
					child.props.selected =
						normalizedProps.defaultValue.indexOf(child.props.value) != -1;
				} else {
					child.props.selected =
						normalizedProps.defaultValue == child.props.value;
				}
			});
		}

		vnode.props = normalizedProps;
	}

	if (type && props.class != props.className) {
		classNameDescriptor.enumerable = "className" in props;
		if (props.className != null) {
			normalizedProps.class = props.className;
		}
		Object.defineProperty(normalizedProps, "className", classNameDescriptor);
	}

	vnode.$$typeof = REACT_ELEMENT_TYPE;
	if (oldVNodeHook) {
		oldVNodeHook(vnode);
	}
}; // Only needed for react-relay

var currentComponent;
var oldBeforeRender = options.__r;

options.__r = function (vnode) {
	if (oldBeforeRender) {
		oldBeforeRender(vnode);
	}

	currentComponent = vnode.__c;
}; // This is a very very private internal function for React it
// is used to sort-of do runtime dependency injection. So far
// only `react-relay` makes use of it. It uses it to read the
// context value.

var __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = {
	ReactCurrentDispatcher: {
		current: {
			readContext: function readContext(context) {
				return currentComponent.__n[context.__c].props.value;
			},
		},
	},
};

// This file includes experimental React APIs exported from the "scheduler"
// npm package. Despite being explicitely marked as unstable some libraries
// already make use of them. This file is not a full replacement for the
// scheduler package, but includes the necessary shims to make those libraries
// work with Preact.
var unstable_ImmediatePriority = 1;
var unstable_UserBlockingPriority = 2;
var unstable_NormalPriority = 3;
var unstable_LowPriority = 4;
var unstable_IdlePriority = 5;
/**
 * @param {number} priority
 * @param {() => void} callback
 */

function unstable_runWithPriority(priority, callback) {
	return callback();
}
var unstable_now =
	typeof performance === "object" && typeof performance.now === "function"
		? performance.now.bind(performance)
		: function () {
				return Date.now();
		  };

var version = "16.8.0"; // trick libraries to think we are react

/**
 * Legacy version of createElement.
 * @param {import('./internal').VNode["type"]} type The node name or Component constructor
 */

function createFactory(type) {
	return createElement.bind(null, type);
}
/**
 * Check if the passed element is a valid (p)react node.
 * @param {*} element The element to check
 * @returns {boolean}
 */

function isValidElement(element) {
	return !!element && element.$$typeof === REACT_ELEMENT_TYPE;
}
/**
 * Wrap `cloneElement` to abort if the passed element is not a valid element and apply
 * all vnode normalizations.
 * @param {import('./internal').VNode} element The vnode to clone
 * @param {object} props Props to add when cloning
 * @param {Array<import('./internal').ComponentChildren>} rest Optional component children
 */

function cloneElement$1(element) {
	if (!isValidElement(element)) {
		return element;
	}
	return cloneElement.apply(null, arguments);
}
/**
 * Remove a component tree from the DOM, including state and event handlers.
 * @param {import('./internal').PreactElement} container
 * @returns {boolean}
 */

function unmountComponentAtNode(container) {
	if (container.__k) {
		render(null, container);
		return true;
	}

	return false;
}
/**
 * Get the matching DOM node for a component
 * @param {import('./internal').Component} component
 * @returns {import('./internal').PreactElement | null}
 */

function findDOMNode(component) {
	return (
		(component &&
			(component.base || (component.nodeType === 1 && component))) ||
		null
	);
}
/**
 * Deprecated way to control batched rendering inside the reconciler, but we
 * already schedule in batches inside our rendering code
 * @template Arg
 * @param {(arg: Arg) => void} callback function that triggers the updated
 * @param {Arg} [arg] Optional argument that can be passed to the callback
 */
// eslint-disable-next-line camelcase

var unstable_batchedUpdates = function unstable_batchedUpdates(callback, arg) {
	return callback(arg);
};
/**
 * Strict Mode is not implemented in Preact, so we provide a stand-in for it
 * that just renders its children without imposing any restrictions.
 */

var StrictMode = Fragment;

var index = {
	useState: useState,
	useReducer: useReducer,
	useEffect: useEffect,
	useLayoutEffect: useLayoutEffect,
	useRef: useRef,
	useImperativeHandle: useImperativeHandle,
	useMemo: useMemo,
	useCallback: useCallback,
	useContext: useContext,
	useDebugValue: useDebugValue,
	version: version,
	Children: Children,
	render: render$1,
	hydrate: hydrate$1,
	unmountComponentAtNode: unmountComponentAtNode,
	createPortal: createPortal,
	createElement: createElement,
	createContext: createContext,
	createFactory: createFactory,
	cloneElement: cloneElement$1,
	createRef: createRef,
	Fragment: Fragment,
	isValidElement: isValidElement,
	findDOMNode: findDOMNode,
	Component: Component,
	PureComponent: PureComponent,
	memo: memo,
	forwardRef: forwardRef,
	unstable_batchedUpdates: unstable_batchedUpdates,
	StrictMode: StrictMode,
	Suspense: Suspense,
	SuspenseList: SuspenseList,
	lazy: lazy,
	__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
};

export default index;
export {
	version,
	Children,
	render$1 as render,
	hydrate$1 as hydrate,
	unmountComponentAtNode,
	createPortal,
	createFactory,
	cloneElement$1 as cloneElement,
	isValidElement,
	findDOMNode,
	PureComponent,
	memo,
	forwardRef,
	unstable_batchedUpdates,
	StrictMode,
	Suspense,
	SuspenseList,
	lazy,
	__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
	unstable_ImmediatePriority,
	unstable_UserBlockingPriority,
	unstable_NormalPriority,
	unstable_LowPriority,
	unstable_IdlePriority,
	unstable_runWithPriority,
	unstable_now,
};
//# sourceMappingURL=compat.module.js.map
