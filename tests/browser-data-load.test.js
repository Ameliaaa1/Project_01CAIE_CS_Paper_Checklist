const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const assert = require("node:assert/strict");

const rootDir = path.resolve(__dirname, "..");

const element = () => {
  const node = {
    value: "",
    checked: false,
    hidden: false,
    dataset: {},
    style: {},
    classList: {
      add() {},
      remove() {},
      toggle() {},
      contains() {
        return false;
      }
    },
    addEventListener() {},
    append() {},
    remove() {},
    setAttribute() {},
    removeAttribute() {},
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return [];
    },
    closest() {
      return null;
    },
    getBoundingClientRect() {
      return { top: 0, height: 0 };
    },
    scrollIntoView() {}
  };
  return node;
};

const context = {
  console,
  setTimeout,
  clearTimeout,
  URLSearchParams,
  Blob,
  NodeFilter: { SHOW_TEXT: 4 },
  localStorage: {
    getItem() {
      return null;
    },
    setItem() {},
    removeItem() {}
  },
  fetch: async () => ({ ok: false, json: async () => ({}) }),
  getComputedStyle: () => ({ getPropertyValue: () => "0" }),
  document: {
    body: element(),
    documentElement: element(),
    getElementById() {
      return element();
    },
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return [];
    },
    addEventListener() {},
    createElement: element,
    createTextNode: (text) => ({ nodeValue: text, textContent: text }),
    createDocumentFragment: element,
    createTreeWalker() {
      return { nextNode: () => null };
    }
  }
};
context.window = context;
context.globalThis = context;
context.location = { protocol: "http:", search: "", hash: "", href: "http://localhost/" };
context.history = { pushState() {}, replaceState() {} };
context.requestAnimationFrame = () => {};
context.addEventListener = () => {};
context.removeEventListener = () => {};

vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(rootDir, "assets", "paperlens-data.js"), "utf8"), context, {
  filename: "paperlens-data.js"
});

assert.ok(context.PaperLensData, "paperlens-data.js should define globalThis.PaperLensData");
assert.ok(Array.isArray(context.PaperLensData.topicBank), "PaperLensData should include topicBank");

vm.runInContext(fs.readFileSync(path.join(rootDir, "app.js"), "utf8"), context, {
  filename: "app.js"
});

assert.ok(context.PaperLensData, "app.js should run after PaperLensData is defined");
