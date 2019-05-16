import { h, render, Component } from "preact";

/** @jsx h */

const Entry = props => (
  <div style={{ padding: "10px" }}>
    {props.children}
    <button onClick={props.add}>Add</button>
  </div>
);

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      values: ["abc"],
      i: 0
    };
  }
  render() {
    return (
      <div>
        {this.state.values.map(v => (
          <Entry
            add={() => this.setState({ values: [...this.state.values, "xyz"] })}
          >
            {v}
          </Entry>
        ))}
        <button onClick={() => this.setState({ i: this.state.i + 1 })}>
          Update
        </button>
        <button>First Button</button>
        <button>Second Button</button>
        <button>Third Button</button>
      </div>
    );
  }
}

render(<App />, document.getElementById("root"));
