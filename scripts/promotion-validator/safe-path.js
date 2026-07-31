"use strict";

const fs = require("fs");
const path = require("path");

function pathError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function assertRepositoryPath(root, relative, options = {}) {
  if (typeof relative !== "string" || relative.length === 0) throw pathError("PATH_EMPTY", "Path must be non-empty");
  if (relative.includes("\\")) throw pathError("PATH_BACKSLASH", "Backslashes are prohibited");
  if (relative.includes("\0")) throw pathError("PATH_NUL", "NUL is prohibited");
  if (path.posix.isAbsolute(relative)) throw pathError("PATH_ABSOLUTE", "Absolute paths are prohibited");
  const segments = relative.split("/");
  if (segments.some((segment) => segment === "")) throw pathError("PATH_EMPTY_SEGMENT", "Empty path segments are prohibited");
  if (segments.some((segment) => segment === "." || segment === "..")) throw pathError("PATH_DOT_SEGMENT", "Dot segments are prohibited");
  if (options.prefix && !relative.startsWith(options.prefix)) throw pathError("PATH_ROLE_BOUNDARY", `Path must be under ${options.prefix}`);
  const absoluteRoot = path.resolve(root);
  const absolute = path.resolve(root, ...segments);
  if (!(absolute === absoluteRoot || absolute.startsWith(`${absoluteRoot}${path.sep}`))) throw pathError("PATH_ESCAPE", "Path escapes repository");
  let current = absoluteRoot;
  for (let index = 0; index < segments.length; index += 1) {
    current = path.join(current, segments[index]);
    if (!fs.existsSync(current)) {
      if (options.mustExist !== false) throw pathError("PATH_MISSING", `Path does not exist: ${relative}`);
      break;
    }
    if (fs.lstatSync(current).isSymbolicLink()) throw pathError("PATH_SYMLINK", `Symlink component is prohibited: ${relative}`);
  }
  return absolute;
}

module.exports = { assertRepositoryPath, pathError };
