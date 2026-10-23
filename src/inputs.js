import { INCREMENT_TYPES } from './version.js';

export const DEFAULTS = Object.freeze({
  'increment-type': 'patch',
});

export class InputError extends Error {}

export function getInput(env, name) {
  const raw = env[`INPUT_${name.toUpperCase()}`];
  const value = raw === undefined ? DEFAULTS[name] ?? '' : raw;
  return value.trim();
}

export function parseInputs(env) {
  const incrementType = getInput(env, 'increment-type');
  if (!INCREMENT_TYPES.includes(incrementType)) {
    throw new InputError(`increment-type must be one of major, minor, patch (https://semver.org/), got '${incrementType}'`);
  }

  return {
    incrementType,
    workspace: (env.GITHUB_WORKSPACE ?? '').trim() || process.cwd(),
  };
}
