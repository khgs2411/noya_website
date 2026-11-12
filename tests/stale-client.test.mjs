import assert from "node:assert/strict";
import test from "node:test";
import { shouldReload } from "../src/lib/stale-client.ts";

test("the current version does not reload", () => {
  assert.equal(shouldReload({ current: "1.1.27", remote: "1.1.27", alreadyReloadedFor: null }), false);
});

test("a different version reloads", () => {
  assert.equal(shouldReload({ current: "1.1.27", remote: "1.1.28", alreadyReloadedFor: null }), true);
});

test("a version already reloaded for does not reload again", () => {
  assert.equal(shouldReload({ current: "1.1.27", remote: "1.1.28", alreadyReloadedFor: "1.1.28" }), false);
});

test("a missing remote version does not reload", () => {
  assert.equal(shouldReload({ current: "1.1.27", alreadyReloadedFor: null }), false);
});

