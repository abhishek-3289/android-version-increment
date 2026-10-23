import { parseInputs } from './inputs.js';
import { readTags } from './git.js';
import { formatVersion, incrementVersion, latestTag, parseVersion } from './version.js';
import { escapeAnnotation, writeOutputs } from './output.js';

export async function run({ env = process.env, exec, log = console.log } = {}) {
  const config = parseInputs(env);
  const warn = (message) => log(`::warning::${escapeAnnotation(message)}`);

  const tag = latestTag(readTags({ cwd: config.workspace, exec, warn }));
  const current = parseVersion(tag);
  const next = incrementVersion(current, config.incrementType);
  const outputs = {
    'latest-tag': tag,
    'tag-version': formatVersion(current),
    'new-version': formatVersion(next),
    'new-version-major': next.major,
    'new-version-minor': next.minor,
    'new-version-patch': next.patch,
  };
  log(`Latest tag: ${tag} -> new version: ${outputs['new-version']}`);
  writeOutputs(env, outputs);
  return { outputs };
}
