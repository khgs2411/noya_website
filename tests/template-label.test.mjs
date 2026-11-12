import assert from "node:assert/strict";
import test from "node:test";
import { getTemplateLabel } from "../src/lib/template-label.ts";

test("template label treats whitespace-only locations as absent", () => {
  assert.equal(getTemplateLabel({
    name: "Ballet",
    default_location_snapshot: { label: " \t " },
    default_location: " Studio B ",
  }), "Ballet - Studio B");
  assert.equal(getTemplateLabel({
    name: "Ballet",
    default_location_snapshot: { label: " \t " },
    default_location: " \n ",
  }), "Ballet");
});

test("template label keeps the bare name when neither location exists", () => {
  assert.equal(getTemplateLabel({
    name: "Ballet",
    default_location_snapshot: null,
    default_location: null,
  }), "Ballet");
  assert.equal(getTemplateLabel({ name: "Ballet" }), "Ballet");
});

test("template label prefers the trimmed snapshot location", () => {
  assert.equal(getTemplateLabel({
    name: "ג׳אז לירי",
    default_location_snapshot: { label: "  Studio A  " },
    default_location: "Studio B",
  }), "ג׳אז לירי - Studio A");
});

test("template label uses trimmed free text when there is no snapshot", () => {
  assert.equal(getTemplateLabel({
    name: "Ballet",
    default_location_snapshot: null,
    default_location: "  Studio B  ",
  }), "Ballet - Studio B");
});
