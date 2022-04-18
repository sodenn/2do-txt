import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TestContext } from "../utils/testing";

describe("Onboarding", () => {
  it("should open the task dialog via the onboarding screen", async () => {
    render(<TestContext />);

    await screen.findByTestId("page");

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

    await waitFor(() => userEvent.click(createFile));

    const taskDialog = await screen.findByRole("presentation", {
      name: "Task dialog",
    });

    expect(taskDialog).toBeInTheDocument();
  });
});
