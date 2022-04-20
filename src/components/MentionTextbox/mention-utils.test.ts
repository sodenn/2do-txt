import { getDescendants, getMentionsFromPlaintext } from "./mention-utils";

describe("mention-utils", () => {
  it("should get mentions from plain text", () => {
    const mentions = getMentionsFromPlaintext(
      "+Proj1 lorem+Proj2 ipsum @Ctx1 dolor @Ctx1 sit amet @Ctx2",
      ["@", "\\+"]
    );
    expect(mentions).toStrictEqual([
      { start: 0, end: 5, value: "Proj1", trigger: "+" },
      { start: 25, end: 29, value: "Ctx1", trigger: "@" },
      { start: 37, end: 41, value: "Ctx1", trigger: "@" },
      { start: 52, end: 56, value: "Ctx2", trigger: "@" },
    ]);
  });

  it("should get descendant from plain text", () => {
    const descendant = getDescendants(
      "+Proj1 lorem+Proj2 ipsum @Ctx1 dolor @Ctx1 sit amet @Ctx2",
      [{ value: "@" }, { value: "+" }]
    );
    expect(descendant).toStrictEqual({
      type: "paragraph",
      children: [
        {
          type: "mention",
          trigger: "+",
          character: "Proj1",
          children: [{ text: "" }],
        },
        { text: " lorem+Proj2 ipsum " },
        {
          type: "mention",
          trigger: "@",
          character: "Ctx1",
          children: [{ text: "" }],
        },
        { text: " dolor " },
        {
          type: "mention",
          trigger: "@",
          character: "Ctx1",
          children: [{ text: "" }],
        },
        { text: " sit amet " },
        {
          type: "mention",
          trigger: "@",
          character: "Ctx2",
          children: [{ text: "" }],
        },
      ],
    });
  });
});
