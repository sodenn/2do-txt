import { fireEvent, render, screen } from "@testing-library/react";
import { TestContext, todoTxt } from "../utils/testing";

describe("SearchBar", () => {
  it("should search a task", async () => {
    render(<TestContext text={todoTxt} />);

    const taskList = await screen.findByRole("list", {
      name: "Task list",
    });

    const searchBar = await screen.findByRole("search", {
      name: "Search for tasks",
    });

    let count = taskList.querySelectorAll('[role="listitem"]').length;

    expect(count).toBe(3);

    fireEvent.change(searchBar, { target: { value: "first" } });

    count = taskList.querySelectorAll('[role="listitem"]').length;

    expect(count).toBe(1);

    const clearButton = await screen.findByRole("button", {
      name: "Clear search term",
    });

    fireEvent.click(clearButton);

    count = taskList.querySelectorAll('[role="listitem"]').length;

    expect(count).toBe(3);
  });
});
