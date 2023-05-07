import { describe, expect, it } from "vitest";
import { decodeHTMLEntities } from "./decode-html";

describe("decodeHTMLEntities", () => {
  it("should decode &amp; to &", () => {
    const text = "This &amp; that";
    expect(decodeHTMLEntities(text)).toBe("This & that");
  });

  it("should decode &lt; to <", () => {
    const text = "This &lt;p&gt;paragraph&lt;/p&gt; is encoded";
    expect(decodeHTMLEntities(text)).toBe("This <p>paragraph</p> is encoded");
  });

  it("should decode &gt; to >", () => {
    const text = "4 &gt; 2";
    expect(decodeHTMLEntities(text)).toBe("4 > 2");
  });

  it('should decode &quot; to "', () => {
    const text = 'She said, "I love you"';
    expect(decodeHTMLEntities(text)).toBe('She said, "I love you"');
  });

  it("should decode &nbsp; to a space", () => {
    const text = "Hello&nbsp;world";
    expect(decodeHTMLEntities(text)).toBe("Hello world");
  });

  it("should decode numeric character references to their corresponding characters", () => {
    const text = "&#65;&#66;&#67;";
    expect(decodeHTMLEntities(text)).toBe("ABC");
  });

  it("should handle multiple entities in a single string", () => {
    const text = 'This &amp; that &lt; are &gt; different "quotes"';
    expect(decodeHTMLEntities(text)).toBe(
      'This & that < are > different "quotes"'
    );
  });
});
