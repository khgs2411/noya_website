import assert from "node:assert/strict";
import test from "node:test";
import { isScheduleTemplateChange } from "../src/features/manager/schedules/schedule-template-change.ts";

test("saving the same schedule template does not require confirmation", () => {
  assert.equal(isScheduleTemplateChange({ template_id: "ballet" }, "ballet"), false);
});

test("changing an existing schedule template requires confirmation", () => {
  assert.equal(isScheduleTemplateChange({ template_id: "ballet" }, "jazz"), true);
});

test("creating a schedule does not require template-change confirmation", () => {
  assert.equal(isScheduleTemplateChange(null, "ballet"), false);
});
