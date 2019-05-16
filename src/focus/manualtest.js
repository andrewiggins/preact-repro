import { h, render, Component } from "preact";

/* @jsx h */

const List = ({ children }) => <div>{children}</div>;
const ListItem = ({ children }) => <span>{children}</span>;
const Input = () => <input type="text" />;

let prependItem;
let appendItem;

let i = 0;
let go = () => {
	if ((i = (i + 1) % 2)) {
		prependItem();
	} else {
		appendItem();
	}
};

class App extends Component {
	constructor(props) {
		super(props);

		this.state = {
			before: [0],
			after: [0]
		};

		prependItem = () =>
			this.setState(prev => ({
				before: [prev.before.length, ...prev.before]
			}));

		appendItem = () =>
			this.setState(prev => ({
				after: [...prev.after, prev.after.length]
			}));
	}
	render() {
		return (
			<List>
				{this.state.before.map(i => (
					<ListItem>{i}</ListItem>
				))}
				<Input />
				{this.state.after.map(i => (
					<ListItem>{i}</ListItem>
				))}
			</List>
		);
	}
}

const root = document.createElement("div");
document.body.appendChild(root);

const app = document.createElement("div");
root.appendChild(app);
render(<App />, app);

const prependBtn = document.createElement("button");
prependBtn.textContent = "Prepend item";
prependBtn.onclick = prependItem;
root.appendChild(prependBtn);

const appendBtn = document.createElement("button");
appendBtn.textContent = "Append item";
appendBtn.onclick = appendItem;
root.appendChild(appendBtn);

let intervalId;
const goBtn = document.createElement("button");
goBtn.textContent = "Go!";
goBtn.onclick = () => {
	if (intervalId) {
		intervalId = clearInterval(intervalId);
		goBtn.textContent = "Go!";
	} else {
		intervalId = setInterval(go, 1000);
		goBtn.textContent = "Stop!";
	}
};
root.appendChild(goBtn);
