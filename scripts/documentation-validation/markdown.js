"use strict";

function linesOutsideFences(text) {
  const lines = text.split(/\r?\n/);
  let inFence = false;
  let marker = null;
  return lines.map((line, index) => {
    const match = line.match(/^\s*(```+|~~~+)/);
    if (match) {
      const nextMarker = match[1][0];
      if (!inFence) {
        inFence = true;
        marker = nextMarker;
      } else if (nextMarker === marker) {
        inFence = false;
        marker = null;
      }
      return { line: "", lineNumber: index + 1, fenced: true };
    }
    return { line: inFence ? "" : line, lineNumber: index + 1, fenced: inFence };
  });
}

function parseMetadata(text) {
  const metadata = {};
  const lines = text.split(/\r?\n/).slice(0, 60);
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(
      /^(Status|Result|Task|Owner|Created at|Authoritative scope|Related documents|Approval|Effective upon merge|Reviewer|Reviewed at|Superseded by|Superseded at|Replacement commit or PR|Base SHA|Head SHA|Initial audit generated at|Generated at):\s*(.*)$/,
    );
    if (!match) continue;
    const key = match[1];
    let value = match[2].trim().replace(/^`|`$/g, "");
    if (!value && key === "Related documents") value = "PRESENT";
    metadata[key] = { value, line: index + 1 };
  }
  return metadata;
}

function slugifyHeading(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/<[^>]+>/g, "")
    .replace(/[`*_~]/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseHeadings(text) {
  const counts = new Map();
  const headings = new Set();
  for (const entry of linesOutsideFences(text)) {
    const match = entry.line.match(/^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$/);
    if (!match) continue;
    const base = slugifyHeading(match[1]);
    if (!base) continue;
    const count = counts.get(base) || 0;
    counts.set(base, count + 1);
    headings.add(count === 0 ? base : `${base}-${count}`);
  }
  return headings;
}

function normalizeDestination(raw) {
  const trimmed = raw.trim();
  if (trimmed.startsWith("<") && trimmed.includes(">")) {
    return trimmed.slice(1, trimmed.indexOf(">"));
  }
  return trimmed.split(/\s+(?=[\"'])/)[0];
}

function parseLinks(text) {
  const visible = linesOutsideFences(text);
  const definitions = new Map();
  for (const entry of visible) {
    const match = entry.line.match(/^\s*\[([^\]]+)\]:\s*(\S+)/);
    if (match) definitions.set(match[1].trim().toLowerCase(), normalizeDestination(match[2]));
  }

  const links = [];
  for (const entry of visible) {
    const inline = /(?<!!)\[([^\]]*)\]\(([^)]+)\)/g;
    for (const match of entry.line.matchAll(inline)) {
      links.push({
        label: match[1],
        destination: normalizeDestination(match[2]),
        line: entry.lineNumber,
      });
    }
    const reference = /(?<!!)\[([^\]]+)\]\[([^\]]*)\]/g;
    for (const match of entry.line.matchAll(reference)) {
      const id = (match[2] || match[1]).trim().toLowerCase();
      if (definitions.has(id)) {
        links.push({
          label: match[1],
          destination: definitions.get(id),
          line: entry.lineNumber,
        });
      }
    }
  }
  return links;
}

module.exports = {
  linesOutsideFences,
  parseHeadings,
  parseLinks,
  parseMetadata,
  slugifyHeading,
};
