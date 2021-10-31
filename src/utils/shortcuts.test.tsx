import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { TestContext } from "./testing";

describe("shortcuts", () => {
  it("should open the menu via shortcut", async () => {
    const { container } = render(<TestContext />);

    await expect(() =>
      screen.findByRole("presentation", { name: "Menu" })
    ).rejects.toThrow('Unable to find role="presentation"');

    fireEvent.keyDown(container, { key: "m", code: "KeyM" });

    expect(
      screen.getByRole("presentation", { name: "Menu" })
    ).toBeInTheDocument();
  });

  it("should close the menu via esc key", async () => {
    const { container } = render(<TestContext />);

    await expect(() =>
      screen.findByRole("presentation", { name: "Menu" })
    ).rejects.toThrow('Unable to find role="presentation"');

    fireEvent.keyDown(container, { key: "m", code: "KeyM" });

    expect(
      screen.getByRole("presentation", { name: "Menu" })
    ).toBeInTheDocument();

    fireEvent.keyDown(screen.getByRole("presentation", { name: "Menu" }), {
      key: "Escape",
      code: "Escape",
      keyCode: 27,
      charCode: 27,
    });

    await expect(() =>
      screen.findByRole("presentation", { name: "Menu" })
    ).rejects.toThrow('Unable to find role="presentation"');
  });

  it("should open task dialog via shortcut", async () => {
    const { container } = render(<TestContext />);

    await expect(() =>
      screen.findByRole("presentation", { name: "task" })
    ).rejects.toThrow('Unable to find role="presentation"');

    fireEvent.keyDown(container, { key: "n", code: "KeyN" });

    expect(
      screen.getByRole("presentation", { name: "task" })
    ).toBeInTheDocument();
  });

  it("should not open task dialog via shortcut when menu is open", async () => {
    const { container } = render(<TestContext />);

    await expect(() =>
      screen.findByRole("presentation", { name: "task" })
    ).rejects.toThrow('Unable to find role="presentation"');

    fireEvent.keyDown(container, { key: "m", code: "KeyM" });

    expect(
      screen.getByRole("presentation", { name: "Menu" })
    ).toBeInTheDocument();

    fireEvent.keyDown(container, { key: "n", code: "KeyN" });

    await expect(() =>
      screen.findByRole("presentation", { name: "task" })
    ).rejects.toThrow('Unable to find role="presentation"');
  });

  it("should focus the search input via shortcut", async () => {
    const { container } = render(<TestContext />);

    fireEvent.keyDown(container, { key: "f", code: "KeyF" });

    await screen.findByRole("search");

    await expect(document.activeElement!.tagName).toBe("INPUT");
  });
});
