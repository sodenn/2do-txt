import { render, screen } from "@testing-library/react";
import "../../utils/testing";
import { pasteText } from "../../utils/testing";
import TaskEditor from "./TaskEditor";

describe("TaskEditor", () => {
  it("should remove line breaks from pasted text", async () => {
    const handleChange = jest.fn();

    render(<TaskEditor mentions={[]} onChange={handleChange} />);

    const editor = await screen.findByRole("textbox", { name: "Text editor" });

    const textWithLinebreaks = `This
is
a
test.`;

    pasteText(editor, textWithLinebreaks);

    expect(handleChange).toBeCalledWith("This is a test.");
  });
});
