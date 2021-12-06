import { fireEvent, render, screen } from "@testing-library/react";
import { TestContext } from "../utils/testing";

describe("TaskDialog", () => {
  it("should open task dialog via shortcut", async () => {
    const { container } = render(<TestContext />);

    await expect(() =>
      screen.findByRole("presentation", { name: "Task dialog" })
    ).rejects.toThrow('Unable to find role="presentation"');

    fireEvent.keyDown(container, { key: "n", code: "KeyN" });

    await expect(
      screen.getByRole("presentation", { name: "Task dialog" })
    ).toBeInTheDocument();
  });

  it("should not open task dialog via shortcut when menu is open", async () => {
    const { container } = render(<TestContext />);

    await expect(() =>
      screen.findByRole("presentation", { name: "Task dialog" })
    ).rejects.toThrow('Unable to find role="presentation"');

    fireEvent.keyDown(container, { key: "m", code: "KeyM" });

    expect(
      screen.getByRole("presentation", { name: "Menu" })
    ).toBeInTheDocument();

    fireEvent.keyDown(container, { key: "n", code: "KeyN" });

    await expect(() =>
      screen.findByRole("presentation", { name: "Task dialog" })
    ).rejects.toThrow('Unable to find role="presentation"');
  });
});
