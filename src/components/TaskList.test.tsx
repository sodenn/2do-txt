import { getByText, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  EmptyTestContext,
  StorageItem,
  TestContext,
  todoTxt,
} from "../utils/testing";
import ConfirmationDialog from "./ConfirmationDialog";
import TaskLists from "./TaskLists";

export const todoTxtPaths: StorageItem = {
  key: "todo-txt-paths",
  value: JSON.stringify(["todo1.txt", "todo2.txt"]),
};

describe("TaskList", () => {
  it("should render an empty task list", async () => {
    render(
      <EmptyTestContext>
        <TaskLists />
      </EmptyTestContext>
    );

    await screen.findByTestId("page");

    await expect(() => screen.findByRole("list")).rejects.toThrow(
      'Unable to find role="list"'
    );
  });

  it("should render a task list with items", async () => {
    render(
      <EmptyTestContext text={todoTxt} storage={[todoTxtPaths]}>
        <TaskLists />
      </EmptyTestContext>
    );

    await screen.findByTestId("page");

    const listItems = await screen.findAllByRole("button", { name: "Task" });

    expect(listItems.length).toBeGreaterThan(0);
  });

  it("should navigate through task list by using the tab key", async () => {
    render(
      <EmptyTestContext text={todoTxt} storage={[todoTxtPaths]}>
        <TaskLists />
      </EmptyTestContext>
    );

    await screen.findByTestId("page");

    const listItems = await screen.findAllByRole("button", { name: "Task" });

    expect(
      listItems.every((i) => i.getAttribute("aria-current") === "false")
    ).toBe(true);

    await userEvent.tab();

    expect(
      listItems.filter((i) => i.getAttribute("aria-current") === "true").length
    ).toBe(1);

    expect(listItems[0]).toHaveFocus();

    await userEvent.tab();

    expect(
      listItems.filter((i) => i.getAttribute("aria-current") === "true").length
    ).toBe(1);

    expect(listItems[1]).toHaveFocus();
  });

  it("should navigate through task list by using the arrow keys", async () => {
    render(
      <EmptyTestContext text={todoTxt} storage={[todoTxtPaths]}>
        <TaskLists />
      </EmptyTestContext>
    );

    await screen.findByTestId("page");

    const listItems = await screen.findAllByRole("button", { name: "Task" });

    expect(
      listItems.every((i) => i.getAttribute("aria-current") === "false")
    ).toBe(true);

    await userEvent.keyboard("{ArrowDown}");

    expect(
      listItems.filter((i) => i.getAttribute("aria-current") === "true").length
    ).toBe(1);

    expect(listItems[0]).toHaveFocus();

    await userEvent.keyboard("{ArrowDown}");

    expect(
      listItems.filter((i) => i.getAttribute("aria-current") === "true").length
    ).toBe(1);

    expect(listItems[1]).toHaveFocus();
  });

  it("should complete a task by clicking the checkbox", async () => {
    const todoTxt = "First task";
    render(
      <EmptyTestContext text={todoTxt} storage={[todoTxtPaths]}>
        <TaskLists />
      </EmptyTestContext>
    );

    await screen.findByTestId("page");

    let checkboxes = await screen.findAllByRole("checkbox", {
      name: "Complete task",
      checked: false,
    });
    expect(checkboxes.length).toBe(2);

    await userEvent.click(checkboxes[0]);

    checkboxes = await screen.findAllByRole("checkbox", {
      name: "Complete task",
      checked: true,
    });
    expect(checkboxes.length).toBe(1);

    // make sure that the click did not open the task dialog
    await expect(() =>
      screen.findByRole("presentation", { name: "Task dialog" })
    ).rejects.toThrow('Unable to find role="presentation"');
  });

  it("should complete a task by pressing space key", async () => {
    const todoTxt = "First task";
    render(
      <EmptyTestContext text={todoTxt} storage={[todoTxtPaths]}>
        <TaskLists />
      </EmptyTestContext>
    );

    await screen.findByTestId("page");

    await expect(() =>
      screen.findByRole("checkbox", { name: "Complete task", checked: true })
    ).rejects.toThrow('Unable to find role="checkbox"');

    await userEvent.keyboard("{ArrowDown}");

    await userEvent.keyboard("[Space]");

    await screen.findByRole("checkbox", {
      name: "Complete task",
      checked: true,
    });
  });

  it("should edit task by pressing enter", async () => {
    const todoTxt = "First task";

    render(<TestContext text={todoTxt} storage={[todoTxtPaths]} />);

    await screen.findByTestId("page");

    await screen.findAllByRole("list", { name: "Task list" });

    await userEvent.keyboard("{ArrowDown}");

    await screen.findByRole("button", {
      name: "Task",
      current: true,
    });

    await userEvent.keyboard("{Enter}");

    await screen.findByRole("presentation", {
      name: "Task dialog",
    });
  });

  it("should edit task by pressing the shortcut", async () => {
    const todoTxt = `Task A
Task B @Feature
Task C
Task D @Test
Task E @Test @Feature`;

    render(
      <TestContext
        text={todoTxt}
        storage={[todoTxtPaths, { key: "sort-by", value: "context" }]}
      />
    );

    await screen.findByTestId("page");

    await screen.findAllByRole("list", { name: "Task list" });

    await userEvent.keyboard("{ArrowDown}");

    const focusedTask = await screen.findByRole("button", {
      name: "Task",
      current: true,
    });

    // eslint-disable-next-line testing-library/prefer-screen-queries
    getByText(focusedTask, /Task B/);

    await userEvent.keyboard("e");

    const taskDialog = await screen.findByRole("presentation", {
      name: "Task dialog",
    });

    // eslint-disable-next-line testing-library/prefer-screen-queries
    getByText(taskDialog, /Task B/);
  });

  it("should hide completed task", async () => {
    const todoTxt = "First task";
    render(
      <EmptyTestContext
        text={todoTxt}
        storage={[todoTxtPaths, { key: "hide-completed-tasks", value: "true" }]}
      >
        <TaskLists />
      </EmptyTestContext>
    );

    await screen.findByTestId("page");

    const listItems = await screen.findAllByRole("button", { name: "Task" });
    expect(listItems.length).toBe(2);

    const checkboxes = await screen.findAllByRole("checkbox", {
      name: "Complete task",
    });

    expect(checkboxes.length).toBe(2);
    await userEvent.click(checkboxes[0]);

    await waitFor(async () => {
      const taskElements = screen.queryAllByRole("button", { name: "Task" });
      await expect(taskElements.length).toBe(1);
    });
  });

  it("should delete task via menu", async () => {
    const todoTxt = "First task";
    render(
      <EmptyTestContext text={todoTxt} storage={[todoTxtPaths]}>
        <TaskLists />
        <ConfirmationDialog />
      </EmptyTestContext>
    );

    await screen.findByTestId("page");

    const menuButtons = await screen.findAllByLabelText("Task menu");

    expect(menuButtons.length).toBe(2);

    await userEvent.click(menuButtons[0]);

    const deleteMenuItem = await screen.findByRole("menuitem", {
      name: "Delete task",
    });

    await userEvent.click(deleteMenuItem);

    const deleteButton = await screen.findByRole("button", {
      name: "Delete",
    });

    await userEvent.click(deleteButton);

    await waitFor(async () => {
      const taskList = screen.queryByRole("list", { name: "Task list" });
      expect(taskList).toBeNull();
    });

    await waitFor(async () => {
      const taskDialog = screen.queryByRole("presentation", {
        name: "Task dialog",
      });
      expect(taskDialog).toBeNull();
    });
  });
});
