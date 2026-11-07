import { describe, expect, it } from "vitest";
import { csvCell } from "./csv";

describe("csvCell", () => {
  it("quotes and escapes", () => expect(csvCell('say "hi"')).toBe('"say ""hi"""'));
  it("renders null as empty", () => expect(csvCell(null)).toBe('""'));
  it.each(["=1+1", "+cmd", "-2", "@SUM(A1)"])("neutralises %s", (v) => expect(csvCell(v)).toBe(`"'${v}"`));
});
