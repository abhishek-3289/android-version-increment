import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const GIT_CONFIG = [
  '-c', 'user.name=test',
  '-c', 'user.email=test@example.com',
  '-c', 'init.defaultBranch=main',
  '-c', 'commit.gpgsign=false',
  '-c', 'tag.gpgsign=false',
];

function git(args, cwd) {
  execFileSync('git', [...GIT_CONFIG, ...args], { cwd, stdio: 'ignore' });
}

export function withTempDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), 'android-version-increment-'));
  return Promise.resolve()
    .then(() => fn(dir))
    .finally(() => rmSync(dir, { recursive: true, force: true }));
}

// Creates an origin repository with one commit per tag and a shallow clone without tags,
// like the default actions/checkout.
export function givenRemoteTags(dir, tags = []) {
  const origin = join(dir, 'origin');
  const clone = join(dir, 'clone');
  git(['init', origin], dir);
  git(['commit', '--allow-empty', '-m', 'init'], origin);
  for (const tag of tags) {
    git(['commit', '--allow-empty', '-m', tag], origin);
    git(['tag', tag], origin);
  }
  git(['clone', '--depth', '1', '--no-tags', `file://${origin}`, clone], dir);
  return clone;
}

export function actionEnv(dir, workspace, overrides = {}) {
  const outputFile = join(dir, 'output.txt');
  writeFileSync(outputFile, '');
  return { GITHUB_OUTPUT: outputFile, GITHUB_WORKSPACE: workspace, ...overrides };
}

export function quietLog() {
  const lines = [];
  return { lines, log: (line) => lines.push(line) };
}

export function readText(path) {
  return readFileSync(path, 'utf8');
}

export function parseOutputFile(content) {
  const outputs = {};
  const lines = content.split('\n');
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line) continue;
    const heredoc = line.match(/^([^=<]+)<<(.+)$/);
    if (heredoc) {
      const value = [];
      index += 1;
      while (lines[index] !== heredoc[2]) {
        value.push(lines[index]);
        index += 1;
      }
      outputs[heredoc[1]] = value.join('\n');
    } else {
      const separator = line.indexOf('=');
      outputs[line.slice(0, separator)] = line.slice(separator + 1);
    }
  }
  return outputs;
}
