import { fireEvent, render, screen } from "@testing-library/react";
import { TestContext } from "../utils/testing";

describe("Onboarding", () => {
  it("should open the task dialog via the onboarding screen", async () => {
    render(<TestContext />);

    await screen.findByRole("heading", { name: "Onboarding" });

    const createTaskButton = await screen.findByRole("button", {
      name: "Create task",
    });

    await screen.findByRole("button", {
      name: "Open todo.txt",
    });

    fireEvent.click(createTaskButton);

    const fileDialog = await screen.findByRole("presentation", {
      name: "File dialog",
    });

    expect(fileDialog).toBeInTheDocument();

    const createFile = await screen.findByRole("button", {
      name: "Create file",
    });

    fireEvent.click(createFile);

    const taskDialog = await screen.findByRole("presentation", {
      name: "Task dialog",
    });

    expect(taskDialog).toBeInTheDocument();
  });
});
