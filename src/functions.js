function trimStrings(obj) {
  return Object.fromEntries(
    Object.entries(obj).map(([key, val]) => [key, typeof val === 'string' ? val.trim() : val])
  );
}

module.exports = {trimStrings};