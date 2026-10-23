import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { escapeAnnotation, formatOutput, writeOutputs } from '../src/output.js';
import { readText, withTempDir } from './helpers.js';

describe('formatOutput', () => {
  it('writes single-line values as name=value', () => {
    assert.equal(formatOutput('new-version-major', 3), 'new-version-major=3\n');
    assert.equal(formatOutput('new-version', ''), 'new-version=\n');
  });

  it('writes multi-line values with a heredoc delimiter', () => {
    assert.equal(formatOutput('new-version', 'v1\n- a', () => 'EOF_1'), 'new-version<<EOF_1\nv1\n- a\nEOF_1\n');
  });

  it('refuses a value that contains its delimiter', () => {
    assert.throws(() => formatOutput('x', 'a\nEOF_1', () => 'EOF_1'), /delimiter/);
  });
});

describe('writeOutputs', () => {
  it('appends to GITHUB_OUTPUT', () =>
    withTempDir(async (dir) => {
      const env = { GITHUB_OUTPUT: join(dir, 'out') };
      writeOutputs(env, { 'latest-tag': 'v1.2.3' });
      writeOutputs(env, { 'new-version-major': 2 });
      assert.equal(readText(env.GITHUB_OUTPUT), 'latest-tag=v1.2.3\nnew-version-major=2\n');
    }));

  it('falls back to stdout without GITHUB_OUTPUT', () => {
    const written = [];
    writeOutputs({}, { 'latest-tag': 'v0.0.0' }, (text) => written.push(text));
    assert.deepEqual(written, ['latest-tag=v0.0.0\n']);
  });
});

describe('escapeAnnotation', () => {
  it('escapes characters that break workflow commands', () => {
    assert.equal(escapeAnnotation('50% done\r\nnext'), '50%25 done%0D%0Anext');
  });
});
