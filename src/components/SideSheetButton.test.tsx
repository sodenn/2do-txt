import { fireEvent, render, screen } from "@testing-library/react";
import { TestContext } from "../utils/testing";

describe("SideSheetButton", () => {
  it("should open the sidebar via mouse click", async () => {
    render(<TestContext />);

    await expect(() =>
      screen.findByRole("presentation", { name: "Menu" })
    ).rejects.toThrow('Unable to find role="presentation"');

    const menuButton = await screen.findByRole("button", {
      name: "Menu",
    });

    fireEvent.click(menuButton);

    expect(
      screen.getByRole("presentation", { name: "Menu" })
    ).toBeInTheDocument();
  });
});
