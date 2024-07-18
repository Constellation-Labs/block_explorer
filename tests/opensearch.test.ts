import { getFromPath } from "../src/opensearch";

describe("getFromPath", () => {
  const testObj = {
    a: 1,
    b: {
      c: 2,
      d: {
        e: 3,
        f: null,
        g: undefined,
      },
    },
    h: [1, 2, { i: 4 }],
    j: null,
    k: undefined,
  };

  it("should return the value for a simple path", () => {
    expect(getFromPath(testObj, "a")).toBe(1);
  });

  it("should return the value for a nested path", () => {
    expect(getFromPath(testObj, "b.c")).toBe(2);
    expect(getFromPath(testObj, "b.d.e")).toBe(3);
  });

  it("should return undefined for non-existent paths", () => {
    expect(getFromPath(testObj, "x")).toBeUndefined();
    expect(getFromPath(testObj, "b.x")).toBeUndefined();
    expect(getFromPath(testObj, "b.c.x")).toBeUndefined();
  });

  it("should return undefined for paths leading to null or undefined", () => {
    expect(getFromPath(testObj, "b.d.f")).toBeUndefined();
    expect(getFromPath(testObj, "b.d.g")).toBeUndefined();
    expect(getFromPath(testObj, "j")).toBeUndefined();
    expect(getFromPath(testObj, "k")).toBeUndefined();
  });

  it("should handle array access", () => {
    expect(getFromPath(testObj, "h.0")).toBe(1);
    expect(getFromPath(testObj, "h.2.i")).toBe(4);
  });

  it("should return undefined for out-of-bounds array access", () => {
    expect(getFromPath(testObj, "h.3")).toBeUndefined();
  });

  it("should return the entire object for an empty path", () => {
    expect(getFromPath(testObj, "")).toEqual(testObj);
  });

  it("should return undefined when trying to access properties on primitives", () => {
    expect(getFromPath(testObj, "a.x")).toBeUndefined();
  });

  it("should handle complex nested structures", () => {
    const complexObj = {
      a: {
        b: [{ c: { d: 1 } }, { c: { d: 2 } }],
      },
    };
    expect(getFromPath(complexObj, "a.b.0.c.d")).toBe(1);
    expect(getFromPath(complexObj, "a.b.1.c.d")).toBe(2);
  });
});
