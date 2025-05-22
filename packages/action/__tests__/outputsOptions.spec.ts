import { parseEntry, parseOutputsOptions } from "../outputsOptions"; // Added parseOutputsOptions
import { it, expect } from "bun:test";

it("should parse options as json", () => {
  expect(
    parseEntry(`/out.svg       {"color_snake":"yellow"}`)?.drawOptions,
  ).toHaveProperty("colorSnake", "yellow");

  expect(
    parseEntry(`/out.svg?{"color_snake":"yellow"}`)?.drawOptions,
  ).toHaveProperty("colorSnake", "yellow");

  expect(
    parseEntry(`/out.svg?{"color_dots":["#000","#111","#222","#333","#444"]}`)
      ?.drawOptions.colorDots,
  ).toEqual(["#000", "#111", "#222", "#333", "#444"]);
});

it("should parse options as searchparams", () => {
  expect(parseEntry(`/out.svg?color_snake=yellow`)?.drawOptions).toHaveProperty(
    "colorSnake",
    "yellow",
  );

  expect(
    parseEntry(`/out.svg?color_dots=#000,#111,#222,#333,#444`)?.drawOptions
      .colorDots,
  ).toEqual(["#000", "#111", "#222", "#333", "#444"]);
});

it("should parse filename", () => {
  expect(parseEntry(`/a/b/c.svg?{"color_snake":"yellow"}`)).toHaveProperty(
    "filename",
    "/a/b/c.svg",
  );
  expect(
    parseEntry(`/a/b/out.svg?.gif.svg?{"color_snake":"yellow"}`),
  ).toHaveProperty("filename", "/a/b/out.svg?.gif.svg");

  expect(
    parseEntry(`/a/b/{[-1].svg?.gif.svg?{"color_snake":"yellow"}`),
  ).toHaveProperty("filename", "/a/b/{[-1].svg?.gif.svg");
});

// Updated to use parseOutputsOptions
[
  "path/to/out.gif",
  "/out.svg?color_snake=orange&color_dots=#000,#111,#222,#333,#444",
  `/out.svg?{"color_snake":"yellow","color_dots":["#000","#111","#222","#333","#444"]}`,
  "/out.svg?color_snake=orange&color_dots=#000,#111,#222,#333,#444&dark_color_dots=#a00,#a11,#a22,#a33,#a44",
].forEach((entry) =>
  it(`should parse ${entry}`, () => {
    expect(parseOutputsOptions([entry])[0]).toMatchSnapshot(); // Use parseOutputsOptions
  }),
);
