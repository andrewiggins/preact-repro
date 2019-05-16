var EMPTY_OBJ = {};
var EMPTY_ARR = [];
var IS_NON_DIMENSIONAL = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|^--/i;

/**
 * Assign properties from `props` to `obj`
 * @template O, P The obj and props types
 * @param {O} obj The object to copy properties to
 * @param {P} props The object to copy properties from
 * @returns {O & P}
 */
function assign(obj, props) {
  for (var i in props) { obj[i] = props[i]; }

  return (
    /** @type {O & P} */
    obj
  );
}
/**
 * Remove a child node from its parent if attached. This is a workaround for
 * IE11 which doesn't support `Element.prototype.remove()`. Using this function
 * is smaller than including a dedicated polyfill.
 * @param {Node} node The node to remove
 */

function removeNode(node) {
  var parentNode = node.parentNode;
  if (parentNode) { parentNode.removeChild(node); }
}

/** @type {import('./index').Options}  */
var options = {};

/**
  * Create an virtual node (used for JSX)
  * @param {import('./internal').VNode["type"]} type The node name or Component
  * constructor for this virtual node
  * @param {object | null | undefined} [props] The properties of the virtual node
  * @param {Array<import('.').ComponentChildren>} [children] The children of the virtual node
  * @returns {import('./internal').VNode}
  */

function createElement(type, props, children) {
  var arguments$1 = arguments;

  props = assign({}, props);

  if (arguments.length > 3) {
    children = [children];

    for (var i = 3; i < arguments.length; i++) {
      children.push(arguments$1[i]);
    }
  }

  if (children != null) {
    props.children = children;
  } // "type" may be undefined during development. The check is needed so that
  // we can display a nice error message with our debug helpers


  if (type != null && type.defaultProps != null) {
    for (var i$1 in type.defaultProps) {
      if (props[i$1] === undefined) { props[i$1] = type.defaultProps[i$1]; }
    }
  }

  var ref = props.ref;
  var key = props.key;
  if (ref != null) { delete props.ref; }
  if (key != null) { delete props.key; }
  return createVNode(type, props, key, ref);
}
/**
 * Create a VNode (used internally by Preact)
 * @param {import('./internal').VNode["type"]} type The node name or Component
 * Constructor for this virtual node
 * @param {object | string | number | null} props The properites of this virtual node.
 * If this virtual node represents a text node, this is the text of the node (string or number).
 * @param {string | number | null} key The key for this virtual node, used when
 * diffing it against its children
 * @param {import('./internal').VNode["ref"]} ref The ref property that will
 * receive a reference to its created child
 * @returns {import('./internal').VNode}
 */

function createVNode(type, props, key, ref) {
  // V8 seems to be better at detecting type shapes if the object is allocated from the same call site
  // Do not inline into createElement and coerceToVNode!
  var vnode = {
    type: type,
    props: props,
    key: key,
    ref: ref,
    _children: null,
    _dom: null,
    _lastDomChild: null,
    _component: null
  };
  vnode._self = vnode;
  if (options.vnode) { options.vnode(vnode); }
  return vnode;
}
function createRef() {
  return {};
}
function Fragment() {}
/**
 * Coerce an untrusted value into a VNode
 * Specifically, this should be used anywhere a user could provide a boolean, string, or number where
 * a VNode or Component is desired instead
 * @param {boolean | string | number | import('./internal').VNode} possibleVNode A possible VNode
 * @returns {import('./internal').VNode | null}
 */

function coerceToVNode(possibleVNode) {
  if (possibleVNode == null || typeof possibleVNode === 'boolean') { return null; }

  if (typeof possibleVNode === 'string' || typeof possibleVNode === 'number') {
    return createVNode(null, possibleVNode, null, null);
  }

  if (Array.isArray(possibleVNode)) {
    return createElement(Fragment, null, possibleVNode);
  } // Clone vnode if it has already been used. ceviche/#57


  if (possibleVNode._dom != null || possibleVNode._component != null) {
    var vnode = createVNode(possibleVNode.type, possibleVNode.props, possibleVNode.key, null);
    vnode._dom = possibleVNode._dom;
    return vnode;
  }

  return possibleVNode;
}

/**
 * Base Component class. Provides `setState()` and `forceUpdate()`, which
 * trigger rendering
 * @param {object} props The initial component props
 * @param {object} context The initial context from parent components'
 * getChildContext
 */

