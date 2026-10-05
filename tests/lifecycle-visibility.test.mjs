import assert from "node:assert/strict";
import test from "node:test";
import {
  getVisibleLessons,
  getVisibleManagedClasses,
  getVisibleSchedules,
  getVisibleTemplates,
} from "../src/lib/lifecycle-visibility.ts";

test("retired records stay in history while same-name replacements remain usable", () => {
  const templates = Object.freeze([
    Object.freeze({ id: "old-template", name: "Dance", status: "inactive" }),
    Object.freeze({ id: "new-template", name: "Dance", status: "active" }),
  ]);
  const schedules = Object.freeze([
    Object.freeze({ id: "old-schedule", status: "archived" }),
    Object.freeze({ id: "new-schedule", status: "active" }),
    Object.freeze({ id: "draft-schedule", status: "draft" }),
    Object.freeze({ id: "paused-schedule", status: "paused" }),
  ]);

  assert.deepEqual(getVisibleTemplates(templates, false).map((item) => item.id), ["new-template"]);
  assert.deepEqual(getVisibleTemplates(templates, true), templates);
  assert.deepEqual(getVisibleSchedules(schedules, false).map((item) => item.id), [
    "new-schedule", "draft-schedule", "paused-schedule",
  ]);
  assert.deepEqual(getVisibleSchedules(schedules, true), schedules);
});

test("retiring source records does not conceal already generated or booked classes", () => {
  const bookedClass = Object.freeze({
    id: "booked", template_id: "inactive-template", schedule_id: "archived-schedule",
    lifecycle_status: "created", temporal_status: "upcoming", registeredUsersCount: 2,
  });
  const completedClass = Object.freeze({
    id: "completed", lifecycle_status: "completed", temporal_status: "ended",
  });
  const cancelledClass = Object.freeze({
    id: "cancelled", lifecycle_status: "cancelled", temporal_status: "cancelled",
  });
  const classes = Object.freeze([bookedClass, completedClass, cancelledClass]);

  assert.deepEqual(getVisibleManagedClasses(classes, false), [bookedClass, completedClass]);
  assert.deepEqual(getVisibleManagedClasses(classes, true), classes);
  assert.equal(getVisibleManagedClasses(classes, false)[0], bookedClass);
});

test("either SDK cancellation projection removes a class from the normal manager view", () => {
  const classes = [
    { id: "lifecycle", lifecycle_status: "cancelled", temporal_status: "upcoming" },
    { id: "temporal", lifecycle_status: "created", temporal_status: "cancelled" },
    { id: "new", lifecycle_status: "created", temporal_status: "upcoming" },
  ];
  assert.deepEqual(getVisibleManagedClasses(classes, false).map((item) => item.id), ["new"]);
  assert.deepEqual(getVisibleManagedClasses(classes, true), classes);
});

test("normal lessons omit cancelled classes without removing started or ended history", () => {
  const lessons = Object.freeze([
    Object.freeze({ id: "cancelled", temporalStatus: "cancelled" }),
    Object.freeze({ id: "upcoming", temporalStatus: "upcoming" }),
    Object.freeze({ id: "started", temporalStatus: "started" }),
    Object.freeze({ id: "ended", temporalStatus: "ended" }),
  ]);
  assert.deepEqual(getVisibleLessons(lessons).map((item) => item.id), ["upcoming", "started", "ended"]);
  assert.equal(lessons.length, 4);
  assert.deepEqual(getVisibleLessons([]), []);
  assert.deepEqual(getVisibleTemplates([{ status: "inactive" }], false), []);
  assert.deepEqual(getVisibleSchedules([{ status: "archived" }], false), []);
});
