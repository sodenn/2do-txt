// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";
import inspector from "inspector";

const debug = inspector.url() !== undefined;

if (debug) {
  jest.setTimeout(9999999);
} else {
  jest.setTimeout(15000);
}
