import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../src/run.js';
import { actionEnv, givenRemoteTags, parseOutputFile, quietLog, readText, withTempDir } from './helpers.js';

async function runWithTags(tags, incrementType) {
  return withTempDir(async (dir) => {
    const clone = givenRemoteTags(dir, tags);
    const overrides = incrementType === undefined ? {} : { 'INPUT_INCREMENT-TYPE': incrementType };
    const env = actionEnv(dir, clone, overrides);
    const { lines, log } = quietLog();
    let error = null;
    try {
      await run({ env, log });
    } catch (caught) {
      error = caught;
    }
    return { outputs: parseOutputFile(readText(env.GITHUB_OUTPUT)), raw: readText(env.GITHUB_OUTPUT), lines, error };
  });
}

function expected(latestTag, tagVersion, newVersion) {
  const [major, minor, patch] = newVersion.split('.');
  return {
    'latest-tag': latestTag,
    'tag-version': tagVersion,
    'new-version': newVersion,
    'new-version-major': major,
    'new-version-minor': minor,
    'new-version-patch': patch,
  };
}

describe('run', () => {
  it('starts from v0.0.0 without tags', async () => {
    const { outputs, lines, error } = await runWithTags([], 'patch');
    assert.equal(error, null);
    assert.deepEqual(outputs, expected('v0.0.0', '0.0.0', '0.0.1'));
    assert.ok(lines.includes('Latest tag: v0.0.0 -> new version: 0.0.1'));
  });

  it('fetches tags missing from a shallow checkout', async () => {
    const { outputs } = await runWithTags(['v1.2.3'], 'patch');
    assert.deepEqual(outputs, expected('v1.2.3', '1.2.3', '1.2.4'));
  });

  it('uses the highest version, not the newest commit', async () => {
    const { outputs } = await runWithTags(['v1.10.0', 'v1.9.0'], 'patch');
    assert.deepEqual(outputs, expected('v1.10.0', '1.10.0', '1.10.1'));
  });

  it('ignores pre-release and non-semver tags', async () => {
    const { outputs } = await runWithTags(['v1.2.0', 'v2.0.0-rc1', 'release-x', 'v3', 'v4.1'], 'minor');
    assert.deepEqual(outputs, expected('v1.2.0', '1.2.0', '1.3.0'));
  });

  it('parses tags without the v prefix', async () => {
    const { outputs } = await runWithTags(['1.2.3'], 'patch');
    assert.deepEqual(outputs, expected('1.2.3', '1.2.3', '1.2.4'));
  });

  it('compares tags with and without the v prefix', async () => {
    const { outputs } = await runWithTags(['1.10.0', 'v1.2.3'], 'patch');
    assert.deepEqual(outputs, expected('1.10.0', '1.10.0', '1.10.1'));
  });

  it('resets patch on minor', async () => {
    const { outputs } = await runWithTags(['v1.2.3'], 'minor');
    assert.deepEqual(outputs, expected('v1.2.3', '1.2.3', '1.3.0'));
  });

  it('resets minor and patch on major', async () => {
    const { outputs } = await runWithTags(['v1.2.3'], 'major');
    assert.deepEqual(outputs, expected('v1.2.3', '1.2.3', '2.0.0'));
  });

  it('defaults to patch', async () => {
    const { outputs } = await runWithTags(['v1.2.3']);
    assert.equal(outputs['new-version'], '1.2.4');
  });

  it('rejects an unknown increment type without writing outputs', async () => {
    const { raw, error } = await runWithTags(['v1.2.3'], 'huge');
    assert.match(error.message, /increment-type must be one of major, minor, patch/);
    assert.equal(raw, '');
  });

  it('warns and uses local tags when fetching fails', () =>
    withTempDir(async (dir) => {
      const clone = givenRemoteTags(dir, []);
      const env = actionEnv(dir, clone);
      const { lines, log } = quietLog();
      const exec = (command, args, options) => {
        if (args[0] === 'fetch') throw new Error('network down');
        if (args[0] === 'tag') return 'v2.0.0\nv2.1.0\n';
        throw new Error(`unexpected git ${args.join(' ')} in ${options.cwd}`);
      };
      await run({ env, exec, log });
      assert.ok(lines.includes('::warning::Could not fetch tags from remote; using tags available locally'));
      assert.equal(parseOutputFile(readText(env.GITHUB_OUTPUT))['new-version'], '2.1.1');
    }));
});
