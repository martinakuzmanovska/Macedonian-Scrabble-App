import test from "node:test";
import assert from "node:assert/strict";
import { formatChallengeDate, loadDictionary, normalizeDictionarySearch } from "./dictionaryService.js";

test("Macedonian search matches letter case and canonical Unicode spellings", () => {
  const saved = normalizeDictionarySearch("ЃОРЃИ");
  for (const search of ["ѓорѓи", "Ѓорѓи", " ЃОРЃИ ", "г\u0301ор"]) {
    assert.ok(saved.includes(normalizeDictionarySearch(search)));
  }
});

test("history displays date and time using Macedonian locale and the viewer's timezone", () => {
  const iso = "2026-11-15T14:30:00.000Z";
  assert.equal(formatChallengeDate(iso), new Intl.DateTimeFormat("mk-MK", {
    dateStyle: "medium", timeStyle: "short",
  }).format(new Date(iso)));
  assert.equal(formatChallengeDate("bad-date"), "Непознат датум");
});

test("dictionary read uses session ownership, supports empty data, errors, and cancellation", async t => {
  const original = globalThis.fetch;
  try {
    await t.test("current-account endpoint with credentials and no supplied owner", async () => {
      const controller = new AbortController();
      globalThis.fetch = async (url, options) => {
        assert.equal(url, "/api/auth/me/dictionary");
        assert.deepEqual(options, { credentials: "include", signal: controller.signal });
        return { ok: true, status: 200, json: async () => ({ success: true, words: [] }) };
      };
      assert.deepEqual(await loadDictionary(controller.signal), []);
    });
    await t.test("401 remains distinguishable from an empty dictionary", async () => {
      globalThis.fetch = async () => ({ status: 401 });
      await assert.rejects(loadDictionary(), error => error.status === 401);
    });
    await t.test("failed recovery, malformed body, and network error are never empty success", async () => {
      for (const response of [
        { ok: false, status: 503 },
        { ok: true, json: async () => ({ success: false }) },
        { ok: true, json: async () => ({ success: true, words: null }) },
        { ok: true, json: async () => { throw new SyntaxError("Invalid JSON"); } },
      ]) {
        globalThis.fetch = async () => response;
        await assert.rejects(loadDictionary());
      }
      globalThis.fetch = async () => { throw new TypeError("Offline"); };
      await assert.rejects(loadDictionary());
    });
    await t.test("an unmounted or changed account can cancel the outstanding read", async () => {
      globalThis.fetch = (_url, { signal }) => new Promise((_resolve, reject) => {
        signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
      });
      const controller = new AbortController();
      const pending = loadDictionary(controller.signal);
      controller.abort();
      await assert.rejects(pending, error => error.name === "AbortError");
    });
  } finally { globalThis.fetch = original; }
});
