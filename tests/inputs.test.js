import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { InputError, parseInputs } from '../src/inputs.js';

describe('parseInputs', () => {
  it('defaults to patch and the current directory', () => {
    assert.deepEqual(parseInputs({}), { incrementType: 'patch', workspace: process.cwd() });
  });

  it('reads increment-type and GITHUB_WORKSPACE', () => {
    const config = parseInputs({ 'INPUT_INCREMENT-TYPE': ' minor ', GITHUB_WORKSPACE: '/work' });
    assert.deepEqual(config, { incrementType: 'minor', workspace: '/work' });
  });

  it('rejects unknown increment types', () => {
    assert.throws(
      () => parseInputs({ 'INPUT_INCREMENT-TYPE': 'huge' }),
      (error) => error instanceof InputError && /increment-type must be one of major, minor, patch .* got 'huge'/.test(error.message),
    );
  });
});
