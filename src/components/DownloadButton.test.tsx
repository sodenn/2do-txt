import { fireEvent, render, screen } from "@testing-library/react";
import FileSaver from "file-saver";
import { EmptyTestContext, todoTxt, todoTxtPaths } from "../utils/testing";
import DownloadButton from "./DownloadButton";

jest.mock("file-saver", () => ({ saveAs: jest.fn() }));

// Mock Blob as well to compare content
// @ts-ignore
global.Blob = function (content, options) {
  return { content, options };
};

describe("DownloadButton", () => {
  it("should download a todo.txt file", async () => {
    render(
      <EmptyTestContext text={todoTxt} storage={[todoTxtPaths]}>
        <DownloadButton />
      </EmptyTestContext>
    );

    const downloadButton = await screen.findByRole("button", {
      name: "Download todo.txt",
    });

    fireEvent.click(downloadButton);

    expect(FileSaver.saveAs).toHaveBeenCalledWith(
      { content: [todoTxt], options: { type: "text/plain;charset=utf-8" } },
      "todo.txt"
    );
  });
});