function Component(props, context) {
  this.props = props;
  this.context = context; // this.constructor // When component is functional component, this is reset to functional component
  // if (this.state==null) this.state = {};
  // this.state = {};
  // this._dirty = true;
  // this._renderCallbacks = []; // Only class components
  // Other properties that Component will have set later,
  // shown here as commented out for quick reference
  // this.base = null;
  // this._context = null;
  // this._ancestorComponent = null; // Always set right after instantiation
  // this._vnode = null;
  // this._nextState = null; // Only class components
  // this._prevVNode = null;
  // this._processingException = null; // Always read, set only when handling error
  // this._pendingError = null; // Always read, set only when handling error. This is used to indicate at diffTime to set _processingException
}
/**
 * Update component state and schedule a re-render.
 * @param {object | ((s: object, p: object) => object)} update A hash of state
 * properties to update with new values or a function that given the current
 * state and props returns a new partial state
 * @param {() => void} [callback] A function to be called once component state is
 * updated
 */

Component.prototype.setState = function (update, callback) {
  // only clone state when copying to nextState the first time.
  var s = this._nextState !== this.state && this._nextState || (this._nextState = assign({}, this.state)); // if update() mutates state in-place, skip the copy:

  if (typeof update !== 'function' || (update = update(s, this.props))) {
    assign(s, update);
  } // Skip update if updater function returned null


  if (update == null) { return; }

  if (this._vnode) {
    if (callback) { this._renderCallbacks.push(callback); }
    enqueueRender(this);
  }
};
/**
 * Immediately perform a synchronous re-render of the component
 * @param {() => void} [callback] A function to be called after component is
 * re-renderd
 */


Component.prototype.forceUpdate = function (callback) {
  var vnode = this._vnode,
      dom = this._vnode._dom,
      parentDom = this._parentDom;

  if (parentDom) {
    // Set render mode so that we can differantiate where the render request
    // is coming from. We need this because forceUpdate should never call
    // shouldComponentUpdate
    var force = callback !== false;
    var mounts = [];
    dom = diff(parentDom, vnode, vnode, this._context, parentDom.ownerSVGElement !== undefined, null, mounts, this._ancestorComponent, force, dom);

    if (dom != null && dom.parentNode !== parentDom) {
      parentDom.appendChild(dom);
    }

    commitRoot(mounts, vnode);
  }

  if (callback) { callback(); }
};
/**
 * Accepts `props` and `state`, and returns a new Virtual DOM tree to build.
 * Virtual DOM is generally constructed via [JSX](http://jasonformat.com/wtf-is-jsx).
 * @param {object} props Props (eg: JSX attributes) received from parent
 * element/component
 * @param {object} state The component's current state
 * @param {object} context Context object, as returned by the nearest
 * ancestor's `getChildContext()`
 * @returns {import('./index').ComponentChildren | void}
 */


Component.prototype.render = Fragment;
/**
 * The render queue
 * @type {Array<import('./internal').Component>}
 */

var q = [];
/**
 * Asynchronously schedule a callback
 * @type {(cb) => void}
 */

var defer = typeof Promise == 'function' ? Promise.prototype.then.bind(Promise.resolve()) : setTimeout;
/*
 * The value of `Component.debounce` must asynchronously invoke the passed in callback. It is
 * important that contributors to Preact can consistenly reason about what calls to `setState`, etc.
 * do, and when their effects will be applied. See the links below for some further reading on designing
 * asynchronous APIs.
 * * [Designing APIs for Asynchrony](https://blog.izs.me/2013/08/designing-apis-for-asynchrony)
 * * [Callbacks synchronous and asynchronous](https://blog.ometer.com/2011/07/24/callbacks-synchronous-and-asynchronous/)
 */

/**
 * Enqueue a rerender of a component
 * @param {import('./internal').Component} c The component to rerender
 */

function enqueueRender(c) {
  if (!c._dirty && (c._dirty = true) && q.push(c) === 1) {
    (options.debounceRendering || defer)(process);
  }
}
/** Flush the render queue by rerendering all queued components */

function process() {
  var p;
  q.sort(function (a, b) { return b._depth - a._depth; });

  while (p = q.pop()) {
    // forceUpdate's callback argument is reused here to indicate a non-forced update.
    if (p._dirty) { p.forceUpdate(false); }
  }
}

/**
 * Diff the children of a virtual node
 * @param {import('../internal').PreactElement} parentDom The DOM element whose
 * children are being diffed
 * @param {import('../internal').VNode} newParentVNode The new virtual
 * node whose children should be diff'ed against oldParentVNode
 * @param {import('../internal').VNode} oldParentVNode The old virtual
 * node whose children should be diff'ed against newParentVNode
 * @param {object} context The current context object
 * @param {boolean} isSvg Whether or not this DOM node is an SVG node
 * @param {Array<import('../internal').PreactElement>} excessDomChildren
 * @param {Array<import('../internal').Component>} mounts The list of components
 * which have mounted
 * @param {import('../internal').Component} ancestorComponent The direct parent
 * component to the ones being diffed
 * @param {Node | Text} oldDom The current attached DOM
 * element any new dom elements should be placed around. Likely `null` on first
 * render (except when hydrating). Can be a sibling DOM element when diffing
 * Fragments that have siblings. In most cases, it starts out as `oldChildren[0]._dom`.
 */

