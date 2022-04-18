import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TestContext, todoTxt, todoTxtPaths } from "../utils/testing";

describe("TaskDialog", () => {
  it("should open task dialog via shortcut", async () => {
    render(<TestContext text={todoTxt} storage={[todoTxtPaths]} />);

    await screen.findByTestId("page");

    await expect(() =>
      screen.findByRole("presentation", { name: "Task dialog" })
    ).rejects.toThrow('Unable to find role="presentation"');

    await userEvent.keyboard("n");

    await expect(
      screen.getByRole("presentation", { name: "Task dialog" })
    ).toBeInTheDocument();
  });

  it("should not open task dialog via shortcut when menu is open", async () => {
    render(<TestContext text={todoTxt} storage={[todoTxtPaths]} />);

    await screen.findByTestId("page");

    await expect(() =>
      screen.findByRole("presentation", { name: "Task dialog" })
    ).rejects.toThrow('Unable to find role="presentation"');

    await userEvent.keyboard("m");

    expect(
      screen.getByRole("presentation", { name: "Menu" })
    ).toBeInTheDocument();

    await userEvent.keyboard("n");

    await expect(() =>
      screen.findByRole("presentation", { name: "Task dialog" })
    ).rejects.toThrow('Unable to find role="presentation"');
  });
});
