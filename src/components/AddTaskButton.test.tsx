import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TestContext, todoTxt, todoTxtPaths } from "../utils/testing";

describe("AddTaskButton", () => {
  it("should open the task dialog", async () => {
    render(<TestContext text={todoTxt} storage={[todoTxtPaths]} />);

    const addTaskButton = await screen.findByRole("button", {
      name: "Add task",
    });

    await userEvent.click(addTaskButton);

    const taskDialog = await screen.findByRole("presentation", {
      name: "Task dialog",
    });

    expect(taskDialog).toBeInTheDocument();
  });
});
