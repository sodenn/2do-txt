import { fireEvent, render, screen } from "@testing-library/react";
import { TestContext } from "../utils/testing";

describe("AddTaskButton", () => {
  it("should open the task dialog", async () => {
    render(<TestContext />);

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
