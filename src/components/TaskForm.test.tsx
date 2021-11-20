import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { TaskFormData } from "../utils/task";
import "../utils/testing";
import { Dictionary } from "../utils/types";
import { pasteText } from "./TaskEditor/TaskEditor.test";
import TaskForm from "./TaskForm";

interface TestCompProps {
  formData: TaskFormData;
  contexts?: string[];
  projects?: string[];
  tags?: Dictionary<string[]>;
  onChange?: jest.Mock<any, [x: TaskFormData]>;
  onEnterPress?: jest.Mock<any, [void]>;
}

const TestComp = (props: TestCompProps) => {
  const {
    formData,
    onChange,
    onEnterPress,
    projects = [],
    contexts = [],
    tags = {},
  } = props;

  const [_formData, setFormData] = useState<TaskFormData>(formData);

  const handleChange = (data: TaskFormData) => {
    setFormData((task) => ({ ...task, ...data }));
    if (onChange) {
      onChange(data);
    }
  };

  const handleEnterPress = () => {
    if (onEnterPress) {
      onEnterPress();
    }
  };

  return (
    <TaskForm
      projects={projects}
      contexts={contexts}
      tags={tags}
      formData={_formData}
      onChange={handleChange}
      onEnterPress={handleEnterPress}
    />
  );
};

describe("TaskEditor", () => {
  beforeAll(() => {
    window.scrollTo = jest.fn();
    window.HTMLElement.prototype.scrollIntoView = jest.fn();
  });

  const selectSuggestion = async (text: string) => {
    const menuItem = await screen.findByText(text);
    fireEvent.mouseEnter(menuItem);
    fireEvent.mouseDown(menuItem);
    fireEvent.mouseUp(menuItem);
  };

  it("should render a popover with due date suggestion", async () => {
    const formData = {
      body: "",
      creationDate: undefined,
      completionDate: undefined,
    };

    const tags = {
      due: ["2021-11-11"],
    };

    render(<TestComp formData={formData} tags={tags} />);

    const editor = await screen.findByRole("combobox", { name: "Text editor" });

    // suggestion is not available at this time
    await expect(() => screen.findByText("2021-11-11")).rejects.toThrow(
      /Unable to find an element with the text: 2021-11-11/
    );

    pasteText(editor, "due:");

    // make sure the suggestion is presented at this time
    await screen.findByText("2021-11-11");
  });

  it("should select a due date suggestion", async () => {
    const formData = {
      body: "",
      creationDate: undefined,
      completionDate: undefined,
    };

    const tags = {
      due: ["2021-11-11"],
    };

    render(<TestComp formData={formData} tags={tags} />);

    const editor = await screen.findByRole("combobox", { name: "Text editor" });

    pasteText(editor, "due:");

    await selectSuggestion("2021-11-11");

    // make sure the due date has been copied into the editor
    await screen.findByText("due:2021-11-11");

    // make sure the date picker includes the due date
    const dueDatePicker = await screen.findByRole("input", {
      name: "Due date",
    });
    expect(dueDatePicker.querySelector("input")?.value).toBe("11/11/2021");
  });
});
