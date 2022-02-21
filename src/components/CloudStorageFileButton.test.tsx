import { render, screen } from "@testing-library/react";
import { EmptyTestContext } from "../utils/testing";
import CloudStorageFileButton from "./CloudStorageFileButton";

describe("CloudStorageFileButton", () => {
  it("should not display the component if there is no connection to the cloud storage", async () => {
    process.env.REACT_APP_ENABLE_WEB_CLOUD_STORAGE = "true";

    render(
      <EmptyTestContext storage={[{ key: "cloud-storage", value: "Dropbox" }]}>
        <CloudStorageFileButton
          onClick={() => undefined}
          cloudStorage="Dropbox"
        />
      </EmptyTestContext>
    );

    await screen.findByTestId("page");

    const button = screen.queryByRole("button", {
      name: "Choose from Dropbox",
    });

    expect(button).not.toBeInTheDocument();
  });

  it("should not display the component if no cloud storage is specified", async () => {
    process.env.REACT_APP_ENABLE_WEB_CLOUD_STORAGE = "true";

    render(
      <EmptyTestContext
        secureStorage={[{ key: "Dropbox-refresh-token", value: "abc" }]}
      >
        <CloudStorageFileButton
          onClick={() => undefined}
          cloudStorage="Dropbox"
        />
      </EmptyTestContext>
    );

    await screen.findByTestId("page");

    const button = screen.queryByRole("button", {
      name: "Choose from Dropbox",
    });

    expect(button).not.toBeInTheDocument();
  });

  it("should display the component if a cloud storage is specified and connection", async () => {
    process.env.REACT_APP_ENABLE_WEB_CLOUD_STORAGE = "true";

    render(
      <EmptyTestContext
        storage={[{ key: "cloud-storage", value: "Dropbox" }]}
        secureStorage={[{ key: "Dropbox-refresh-token", value: "abc" }]}
      >
        <CloudStorageFileButton
          onClick={() => undefined}
          cloudStorage="Dropbox"
        />
      </EmptyTestContext>
    );

    const button = await screen.findByRole("button", {
      name: "Choose from Dropbox",
    });

    expect(button).toBeInTheDocument();
  });

  it("should not display the component if platform is not ios or android", async () => {
    process.env.REACT_APP_ENABLE_WEB_CLOUD_STORAGE = "false";

    render(
      <EmptyTestContext
        platform="web"
        storage={[{ key: "cloud-storage", value: "Dropbox" }]}
        secureStorage={[{ key: "Dropbox-refresh-token", value: "abc" }]}
      >
        <CloudStorageFileButton
          onClick={() => undefined}
          cloudStorage="Dropbox"
        />
      </EmptyTestContext>
    );

    await screen.findByTestId("page");

    const button = screen.queryByRole("button", {
      name: "Choose from Dropbox",
    });

    expect(button).not.toBeInTheDocument();
  });
});
