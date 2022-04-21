import { getDescendants, getMentionsFromPlaintext } from "./mention-utils";

describe("mention-utils", () => {
  it("should get mentions from plain text", () => {
    const mentions = getMentionsFromPlaintext(
      "+Proj1 lorem+Proj2 ipsum @Ctx1 dolor @Ctx1 sit amet @Ctx2 @Ctx3 due:2022-01-01",
      ["@", "+", "due:"]
    );
    expect(mentions).toStrictEqual([
      { start: 0, end: 5, value: "Proj1", trigger: "+" },
      { start: 25, end: 29, value: "Ctx1", trigger: "@" },
      { start: 37, end: 41, value: "Ctx1", trigger: "@" },
      { start: 52, end: 56, value: "Ctx2", trigger: "@" },
      { start: 58, end: 62, value: "Ctx3", trigger: "@" },
      { start: 64, end: 77, value: "2022-01-01", trigger: "due:" },
    ]);
  });

  it("should get descendant from plain text", () => {
    const descendant = getDescendants(
      "+Proj1 lorem+Proj2 ipsum @Ctx1 dolor @Ctx1 sit amet @Ctx2 @Ctx3 due:2022-01-01",
      [
        { value: "@", style: { backgroundColor: "green" } },
        { value: "+", style: { backgroundColor: "blue" } },
        { value: "due:", style: { backgroundColor: "red" } },
      ]
    );
    expect(descendant).toStrictEqual([
      {
        type: "paragraph",
        children: [
          {
            type: "mention",
            trigger: "+",
            character: "Proj1",
            style: { backgroundColor: "blue" },
            children: [{ text: "" }],
          },
          { text: " lorem+Proj2 ipsum " },
          {
            type: "mention",
            trigger: "@",
            character: "Ctx1",
            style: { backgroundColor: "green" },
            children: [{ text: "" }],
          },
          { text: " dolor " },
          {
            type: "mention",
            trigger: "@",
            character: "Ctx1",
            style: { backgroundColor: "green" },
            children: [{ text: "" }],
          },
          { text: " sit amet " },
          {
            type: "mention",
            trigger: "@",
            character: "Ctx2",
            style: { backgroundColor: "green" },
            children: [{ text: "" }],
          },
          { text: " " },
          {
            type: "mention",
            trigger: "@",
            character: "Ctx3",
            style: { backgroundColor: "green" },
            children: [{ text: "" }],
          },
          { text: " " },
          {
            type: "mention",
            trigger: "due:",
            character: "2022-01-01",
            style: { backgroundColor: "red" },
            children: [{ text: "" }],
          },
          { text: "" },
        ],
      },
    ]);
  });
});
