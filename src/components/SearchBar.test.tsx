import { fireEvent, render, screen } from "@testing-library/react";
import { TestContext, todoTxt, todoTxtPaths } from "../utils/testing";

describe("SearchBar", () => {
  it("should search a task", async () => {
    render(<TestContext text={todoTxt} storage={[todoTxtPaths]} />);

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

  it("should not show the search bar when no files are open", async () => {
    render(<TestContext />);

    await screen.findByTestId("page");

    await expect(() =>
      screen.findByRole("search", { name: "Search for tasks" })
    ).rejects.toThrow('Unable to find role="search"');
  });

  it("should focus the search input via shortcut", async () => {
    const { container } = render(
      <TestContext text={todoTxt} storage={[todoTxtPaths]} />
    );

    const searchInput = await screen.findByRole("search", {
      name: "Search for tasks",
    });

    expect(searchInput).not.toHaveFocus();

    fireEvent.keyDown(container, { key: "f", code: "KeyF" });

    expect(searchInput).toHaveFocus();
  });
});
