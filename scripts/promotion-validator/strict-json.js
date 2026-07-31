"use strict";

class StrictJsonError extends Error {
  constructor(code, message, offset = null) {
    super(message);
    this.name = "StrictJsonError";
    this.code = code;
    this.offset = offset;
  }
}

function decodeUtf8(bytes) {
  if (!Buffer.isBuffer(bytes)) bytes = Buffer.from(bytes);
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    throw new StrictJsonError("JSON_BOM_BLOCKED", "UTF-8 BOM is prohibited", 0);
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch (error) {
    throw new StrictJsonError("JSON_INVALID_UTF8", "Input is not valid UTF-8", null);
  }
}

function assertPairedSurrogates(value, offset) {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) {
        throw new StrictJsonError("JSON_UNPAIRED_SURROGATE", "Unpaired high surrogate", offset);
      }
      index += 1;
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      throw new StrictJsonError("JSON_UNPAIRED_SURROGATE", "Unpaired low surrogate", offset);
    }
  }
}

function parseStrictJson(bytes) {
  const text = decodeUtf8(bytes);
  let position = 0;
  const fail = (code, message, at = position) => { throw new StrictJsonError(code, message, at); };
  const whitespace = () => { while (position < text.length && /[\u0009\u000a\u000d\u0020]/.test(text[position])) position += 1; };

  function string() {
    const start = position;
    if (text[position] !== '"') fail("JSON_EXPECTED_STRING", "Expected string");
    position += 1;
    while (position < text.length) {
      const char = text[position];
      if (char === '"') {
        position += 1;
        let value;
        try { value = JSON.parse(text.slice(start, position)); } catch (error) { fail("JSON_INVALID_STRING", "Invalid JSON string", start); }
        assertPairedSurrogates(value, start);
        return value;
      }
      if (char.charCodeAt(0) < 0x20) fail("JSON_CONTROL_CHARACTER", "Unescaped control character");
      if (char === "\\") {
        position += 1;
        const escaped = text[position];
        if (!escaped || !'"\\/bfnrtu'.includes(escaped)) fail("JSON_INVALID_ESCAPE", "Invalid string escape");
        if (escaped === "u") {
          const hex = text.slice(position + 1, position + 5);
          if (!/^[0-9a-fA-F]{4}$/.test(hex)) fail("JSON_INVALID_ESCAPE", "Invalid Unicode escape");
          position += 4;
        }
      }
      position += 1;
    }
    fail("JSON_UNTERMINATED_STRING", "Unterminated string", start);
  }

  function number() {
    const rest = text.slice(position);
    const match = /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/.exec(rest);
    if (!match) fail("JSON_INVALID_NUMBER", "Invalid JSON number");
    const token = match[0];
    position += token.length;
    const value = Number(token);
    if (!Number.isFinite(value)) fail("JSON_NON_FINITE_NUMBER", "Non-finite number is prohibited", position - token.length);
    if (!/[.eE]/.test(token) && !Number.isSafeInteger(value)) {
      fail("JSON_INTEGER_PRECISION_LOSS", "Integer exceeds the exact IEEE-754 range", position - token.length);
    }
    return value;
  }

  function array() {
    position += 1;
    const result = [];
    whitespace();
    if (text[position] === "]") { position += 1; return result; }
    while (true) {
      result.push(value());
      whitespace();
      if (text[position] === "]") { position += 1; return result; }
      if (text[position] !== ",") fail("JSON_EXPECTED_COMMA", "Expected comma in array");
      position += 1;
      whitespace();
      if (text[position] === "]") fail("JSON_TRAILING_COMMA", "Trailing comma is prohibited");
    }
  }

  function object() {
    position += 1;
    const result = Object.create(null);
    const keys = new Set();
    whitespace();
    if (text[position] === "}") { position += 1; return result; }
    while (true) {
      if (text[position] !== '"') fail("JSON_EXPECTED_KEY", "Expected object key");
      const key = string();
      if (keys.has(key)) fail("JSON_DUPLICATE_KEY", `Duplicate object key: ${key}`);
      keys.add(key);
      whitespace();
      if (text[position] !== ":") fail("JSON_EXPECTED_COLON", "Expected colon after object key");
      position += 1;
      result[key] = value();
      whitespace();
      if (text[position] === "}") { position += 1; return result; }
      if (text[position] !== ",") fail("JSON_EXPECTED_COMMA", "Expected comma in object");
      position += 1;
      whitespace();
      if (text[position] === "}") fail("JSON_TRAILING_COMMA", "Trailing comma is prohibited");
    }
  }

  function value() {
    whitespace();
    const char = text[position];
    if (char === "{") return object();
    if (char === "[") return array();
    if (char === '"') return string();
    if (char === "-" || /[0-9]/.test(char || "")) return number();
    for (const [token, parsed] of [["true", true], ["false", false], ["null", null]]) {
      if (text.startsWith(token, position)) { position += token.length; return parsed; }
    }
    if (char === "/") fail("JSON_COMMENT_BLOCKED", "Comments are prohibited");
    fail("JSON_INVALID_TOKEN", "Invalid JSON token");
  }

  whitespace();
  if (position === text.length) fail("JSON_EMPTY_INPUT", "JSON input is empty");
  const result = value();
  whitespace();
  if (position !== text.length) fail("JSON_TRAILING_CONTENT", "Trailing non-whitespace content is prohibited");
  return result;
}

module.exports = { StrictJsonError, decodeUtf8, parseStrictJson };
