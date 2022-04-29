import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TestContext, todoTxt, todoTxtPaths } from "../utils/testing";

describe("SideSheetButton", () => {
  it("should open the menu via mouse click", async () => {
    render(<TestContext text={todoTxt} storage={[todoTxtPaths]} />);

    await screen.findByTestId("page");

    await expect(() => screen.findByTestId("Menu")).rejects.toThrow(
      'Unable to find an element by: [data-testid="Menu"]'
    );

    const menuButton = await screen.findByRole("button", {
      name: "Toggle menu",
    });

    await userEvent.click(menuButton);

    const menu = await screen.findByTestId("Menu");
    await expect(menu.getAttribute("aria-label")).toBe("Open menu");
  });

  it("should open the menu via shortcut", async () => {
    render(<TestContext text={todoTxt} storage={[todoTxtPaths]} />);

    await screen.findByTestId("page");

    await expect(() => screen.findByTestId("Menu")).rejects.toThrow(
      'Unable to find an element by: [data-testid="Menu"]'
    );

    await userEvent.keyboard("m");

    const menu = await screen.findByTestId("Menu");
    await expect(menu.getAttribute("aria-label")).toBe("Open menu");
  });

  it("should close the menu via shortcut", async () => {
    render(<TestContext text={todoTxt} storage={[todoTxtPaths]} />);

    await screen.findByTestId("page");

    await userEvent.keyboard("m");

    const menu = await screen.findByTestId("Menu");
    await expect(menu.getAttribute("aria-label")).toBe("Open menu");

    await userEvent.keyboard("m");

    await expect(menu.getAttribute("aria-label")).toBe("Closed menu");
  });
});
