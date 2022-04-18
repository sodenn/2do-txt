import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TestContext, todoTxt, todoTxtPaths } from "../utils/testing";

describe("SideSheetButton", () => {
  it("should open the menu via mouse click", async () => {
    render(<TestContext text={todoTxt} storage={[todoTxtPaths]} />);

    await screen.findByTestId("page");

    await expect(() =>
      screen.findByRole("presentation", { name: "Menu" })
    ).rejects.toThrow('Unable to find role="presentation"');

    const menuButton = await screen.findByRole("button", {
      name: "Menu",
    });

    await userEvent.click(menuButton);

    expect(
      screen.getByRole("presentation", { name: "Menu" })
    ).toBeInTheDocument();
  });

  it("should open the menu via shortcut", async () => {
    render(<TestContext text={todoTxt} storage={[todoTxtPaths]} />);

    await screen.findByTestId("page");

    await expect(() =>
      screen.findByRole("presentation", { name: "Menu" })
    ).rejects.toThrow('Unable to find role="presentation"');

    await userEvent.keyboard("m");

    expect(
      screen.getByRole("presentation", { name: "Menu" })
    ).toBeInTheDocument();
  });

  it("should close the menu via esc key", async () => {
    render(<TestContext text={todoTxt} storage={[todoTxtPaths]} />);

    await screen.findByTestId("page");

    await userEvent.keyboard("m");

    expect(
      screen.getByRole("presentation", { name: "Menu" })
    ).toBeInTheDocument();

    await userEvent.keyboard("{Escape}");

    await expect(() =>
      screen.findByRole("presentation", { name: "Menu" })
    ).rejects.toThrow('Unable to find role="presentation"');
  });
});
