// Read resource names through resources.arsc, not ZIP filenames (AAPT can shorten those).
// Format: AOSP frameworks/base/libs/androidfw/include/androidfw/ResourceTypes.h.
const assert = require('node:assert/strict');
function chunk(bytes, offset, limit = bytes.length) {
  assert.ok(offset >= 0 && offset + 8 <= limit, 'Resource chunk header bounds');
  const type = bytes.readUInt16LE(offset), header = bytes.readUInt16LE(offset + 2), size = bytes.readUInt32LE(offset + 4);
  assert.ok(header >= 8 && size >= header && offset + size <= limit, 'Resource chunk size bounds');
  return { offset, type, header, size, end: offset + size };
}
function strings(bytes, offset, limit) {
  const c = chunk(bytes, offset, limit); assert.equal(c.type, 1, 'Resource string pool');
  assert.ok(c.header >= 28); const count = bytes.readUInt32LE(offset + 8);
  assert.ok(count <= 1000000 && c.header + count * 4 <= c.size, 'String offset bounds');
  const utf8 = !!(bytes.readUInt32LE(offset + 16) & 256), base = offset + bytes.readUInt32LE(offset + 20);
  return Array.from({ length: count }, (_, i) => {
    let p = base + bytes.readUInt32LE(offset + c.header + i * 4);
    assert.ok(p >= base && p < c.end);
    const length = () => {
      assert.ok(p + (utf8 ? 1 : 2) <= c.end);
      let n = utf8 ? bytes[p++] : bytes.readUInt16LE(p); if (!utf8) p += 2;
      const flag = utf8 ? 128 : 32768;
      if (n & flag) { assert.ok(p + (utf8 ? 1 : 2) <= c.end); n = ((n & (flag - 1)) * flag * 2) + (utf8 ? bytes[p++] : bytes.readUInt16LE(p)); if (!utf8) p += 2; }
      return n;
    };
    let n = length(); if (utf8) n = length(); else n *= 2;
    assert.ok(p + n <= c.end, 'String data bounds');
    return bytes.subarray(p, p + n).toString(utf8 ? 'utf8' : 'utf16le');
  });
}
function rawResourceFiles(bytes, wantedName) {
  const root = chunk(bytes, 0); assert.equal(root.type, 2, 'Android resource table');
  let values; const files = new Set();
  for (let p = root.header; p < root.end;) {
    const c = chunk(bytes, p, root.end);
    if (c.type === 1 && !values) values = strings(bytes, p, c.end);
    if (c.type === 0x200) {
      assert.ok(values && c.header >= 284, 'Package pools must be available');
      const types = strings(bytes, p + bytes.readUInt32LE(p + 268), c.end);
      const keys = strings(bytes, p + bytes.readUInt32LE(p + 276), c.end);
      for (let t = p + c.header; t < c.end;) {
        const type = chunk(bytes, t, c.end);
        if (type.type === 0x201 && types[bytes[t + 8] - 1] === 'raw') {
          assert.ok(type.header >= 20);
          const flags = bytes[t + 9], count = bytes.readUInt32LE(t + 12), start = bytes.readUInt32LE(t + 16);
          assert.ok(!(flags & ~3), 'Unsupported resource index flags');
          const step = flags & 2 ? 2 : 4;
          assert.ok(count <= 1000000 && type.header + count * step <= start && start <= type.size, 'Resource entry index bounds');
          for (let i = 0; i < count; i++) {
            const at = t + type.header + i * step;
            let relative = flags & 1 ? bytes.readUInt16LE(at + 2) * 4 : flags & 2 ? bytes.readUInt16LE(at) : bytes.readUInt32LE(at);
            if (relative === (flags & 2 ? 65535 : 0xffffffff)) continue;
            if (flags & 2) relative *= 4;
            const e = t + start + relative; assert.ok(e + 8 <= type.end, 'Resource entry bounds');
            const entryFlags = bytes.readUInt16LE(e + 2); if (entryFlags & 1) continue;
            const compact = !!(entryFlags & 8), key = compact ? bytes.readUInt16LE(e) : bytes.readUInt32LE(e + 4);
            if (keys[key] !== wantedName) continue;
            let dataType, data;
            if (compact) { dataType = entryFlags >>> 8; data = bytes.readUInt32LE(e + 4); }
            else { const v = e + bytes.readUInt16LE(e); assert.ok(v + 8 <= type.end, 'Resource value bounds'); dataType = bytes[v + 3]; data = bytes.readUInt32LE(v + 4); }
            assert.equal(dataType, 3, 'Named raw resource must resolve to a string path');
            assert.ok(typeof values[data] === 'string' && values[data].startsWith('res/'), 'Resource file path'); files.add(values[data]);
          }
        }
        t = type.end;
      }
    }
    p = c.end;
  }
  return [...files];
}
module.exports = { rawResourceFiles };
