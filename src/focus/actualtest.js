import { createElement, render } from "preact";
import { expect } from "./expect";

/* @jsx createElement */

const List = ({ children }) => <div>{children}</div>;
const ListItem = ({ children }) => <span>{children}</span>;
const Input = () => <input type="text" />;

let scratch = document.createElement("div");
document.body.appendChild(scratch);

function focusInput() {
  if (!scratch) return;

  const input = scratch.querySelector("input");
  input.value = "a word";
  input.focus();
  input.setSelectionRange(2, 5);

  expect(document.activeElement).to.equal(input);

  return input;
}

function validateFocus(input, message) {
  // Check `nodeName` first to make cli output less spammy
  expect(document.activeElement.nodeName).to.equal(input.nodeName, message);
  expect(document.activeElement).to.equal(input, message);
  expect(input.selectionStart).to.equal(2);
  expect(input.selectionEnd).to.equal(5);
}

export function run() {
  render(
    <List>
      <Input />
    </List>,
    scratch
  );

  let input = focusInput();

  render(
    <List>
      <ListItem>1</ListItem>
      <Input />
    </List>,
    scratch
  );
  validateFocus(input, "insert sibling before");

  // input = focusInput();

  render(
    <List>
      <ListItem>1</ListItem>
      <Input />
      <ListItem>2</ListItem>
    </List>,
    scratch
  );
  validateFocus(input, "insert sibling after");

  // input = focusInput();

  render(
    <List>
      <ListItem>1</ListItem>
      <Input />
      <ListItem>2</ListItem>
      <ListItem>3</ListItem>
    </List>,
    scratch
  );
  validateFocus(input, "insert sibling after again");

  // input = focusInput();

  render(
    <List>
      <ListItem>0</ListItem>
      <ListItem>1</ListItem>
      <Input />
      <ListItem>2</ListItem>
      <ListItem>3</ListItem>
    </List>,
    scratch
  );
  validateFocus(input, "insert sibling before again");

  render(
    <List>
      <ListItem>-1</ListItem>
      <ListItem>0</ListItem>
      <ListItem>1</ListItem>
      <Input />
      <ListItem>2</ListItem>
      <ListItem>3</ListItem>
    </List>,
    scratch
  );
  validateFocus(input, "insert sibling before again");

  render(
    <List>
      <ListItem>-2</ListItem>
      <ListItem>-1</ListItem>
      <ListItem>0</ListItem>
      <ListItem>1</ListItem>
      <Input />
      <ListItem>2</ListItem>
      <ListItem>3</ListItem>
    </List>,
    scratch
  );
  validateFocus(input, "insert sibling before again");
}
