import { createElement, render } from "preact";
import { useState } from "preact/hooks";

// Plain component
const B = () => <p>This is b</p>;

// Component with state which swaps its returned element type
const C = () => {
	const [c, setC] = useState(false);

	// Trigger rerender, without this it will not produce the bug
	if (!c) {
		setC(true);
	}

	// Important that these two elements are of different types,
	// if both are <p /> or <div /> it will not produce the bug
	return c ? <div>data</div> : <p>waiting</p>;
};

// Some wrapper component without its own element,
// could be a higher-order component like connect() or similar
const WrapC = () => <C />;

// Wrapper which swaps between components
const A = () => {
	const [a, setA] = useState(false);

	// Swap to B after we have let C rerender its <div />.
	// If we let C render its <div /> it will somehow end
	// up being an orphan.
	setTimeout(() => setA(true));

	// If we use a plain C here it will work
	// It will also work if we do not swap out C
	return a ? <B /> : <WrapC />;
};

const root = document.createElement("div");
document.body.appendChild(root);
render(<A />, root);
