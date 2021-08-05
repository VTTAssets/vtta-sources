const slugify = (s) => {
  return s
    .replace(/[àáâãäå]/g, "a")
    .replace(/æ/g, "ae")
    .replace(/ç/g, "c")
    .replace(/[èéêë]/g, "e")
    .replace(/[ìíîï]/g, "i")
    .replace(/ñ/g, "n")
    .replace(/[òóôõö]/g, "o")
    .replace(/œ/g, "oe")
    .replace(/[ùúûü]/g, "u")
    .replace(/[ýÿ]/g, "y")
    .replace(/[’']/g, "")
    .replace(/\W+/g, "-")
    .replace(/\-\-+/g, "-")
    .replace(/^\-/, "")
    .replace(/\-$/, "")
    .toLowerCase();
};

const capitalize = (str, seperator = " ") => {
  return str
    .split(seperator)
    .map((part) => part.trim())
    .filter((part) => part !== "")
    .map((part) => part.substr(0, 1).toUpperCase() + part.substring(1))
    .join(" ");
};

const ucFirst = (str) => {
  return str.substr(0, 1).toUpperCase() + str.substring(1);
};

/**
 * Sanitizes a string to a valid filepath, by replacing each reserved character by a unique string literal.
 * The process is therefore reversable
 * @param {string} filepath
 * @returns sanitized string
 */
const clean = (str) => {
  const FILENAME_SPECIAL_CHARS = [
    ":",
    "\\?",
    "\\/",
    "<",
    ">",
    "\\\\",
    "\\*",
    "\\|",
    '\\"',
  ];
  FILENAME_SPECIAL_CHARS.forEach((char, index) => {
    const replacement = ` -${"#".repeat(index + 1)}- `;
    const regex = new RegExp(char, "g");
    str = str.replace(regex, replacement);
  });
  return str;
};

/**
 * Sanitizes a string to a valid filepath, by replacing each reserved character by a unique string literal.
 * The process is therefore reversable
 * @param {string} filepath
 * @returns sanitized string
 */
const unclean = (str) => {
  const FILENAME_SPECIAL_CHARS = [":", "?", "/", "<", ">", "\\", "*", "|", '"'];
  FILENAME_SPECIAL_CHARS.forEach((char, index) => {
    const replacement = ` -${"#".repeat(index + 1)}- `;
    const regex = new RegExp(replacement, "g");
    str = str.replace(regex, char);
  });
  return str;
};

export { slugify, capitalize, ucFirst, clean, unclean };
