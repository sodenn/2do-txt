import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import FileSaver from "file-saver";
import {
  EmptyTestContext,
  todoTxt,
  todoTxtFilesystemItem,
  todoTxtPaths,
} from "../utils/testing";
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
      <EmptyTestContext
        filesystem={[todoTxtFilesystemItem]}
        storage={[todoTxtPaths]}
      >
        <DownloadButton />
      </EmptyTestContext>
    );

    const downloadButton = await screen.findByRole("button", {
      name: "Download todo.txt",
    });

    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(FileSaver.saveAs).toHaveBeenCalledWith(
        { content: [todoTxt], options: { type: "text/plain;charset=utf-8" } },
        process.env.REACT_APP_DEFAULT_FILE_NAME
      );
    });
  });

  it("should download todo.txt + done.txt", async () => {
    render(
      <EmptyTestContext
        filesystem={[
          todoTxtFilesystemItem,
          { value: "x 2022-04-17 2022-04-17 Done task", path: "done.txt" },
        ]}
        storage={[todoTxtPaths]}
      >
        <DownloadButton />
      </EmptyTestContext>
    );

    const downloadButton = await screen.findByRole("button", {
      name: "Download todo.txt",
    });

    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(FileSaver.saveAs).toHaveBeenCalledWith(
        { content: expect.any(Array), options: { type: "application/zip" } },
        expect.stringMatching(/todo_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}.zip/)
      );
    });
  });
});
