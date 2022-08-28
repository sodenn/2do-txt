import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TestContext, todoTxt, todoTxtPaths } from "../utils/testing";

describe("SearchBar", () => {
  it("should not show the search bar when no files are open", async () => {
    render(<TestContext />);

    await screen.findByTestId("page");

    await expect(() =>
      screen.findByRole("search", { name: "Search for tasks" })
    ).rejects.toThrow('Unable to find role="search"');
  });

  it("should search a task", async () => {
    render(<TestContext text={todoTxt} storage={[todoTxtPaths]} />);

    let taskListItems = await screen.findAllByRole("button", {
      name: "Task",
    });

    expect(taskListItems.length).toBe(3);

    const searchBar = await screen.findByRole("search", {
      name: "Search for tasks",
    });

    await userEvent.type(searchBar, "first");

    taskListItems = await screen.findAllByRole("button", {
      name: "Task",
    });

    expect(taskListItems.length).toBe(1);

    const clearButton = await screen.findByRole("button", {
      name: "Clear search term",
    });

    await userEvent.click(clearButton);

    taskListItems = await screen.findAllByRole("button", {
      name: "Task",
    });

    expect(taskListItems.length).toBe(3);
  });

  it("should focus the search input via shortcut", async () => {
    render(<TestContext text={todoTxt} storage={[todoTxtPaths]} />);

    const searchInput = await screen.findByRole("search", {
      name: "Search for tasks",
    });

    expect(searchInput).not.toHaveFocus();

    await userEvent.keyboard("f");

    expect(searchInput).toHaveFocus();
  });
});