function diffChildren(parentDom, newParentVNode, oldParentVNode, context, isSvg, excessDomChildren, mounts, ancestorComponent, oldDom) {
  var childVNode, i, j, oldVNode, newDom, sibDom;
  var newChildren = newParentVNode._children || toChildArray(newParentVNode.props.children, newParentVNode._children = [], coerceToVNode, true); // This is a compression of oldParentVNode!=null && oldParentVNode != EMPTY_OBJ && oldParentVNode._children || EMPTY_ARR
  // as EMPTY_OBJ._children should be `undefined`.

  var oldChildren = oldParentVNode && oldParentVNode._children || EMPTY_ARR;
  var oldChildrenLength = oldChildren.length;
  var oldChild; // Only in very specific places should this logic be invoked (top level `render` and `diffElementNodes`).
  // I'm using `EMPTY_OBJ` to signal when `diffChildren` is invoked in these situations. I can't use `null`
  // for this purpose, because `null` is a valid value for `oldDom` which can mean to skip to this logic
  // (e.g. if mounting a new tree in which the old DOM should be ignored (usually for Fragments).

  if (oldDom == EMPTY_OBJ) {
    oldDom = null;

    if (excessDomChildren != null) {
      for (i = 0; !oldDom && i < excessDomChildren.length; i++) {
        oldDom = excessDomChildren[i];
      }
    } else {
      for (i = 0; !oldDom && i < oldChildrenLength; i++) {
        oldDom = oldChildren[i] && oldChildren[i]._dom;
        oldChild = oldChildren[i];
      }
    }
  }

  for (i = 0; i < newChildren.length; i++) {
    childVNode = newChildren[i] = coerceToVNode(newChildren[i]);

    if (childVNode != null) {
      // Check if we find a corresponding element in oldChildren.
      // If found, delete the array item by setting to `undefined`.
      // We use `undefined`, as `null` is reserved for empty placeholders
      // (holes).
      oldVNode = oldChildren[i];

      if (oldVNode === null || oldVNode && (oldVNode.key != null ? childVNode.key === oldVNode.key : childVNode.key == null && childVNode.type === oldVNode.type)) {
        oldChildren[i] = undefined;
      } else {
        // Either oldVNode === undefined or oldChildrenLength > 0,
        // so after this loop oldVNode == null or oldVNode is a valid value.
        for (j = 0; j < oldChildrenLength; j++) {
          oldVNode = oldChildren[j];

          if (oldVNode && (oldVNode.key != null ? childVNode.key === oldVNode.key : childVNode.key == null && childVNode.type === oldVNode.type)) {
            oldChildren[j] = undefined;

            // if (oldChildrenLength !== newChildren.length && oldVNode.type !== (oldChild && oldChild.type)) {
            //   oldDom = oldVNode._dom;
            // }

            break;
          }

          oldVNode = null;
        }
      } // Morph the old element into the new one, but don't append it to the dom yet


      newDom = diff(parentDom, childVNode, oldVNode, context, isSvg, excessDomChildren, mounts, ancestorComponent, null, oldDom); // Only proceed if the vnode has not been unmounted by `diff()` above.

      if (newDom != null) {
        if (childVNode._lastDomChild != null) {
          // Only Fragments or components that return Fragment like VNodes will
          // have a non-null _lastDomChild. Continue the diff from the end of
          // this Fragment's DOM tree.
          newDom = childVNode._lastDomChild;
        } else if (excessDomChildren == oldVNode || newDom != oldDom || newDom.parentNode == null) {
          // NOTE: excessDomChildren==oldVNode above:
          // This is a compression of excessDomChildren==null && oldVNode==null!
          // The values only have the same type when `null`.
          outer: if (oldDom == null || oldDom.parentNode !== parentDom) {
            parentDom.appendChild(newDom);
          } else {
            // `j<oldChildrenLength; j+=2` is an alternative to `j++<oldChildrenLength/2`
            for (sibDom = oldDom, j = 0; (sibDom = sibDom.nextSibling) && j < oldChildrenLength; j += 2) {
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
  } // Remove children that are not part of any vnode. Only used by `hydrate`


  if (excessDomChildren != null && newParentVNode.type !== Fragment) { for (i = excessDomChildren.length; i--;) { if (excessDomChildren[i] != null) { removeNode(excessDomChildren[i]); } } } // Remove remaining oldChildren if there are any.

  for (i = oldChildrenLength; i--;) { if (oldChildren[i] != null) { unmount(oldChildren[i], ancestorComponent); } }
}
/**
 * Flatten a virtual nodes children to a single dimensional array
 * @param {import('../index').ComponentChildren} children The unflattened
 * children of a virtual node
 * @param {Array<import('../internal').VNode | null>} [flattened] An flat array of children to modify
 * @param {typeof import('../create-element').coerceToVNode} [map] Function that
 * will be applied on each child if the `vnode` is not `null`
 * @param {boolean} [keepHoles] wether to coerce `undefined` to `null` or not.
 * This is needed for Components without children like `<Foo />`.
 */

function toChildArray(children, flattened, map, keepHoles) {
  if (flattened == null) { flattened = []; }

  if (children == null || typeof children === 'boolean') {
    if (keepHoles) { flattened.push(null); }
  } else if (Array.isArray(children)) {
    for (var i = 0; i < children.length; i++) {
      toChildArray(children[i], flattened, map, keepHoles);
    }
  } else {
    flattened.push(map ? map(children) : children);
  }

  return flattened;
}

/**
 * Diff the old and new properties of a VNode and apply changes to the DOM node
 * @param {import('../internal').PreactElement} dom The DOM node to apply
 * changes to
 * @param {object} newProps The new props
 * @param {object} oldProps The old props
 * @param {boolean} isSvg Whether or not this node is an SVG node
 */

function diffProps(dom, newProps, oldProps, isSvg) {
  var i;
  var keys = Object.keys(newProps).sort();

  for (i = 0; i < keys.length; i++) {
    var k = keys[i];

    if (k !== 'children' && k !== 'key' && (!oldProps || (k === 'value' || k === 'checked' ? dom : oldProps)[k] !== newProps[k])) {
      setProperty(dom, k, newProps[k], oldProps[k], isSvg);
    }
  }

  for (i in oldProps) {
    if (i !== 'children' && i !== 'key' && !(i in newProps)) {
      setProperty(dom, i, null, oldProps[i], isSvg);
    }
  }
}
var CAMEL_REG = /[A-Z]/g;
var XLINK_NS = 'http://www.w3.org/1999/xlink';
/**
 * Set a property value on a DOM node
 * @param {import('../internal').PreactElement} dom The DOM node to modify
 * @param {string} name The name of the property to set
 * @param {*} value The value to set the property to
 * @param {*} oldValue The old value the property had
 * @param {boolean} isSvg Whether or not this DOM node is an SVG node or not
 */

function setProperty(dom, name, value, oldValue, isSvg) {
  name = isSvg ? name === 'className' ? 'class' : name : name === 'class' ? 'className' : name;

  if (name === 'style') {
    var set = assign(assign({}, oldValue), value);

    for (var i in set) {
      if ((value || EMPTY_OBJ)[i] === (oldValue || EMPTY_OBJ)[i]) {
        continue;
      }

      dom.style.setProperty(i[0] === '-' && i[1] === '-' ? i : i.replace(CAMEL_REG, '-$&'), value && i in value ? typeof set[i] === 'number' && IS_NON_DIMENSIONAL.test(i) === false ? set[i] + 'px' : set[i] : '');
    }
  } // Benchmark for comparison: https://esbench.com/bench/574c954bdb965b9a00965ac6
  else if (name[0] === 'o' && name[1] === 'n') {
      var useCapture = name !== (name = name.replace(/Capture$/, ''));
      var nameLower = name.toLowerCase();
      name = (nameLower in dom.ownerDocument.defaultView ? nameLower : name).slice(2);

      if (value) {
        if (!oldValue) { dom.addEventListener(name, eventProxy, useCapture); }
      } else {
        dom.removeEventListener(name, eventProxy, useCapture);
      }

      (dom._listeners || (dom._listeners = {}))[name] = value;
    } else if (name !== 'list' && name !== 'tagName' && !isSvg && name in dom) {
      dom[name] = value == null ? '' : value;
    } else if (typeof value !== 'function' && name !== 'dangerouslySetInnerHTML') {
      if (name !== (name = name.replace(/^xlink:?/, ''))) {
        if (value == null || value === false) {
          dom.removeAttributeNS(XLINK_NS, name.toLowerCase());
        } else {
          dom.setAttributeNS(XLINK_NS, name.toLowerCase(), value);
        }
      } else if (value == null || value === false) {
        dom.removeAttribute(name);
      } else {
        dom.setAttribute(name, value);
      }
    }
}
/**
 * Proxy an event to hooked event handlers
 * @param {Event} e The event object from the browser
 * @private
 */


function eventProxy(e) {
  return this._listeners[e.type](options.event ? options.event(e) : e);
}

/**
 * Diff two virtual nodes and apply proper changes to the DOM
 * @param {import('../internal').PreactElement} parentDom The parent of the DOM element
 * @param {import('../internal').VNode | null} newVNode The new virtual node
 * @param {import('../internal').VNode | null} oldVNode The old virtual node
 * @param {object} context The current context object
 * @param {boolean} isSvg Whether or not this element is an SVG node
 * @param {Array<import('../internal').PreactElement>} excessDomChildren
 * @param {Array<import('../internal').Component>} mounts A list of newly
 * mounted components
 * @param {import('../internal').Component | null} ancestorComponent The direct
 * parent component
 * @param {Element | Text} oldDom The current attached DOM
 * element any new dom elements should be placed around. Likely `null` on first
 * render (except when hydrating). Can be a sibling DOM element when diffing
 * Fragments that have siblings. In most cases, it starts out as `oldChildren[0]._dom`.
 */

function diff(parentDom, newVNode, oldVNode, context, isSvg, excessDomChildren, mounts, ancestorComponent, force, oldDom) {
  // If the previous type doesn't match the new type we drop the whole subtree
  if (oldVNode == null || newVNode == null || oldVNode.type !== newVNode.type || oldVNode.key !== newVNode.key) {
    if (oldVNode != null) { unmount(oldVNode, ancestorComponent); }
    if (newVNode == null) { return null; }
    oldVNode = EMPTY_OBJ;
  }

  var c,
      tmp,
      isNew,
      oldProps,
      oldState,
      snapshot,
      newType = newVNode.type,
      clearProcessingException; // When passing through createElement it assigns the object
  // ref on _self, to prevent JSON Injection we check if this attribute
  // is equal.

  if (newVNode._self !== newVNode) { return null; }
  if (tmp = options.diff) { tmp(newVNode); }

  try {
    outer: if (oldVNode.type === Fragment || newType === Fragment) {
      // Passing the ancestorComponent instead of c here is needed for catchErrorInComponent
      // to properly traverse upwards through fragments to find a parent Suspense
      diffChildren(parentDom, newVNode, oldVNode, context, isSvg, excessDomChildren, mounts, ancestorComponent, oldDom); // Mark dom as empty in case `_children` is any empty array. If it isn't
      // we'll set `dom` to the correct value just a few lines later.

      var i = newVNode._children.length;

      if (i && (tmp = newVNode._children[0]) != null) {
        newVNode._dom = tmp._dom; // If the last child is a Fragment, use _lastDomChild, else use _dom
        // We have no guarantee that the last child rendered something into the
        // dom, so we iterate backwards to find the last child with a dom node.

        while (i--) {
          tmp = newVNode._children[i];

          if (newVNode._lastDomChild = tmp && (tmp._lastDomChild || tmp._dom)) {
            break;
          }
        }
      }
    } else if (typeof newType === 'function') {
      // Necessary for createContext api. Setting this property will pass
      // the context value as `this.context` just for this component.
      tmp = newType.contextType;
      var provider = tmp && context[tmp._id];
      var cctx = tmp ? provider ? provider.props.value : tmp._defaultValue : context; // Get component and set it to `c`

      if (oldVNode._component) {
        c = newVNode._component = oldVNode._component;
        clearProcessingException = c._processingException = c._pendingError;
        newVNode._dom = oldVNode._dom;
      } else {
        // Instantiate the new component
        if (newType.prototype && newType.prototype.render) {
          newVNode._component = c = new newType(newVNode.props, cctx); // eslint-disable-line new-cap
        } else {
          newVNode._component = c = new Component(newVNode.props, cctx);
          c.constructor = newType;
          c.render = doRender;
        }

        c._ancestorComponent = ancestorComponent;
        if (provider) { provider.sub(c); }
        c.props = newVNode.props;
        if (!c.state) { c.state = {}; }
        c.context = cctx;
        c._context = context;
        isNew = c._dirty = true;
        c._renderCallbacks = [];
      }

      c._vnode = newVNode; // Invoke getDerivedStateFromProps

      if (c._nextState == null) {
        c._nextState = c.state;
      }

      if (newType.getDerivedStateFromProps != null) {
        assign(c._nextState == c.state ? c._nextState = assign({}, c._nextState) : c._nextState, newType.getDerivedStateFromProps(newVNode.props, c._nextState));
      } // Invoke pre-render lifecycle methods


      if (isNew) {
        if (newType.getDerivedStateFromProps == null && c.componentWillMount != null) { c.componentWillMount(); }
        if (c.componentDidMount != null) { mounts.push(c); }
      } else {
        if (newType.getDerivedStateFromProps == null && force == null && c.componentWillReceiveProps != null) {
          c.componentWillReceiveProps(newVNode.props, cctx);
        }

        if (!force && c.shouldComponentUpdate != null && c.shouldComponentUpdate(newVNode.props, c._nextState, cctx) === false) {
          c.props = newVNode.props;
          c.state = c._nextState;
          c._dirty = false;
          newVNode._lastDomChild = oldVNode._lastDomChild;
          break outer;
        }

        if (c.componentWillUpdate != null) {
          c.componentWillUpdate(newVNode.props, c._nextState, cctx);
        }
      }

      oldProps = c.props;
      oldState = c.state;
      c.context = cctx;
      c.props = newVNode.props;
      c.state = c._nextState;
      if (tmp = options.render) { tmp(newVNode); }
      var prev = c._prevVNode || null;
      c._dirty = false;
      var vnode = c._prevVNode = coerceToVNode(c.render(c.props, c.state, c.context));

      if (c.getChildContext != null) {
        context = assign(assign({}, context), c.getChildContext());
      }

      if (!isNew && c.getSnapshotBeforeUpdate != null) {
        snapshot = c.getSnapshotBeforeUpdate(oldProps, oldState);
      }

      c._depth = ancestorComponent ? (ancestorComponent._depth || 0) + 1 : 0;
      c.base = newVNode._dom = diff(parentDom, vnode, prev, context, isSvg, excessDomChildren, mounts, c, null, oldDom);

      if (vnode != null) {
        // If this component returns a Fragment (or another component that
        // returns a Fragment), then _lastDomChild will be non-null,
        // informing `diffChildren` to diff this component's VNode like a Fragemnt
        newVNode._lastDomChild = vnode._lastDomChild;
      }

      c._parentDom = parentDom;
      if (tmp = newVNode.ref) { applyRef(tmp, c, ancestorComponent); }

      while (tmp = c._renderCallbacks.pop()) { tmp.call(c); } // Don't call componentDidUpdate on mount or when we bailed out via
      // `shouldComponentUpdate`


      if (!isNew && oldProps != null && c.componentDidUpdate != null) {
        c.componentDidUpdate(oldProps, oldState, snapshot);
      }
    } else {
      newVNode._dom = diffElementNodes(oldVNode._dom, newVNode, oldVNode, context, isSvg, excessDomChildren, mounts, ancestorComponent);

      if ((tmp = newVNode.ref) && oldVNode.ref !== tmp) {
        applyRef(tmp, newVNode._dom, ancestorComponent);
      }
    }

    if (clearProcessingException) {
      c._pendingError = c._processingException = null;
    }

    if (tmp = options.diffed) { tmp(newVNode); }
  } catch (e) {
    catchErrorInComponent(e, ancestorComponent);
  }

  return newVNode._dom;
}
function commitRoot(mounts, root) {
  var c;

  while (c = mounts.pop()) {
    try {
      c.componentDidMount();
    } catch (e) {
      catchErrorInComponent(e, c._ancestorComponent);
    }
  }

  if (options.commit) { options.commit(root); }
}
/**
 * Diff two virtual nodes representing DOM element
 * @param {import('../internal').PreactElement} dom The DOM element representing
 * the virtual nodes being diffed
 * @param {import('../internal').VNode} newVNode The new virtual node
 * @param {import('../internal').VNode} oldVNode The old virtual node
 * @param {object} context The current context object
 * @param {boolean} isSvg Whether or not this DOM node is an SVG node
 * @param {*} excessDomChildren
 * @param {Array<import('../internal').Component>} mounts An array of newly
 * mounted components
 * @param {import('../internal').Component} ancestorComponent The parent
 * component to the ones being diffed
 * @returns {import('../internal').PreactElement}
 */

function diffElementNodes(dom, newVNode, oldVNode, context, isSvg, excessDomChildren, mounts, ancestorComponent) {
  var i;
  var oldProps = oldVNode.props;
  var newProps = newVNode.props; // Tracks entering and exiting SVG namespace when descending through the tree.

  isSvg = newVNode.type === 'svg' || isSvg;

  if (dom == null && excessDomChildren != null) {
    for (i = 0; i < excessDomChildren.length; i++) {
      var child = excessDomChildren[i];

      if (child != null && (newVNode.type === null ? child.nodeType === 3 : child.localName === newVNode.type)) {
        dom = child;
        excessDomChildren[i] = null;
        break;
      }
    }
  }

  if (dom == null) {
    if (newVNode.type === null) {
      return document.createTextNode(newProps);
    }

    dom = isSvg ? document.createElementNS('http://www.w3.org/2000/svg', newVNode.type) : document.createElement(newVNode.type); // we created a new parent, so none of the previously attached children can be reused:

    excessDomChildren = null;
  }

  if (newVNode.type === null) {
    if (oldProps !== newProps) {
      dom.data = newProps;
    }
  } else {
    if (excessDomChildren != null && dom.childNodes != null) {
      excessDomChildren = EMPTY_ARR.slice.call(dom.childNodes);
    }

    if (newVNode !== oldVNode) {
      // if we're hydrating, use the element's attributes as its current props:
      if (oldProps == null) {
        oldProps = {};

        if (excessDomChildren != null) {
          var name;

          for (i = 0; i < dom.attributes.length; i++) {
            name = dom.attributes[i].name;
            oldProps[name == 'class' && newProps.className ? 'className' : name] = dom.attributes[i].value;
          }
        }
      }

      var oldHtml = oldProps.dangerouslySetInnerHTML;
      var newHtml = newProps.dangerouslySetInnerHTML;

      if (newHtml || oldHtml) {
        // Avoid re-applying the same '__html' if it did not changed between re-render
        if (!newHtml || !oldHtml || newHtml.__html != oldHtml.__html) {
          dom.innerHTML = newHtml && newHtml.__html || '';
        }
      }

      if (newProps.multiple) {
        dom.multiple = newProps.multiple;
      }

      diffChildren(dom, newVNode, oldVNode, context, newVNode.type === 'foreignObject' ? false : isSvg, excessDomChildren, mounts, ancestorComponent, EMPTY_OBJ);
      diffProps(dom, newProps, oldProps, isSvg);
    }
  }

  return dom;
}
/**
 * Invoke or update a ref, depending on whether it is a function or object ref.
 * @param {object|function} [ref=null]
 * @param {any} [value]
 */


function applyRef(ref, value, ancestorComponent) {
  try {
    if (typeof ref == 'function') { ref(value); }else { ref.current = value; }
  } catch (e) {
    catchErrorInComponent(e, ancestorComponent);
  }
}
/**
 * Unmount a virtual node from the tree and apply DOM changes
 * @param {import('../internal').VNode} vnode The virtual node to unmount
 * @param {import('../internal').Component} ancestorComponent The parent
 * component to this virtual node
 * @param {boolean} [skipRemove] Flag that indicates that a parent node of the
 * current element is already detached from the DOM.
 */

function unmount(vnode, ancestorComponent, skipRemove) {
  var r;
  if (options.unmount) { options.unmount(vnode); }

  if (r = vnode.ref) {
    applyRef(r, null, ancestorComponent);
  }

  var dom;

  if (!skipRemove && vnode._lastDomChild == null) {
    skipRemove = (dom = vnode._dom) != null;
  }

  vnode._dom = vnode._lastDomChild = null;

  if ((r = vnode._component) != null) {
    if (r.componentWillUnmount) {
      try {
        r.componentWillUnmount();
      } catch (e) {
        catchErrorInComponent(e, ancestorComponent);
      }
    }

    r.base = r._parentDom = null;
    if (r = r._prevVNode) { unmount(r, ancestorComponent, skipRemove); }
  } else if (r = vnode._children) {
    for (var i = 0; i < r.length; i++) {
      if (r[i]) { unmount(r[i], ancestorComponent, skipRemove); }
    }
  }

  if (dom != null) { removeNode(dom); }
}
/** The `.render()` method for a PFC backing instance. */

function doRender(props, state, context) {
  return this.constructor(props, context);
}
/**
 * Find the closest error boundary to a thrown error and call it
 * @param {object} error The thrown value
 * @param {import('../internal').Component} component The first ancestor
 * component check for error boundary behaviors
 */


function catchErrorInComponent(error, component) {
  // thrown Promises are meant to suspend...
  var isSuspend = typeof error.then === 'function';
  var suspendingComponent = component;

  for (; component; component = component._ancestorComponent) {
    if (!component._processingException) {
      try {
        if (isSuspend) {
          if (component._childDidSuspend) {
            component._childDidSuspend(error);
          } else {
            continue;
          }
        } else if (component.constructor.getDerivedStateFromError != null) {
          component.setState(component.constructor.getDerivedStateFromError(error));
        } else if (component.componentDidCatch != null) {
          component.componentDidCatch(error);
        } else {
          continue;
        }

        return enqueueRender(component._pendingError = component);
      } catch (e) {
        error = e;
        isSuspend = false;
      }
    }
  }

  if (isSuspend) {
    return catchErrorInComponent(new Error('Missing Suspense'), suspendingComponent);
  }

  throw error;
}

/**
 * Render a Preact virtual node into a DOM element
 * @param {import('./index').ComponentChild} vnode The virtual node to render
 * @param {import('./internal').PreactElement} parentDom The DOM element to
 * render into
 * @param {Element | Text} [replaceNode] Attempt to re-use an
 * existing DOM tree rooted at `replaceNode`
 */

function render(vnode, parentDom, replaceNode) {
  if (options.root) { options.root(vnode, parentDom); }
  var oldVNode = parentDom._prevVNode;
  vnode = createElement(Fragment, null, [vnode]);
  var mounts = [];
  diffChildren(parentDom, replaceNode ? vnode : parentDom._prevVNode = vnode, replaceNode ? undefined : oldVNode, EMPTY_OBJ, parentDom.ownerSVGElement !== undefined, replaceNode ? [replaceNode] : oldVNode ? null : EMPTY_ARR.slice.call(parentDom.childNodes), mounts, vnode, replaceNode || EMPTY_OBJ);
  commitRoot(mounts, vnode);
}
/**
 * Update an existing DOM element with data from a Preact virtual node
 * @param {import('./index').ComponentChild} vnode The virtual node to render
 * @param {import('./internal').PreactElement} parentDom The DOM element to
 * update
 */

function hydrate(vnode, parentDom) {
  parentDom._prevVNode = null;
  render(vnode, parentDom);
}

/**
 * Clones the given VNode, optionally adding attributes/props and replacing its children.
 * @param {import('./internal').VNode} vnode The virtual DOM element to clone
 * @param {object} props Attributes/props to add when cloning
 * @param {Array<import('./index').ComponentChildren>} rest Any additional arguments will be used as replacement children.
 */

function cloneElement(vnode, props) {
  props = assign(assign({}, vnode.props), props);
  if (arguments.length > 2) { props.children = EMPTY_ARR.slice.call(arguments, 2); }
  return createVNode(vnode.type, props, props.key || vnode.key, props.ref || vnode.ref);
}

var i = 0;
/**
 *
 * @param {any} defaultValue
 */

function createContext(defaultValue) {
  var ctx = {};
  var context = {
    _id: '__cC' + i++,
    _defaultValue: defaultValue,

    Consumer: function Consumer(props, context) {
      return props.children(context);
    },

    Provider: function Provider(props) {
      var this$1 = this;

      if (!this.getChildContext) {
        var subs = [];

        this.getChildContext = function () {
          ctx[context._id] = this$1;
          return ctx;
        };

        this.shouldComponentUpdate = function (props) {
          subs.some(function (c) {
            // Check if still mounted
            if (c._parentDom) {
              c.context = props.value;
              enqueueRender(c);
            }
          });
        };

        this.sub = function (c) {
          subs.push(c);
          var old = c.componentWillUnmount;

          c.componentWillUnmount = function () {
            subs.splice(subs.indexOf(c), 1);
            old && old.call(c);
          };
        };
      }

      return props.children;
    }

  };
  context.Consumer.contextType = context;
  return context;
}

function Suspense(props) {}
Suspense.prototype = new Component();
/**
 * @param {Promise} promise The thrown promise
 */

Suspense.prototype._childDidSuspend = function (promise) {
  var this$1 = this;

  this.setState({
    _loading: true
  });

  var cb = function () {
    this$1.setState({
      _loading: false
    });
  }; // Suspense ignores errors thrown in Promises as this should be handled by user land code


  promise.then(cb, cb);
};

Suspense.prototype.render = function (props, state) {
  return state._loading ? props.fallback : props.children;
};

function lazy(loader) {
  var prom;
  var component;
  var error;

  function Lazy(props) {
    if (!prom) {
      prom = loader();
      prom.then(function (exports) {
        component = exports.default;
      }, function (e) {
        error = e;
      });
    }

    if (error) {
      throw error;
    }

    if (!component) {
      throw prom;
    }

    return createElement(component, props);
  }

  Lazy.displayName = 'Lazy';
  return Lazy;
}

export { render, hydrate, createElement, createElement as h, Fragment, createRef, Component, cloneElement, createContext, toChildArray, Suspense, lazy, options };
//# sourceMappingURL=preact.module.js.map
