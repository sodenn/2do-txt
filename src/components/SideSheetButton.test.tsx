import { fireEvent, render, screen } from "@testing-library/react";
import { TestContext } from "../utils/testing";

describe("SideSheetButton", () => {
  it("should open the menu via mouse click", async () => {
    render(<TestContext />);

    await expect(() =>
      screen.findByRole("presentation", { name: "Menu" })
    ).rejects.toThrow('Unable to find role="presentation"');

    const menuButton = await screen.findByRole("button", {
      name: "Menu",
    });

    fireEvent.click(menuButton);

    expect(
      screen.getByRole("presentation", { name: "Menu" })
    ).toBeInTheDocument();
  });

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
});
