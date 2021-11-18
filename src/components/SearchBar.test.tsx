import { fireEvent, render, screen } from "@testing-library/react";
import { TestContext, todoTxt } from "../utils/testing";

describe("SearchBar", () => {
  it("should search a task", async () => {
    render(<TestContext text={todoTxt} />);

    let taskListItems = await screen.findAllByRole("button", {
      name: "Task",
    });

    expect(taskListItems.length).toBe(3);

    const searchBar = await screen.findByRole("search", {
      name: "Search for tasks",
    });

    fireEvent.change(searchBar, { target: { value: "first" } });

    taskListItems = await screen.findAllByRole("button", {
      name: "Task",
    });

    expect(taskListItems.length).toBe(1);

    const clearButton = await screen.findByRole("button", {
      name: "Clear search term",
    });

    fireEvent.click(clearButton);

    taskListItems = await screen.findAllByRole("button", {
      name: "Task",
    });

    expect(taskListItems.length).toBe(3);
  });
});
