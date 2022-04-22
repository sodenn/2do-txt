import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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

    await waitFor(() => {
      const input = screen.queryByRole("textbox", { name: "File name" });
      expect(input).toHaveValue("todo.txt");
    });

    const fileDialog = await screen.findByRole("presentation", {
      name: "File dialog",
    });

    expect(fileDialog).toBeInTheDocument();

    const createButton = await screen.findByRole("button", {
      name: "Create file",
    });

    fireEvent.click(createButton);

    await waitFor(() => {
      const fileDialog = screen.queryByRole("presentation", {
        name: "File dialog",
      });
      expect(fileDialog).toBeNull();
    });

    const taskDialog = await screen.findByRole("presentation", {
      name: "Task dialog",
    });

    expect(taskDialog).toBeInTheDocument();
  });
});
