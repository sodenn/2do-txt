import {
  fireEvent,
  getByText,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useTask } from "../data/TaskContext";
import {
  EmptyTestContext,
  TestContext,
  todoTxt,
  todoTxtPaths,
} from "../utils/testing";
import DeleteConfirmationDialog from "./DeleteConfirmationDialog";
import TaskList from "./TaskList";

const TestComp = () => {
  const { activeTaskList } = useTask();

  if (!activeTaskList) {
    return null;
  }

  return <TaskList taskList={activeTaskList} />;
};

describe("TaskList", () => {
  it("should render an empty task list", async () => {
    render(
      <EmptyTestContext>
        <TestComp />
      </EmptyTestContext>
    );

    await expect(() => screen.findByRole("list")).rejects.toThrow(
      'Unable to find role="list"'
    );
  });

  it("should render a task list with items", async () => {
    render(
      <EmptyTestContext text={todoTxt} storage={[todoTxtPaths]}>
        <TestComp />
      </EmptyTestContext>
    );

    const listItems = await screen.findAllByRole("button", { name: "Task" });

    expect(listItems.length).toBeGreaterThan(0);
  });

  it("should navigate through task list by using the tab key", async () => {
    render(
      <EmptyTestContext text={todoTxt} storage={[todoTxtPaths]}>
        <TestComp />
      </EmptyTestContext>
    );

    const listItems = await screen.findAllByRole("button", { name: "Task" });

    expect(
      listItems.every((i) => i.getAttribute("aria-current") === "false")
    ).toBe(true);

    userEvent.tab();

    expect(
      listItems.filter((i) => i.getAttribute("aria-current") === "true").length
    ).toBe(1);

    expect(listItems.indexOf(document.activeElement as HTMLElement)).toBe(0);

    userEvent.tab();

    expect(
      listItems.filter((i) => i.getAttribute("aria-current") === "true").length
    ).toBe(1);

    expect(listItems.indexOf(document.activeElement as HTMLElement)).toBe(1);
  });

  it("should navigate through task list by using the arrow keys", async () => {
    const { container } = render(
      <EmptyTestContext text={todoTxt} storage={[todoTxtPaths]}>
        <TestComp />
      </EmptyTestContext>
    );

    const listItems = await screen.findAllByRole("button", { name: "Task" });

    expect(
      listItems.every((i) => i.getAttribute("aria-current") === "false")
    ).toBe(true);

    fireEvent.keyDown(container, { key: "ArrowDown", code: 40, charCode: 40 });

    expect(
      listItems.filter((i) => i.getAttribute("aria-current") === "true").length
    ).toBe(1);

    expect(listItems.indexOf(document.activeElement as HTMLElement)).toBe(0);

    fireEvent.keyDown(container, { key: "ArrowDown", code: 40, charCode: 40 });

    expect(
      listItems.filter((i) => i.getAttribute("aria-current") === "true").length
    ).toBe(1);

    expect(listItems.indexOf(document.activeElement as HTMLElement)).toBe(1);
  });

  it("should complete a task by clicking the checkbox", async () => {
    const todoTxt = "First task";
    render(
      <EmptyTestContext text={todoTxt} storage={[todoTxtPaths]}>
        <TestComp />
      </EmptyTestContext>
    );

    const checkbox = await screen.findByRole("checkbox", {
      name: "Complete task",
    });

    expect(checkbox.getAttribute("aria-checked")).toBe("false");

    fireEvent.click(checkbox);
    await screen.findByRole("checkbox", { name: "Complete task" });

    expect(checkbox.getAttribute("aria-checked")).toBe("true");

    // make sure that the click did not open the task dialog
    await expect(() =>
      screen.findByRole("presentation", { name: "Task dialog" })
    ).rejects.toThrow('Unable to find role="presentation"');
  });

  it("should complete a task by pressing space key", async () => {
    const todoTxt = "First task";
    const { container } = render(
      <EmptyTestContext text={todoTxt} storage={[todoTxtPaths]}>
        <TestComp />
      </EmptyTestContext>
    );

    await expect(() =>
      screen.findByRole("checkbox", { name: "Complete task", checked: true })
    ).rejects.toThrow('Unable to find role="checkbox"');

    fireEvent.keyDown(container, { key: "ArrowDown", code: 40, charCode: 40 });

    const focusedTask = await screen.findByRole("button", {
      name: "Task",
      current: true,
    });

    userEvent.type(focusedTask, "{space}");

    await screen.findByRole("checkbox", {
      name: "Complete task",
      checked: true,
    });
  });

  it("should edit task by pressing enter", async () => {
    const todoTxt = "First task";

    const { container } = render(
      <TestContext text={todoTxt} storage={[todoTxtPaths]} />
    );

    await screen.findByRole("list", { name: "Task list" });

    fireEvent.keyDown(container, { key: "ArrowDown", code: 40, charCode: 40 });

    const focusedTask = await screen.findByRole("button", {
      name: "Task",
      current: true,
    });

    fireEvent.keyDown(focusedTask, {
      key: "Enter",
      code: "Enter",
      charCode: 13,
    });

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

    const { container } = render(
      <TestContext
        text={todoTxt}
        storage={[todoTxtPaths, { key: "sort-by", value: "context" }]}
      />
    );

    await screen.findByRole("list", { name: "Task list" });

    fireEvent.keyDown(container, { key: "ArrowDown", code: 40, charCode: 40 });

    const focusedTask = await screen.findByRole("button", {
      name: "Task",
      current: true,
    });

    getByText(focusedTask, /Task B/);

    fireEvent.keyDown(focusedTask, {
      key: "e",
      code: "KeyE",
    });

    const taskDialog = await screen.findByRole("presentation", {
      name: "Task dialog",
    });

    getByText(taskDialog, /Task B/);
  });

  it("should hide completed task", async () => {
    const todoTxt = "First task";
    render(
      <EmptyTestContext
        text={todoTxt}
        storage={[todoTxtPaths, { key: "hide-completed-tasks", value: "true" }]}
      >
        <TestComp />
      </EmptyTestContext>
    );

    const listItems = await screen.findAllByRole("button", { name: "Task" });
    expect(listItems.length).toBe(1);

    const checkbox = await screen.findByRole("checkbox", {
      name: "Complete task",
    });

    fireEvent.click(checkbox);

    await waitFor(async () => {
      const taskElements = screen.queryAllByRole("button", { name: "Task" });
      await expect(taskElements.length).toBe(0);
    });
  });

  it("should delete task via menu", async () => {
    const todoTxt = "First task";
    render(
      <EmptyTestContext text={todoTxt} storage={[todoTxtPaths]}>
        <TestComp />
        <DeleteConfirmationDialog />
      </EmptyTestContext>
    );

    const menuButton = await screen.findByRole("button", {
      name: "Task menu",
    });

    fireEvent.click(menuButton);

    const deleteMenuItem = await screen.findByRole("menuitem", {
      name: "Delete task",
    });

    fireEvent.click(deleteMenuItem);

    const deleteButton = await screen.findByRole("button", {
      name: "Delete task",
    });

    fireEvent.click(deleteButton);

    await waitFor(async () => {
      const taskList = screen.queryByRole("list", { name: "Task list" });
      expect(taskList).toBeNull();

      const taskDialog = screen.queryByRole("presentation", {
        name: "Task dialog",
      });
      expect(taskDialog).toBeNull();
    });
  });
});
