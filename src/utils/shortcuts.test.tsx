import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { TestContext } from "./testing";

describe("shortcuts", () => {
  it("should open side sheet via shortcut", async () => {
    const { container } = render(<TestContext />);

    await expect(() =>
      screen.findByRole("presentation", { name: "sidesheet" })
    ).rejects.toThrow('Unable to find role="presentation"');

    fireEvent.keyDown(container, { key: "m", code: "KeyM" });

    expect(
      screen.getByRole("presentation", { name: "sidesheet" })
    ).toBeInTheDocument();
  });

  it("should close side sheet via esc key", async () => {
    const { container } = render(<TestContext />);

    await expect(() =>
      screen.findByRole("presentation", { name: "sidesheet" })
    ).rejects.toThrow('Unable to find role="presentation"');

    fireEvent.keyDown(container, { key: "m", code: "KeyM" });

    expect(
      screen.getByRole("presentation", { name: "sidesheet" })
    ).toBeInTheDocument();

    fireEvent.keyDown(screen.getByRole("presentation", { name: "sidesheet" }), {
      key: "Escape",
      code: "Escape",
      keyCode: 27,
      charCode: 27,
    });

    await expect(() =>
      screen.findByRole("presentation", { name: "sidesheet" })
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

  it("should not open task dialog via shortcut when side sheet is open", async () => {
    const { container } = render(<TestContext />);

    await expect(() =>
      screen.findByRole("presentation", { name: "task" })
    ).rejects.toThrow('Unable to find role="presentation"');

    fireEvent.keyDown(container, { key: "m", code: "KeyM" });

    expect(
      screen.getByRole("presentation", { name: "sidesheet" })
    ).toBeInTheDocument();

    fireEvent.keyDown(container, { key: "n", code: "KeyN" });

    await expect(() =>
      screen.findByRole("presentation", { name: "task" })
    ).rejects.toThrow('Unable to find role="presentation"');
  });
});
