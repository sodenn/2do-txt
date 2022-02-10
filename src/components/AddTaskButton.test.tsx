import { fireEvent, render, screen } from "@testing-library/react";
import { TestContext, todoTxt, todoTxtPaths } from "../utils/testing";

describe("AddTaskButton", () => {
  it("should open the task dialog", async () => {
    render(<TestContext text={todoTxt} storage={[todoTxtPaths]} />);

    const addTaskButton = await screen.findByRole("button", {
      name: "Add task",
    });

    fireEvent.click(addTaskButton);

    const taskDialog = await screen.findByRole("presentation", {
      name: "Task dialog",
    });

    expect(taskDialog).toBeInTheDocument();
  });
});
