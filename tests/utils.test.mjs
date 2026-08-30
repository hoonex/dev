import test from "node:test";
import assert from "node:assert/strict";
import { formatClock, formatDuration, normalizeRoomCode } from "../src/utils.js";

test("room codes keep only six uppercase alphanumerics", () => {
  assert.equal(normalizeRoomCode("ab-cd 12z"), "ABCD12");
});

test("clock formatting stays stable", () => {
  assert.equal(formatClock(65), "01:05");
  assert.equal(formatClock(3661), "01:01:01");
});

test("duration formatting is compact in Korean", () => {
  assert.equal(formatDuration(45), "45초");
  assert.equal(formatDuration(3900), "1시간 5분");
});
