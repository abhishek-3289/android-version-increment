# Android App Version Increment ➕

[![My Skills](https://skillicons.dev/icons?i=githubactions,gradle,androidstudio&perline=3)](https://skillicons.dev)

## Use 📄

### Example ⌨️

```yaml
    permissions:
      contents: write

    steps:
      - name: Checkout code
        uses: actions/checkout@v7

      - name: Update version
        uses: abhishek-3289/android-version-increment@v1
        with:
          increment-type: patch
          update-release-notes: true

      - name: Commit and Push Changes
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git commit -am "Update version"
          git push origin HEAD
```


### Description 🔖

This action fetches the highest _normal_ semantic version (semver) from the tags in
a git repository. It will increment the version as directed (by default: +1 to
the patch digit). A gradle command will be executed to update android application version for major.minor.patch and buildMeta.
Plugin for android versioning https://plugins.gradle.org/plugin/net.thauvin.erik.gradle.semver.

Only tags of the form `MAJOR.MINOR.PATCH` or `vMAJOR.MINOR.PATCH` are considered; pre-release and
other tags are ignored. If no such tag exists, `v0.0.0` is used. Tags are fetched from the remote by
the action itself, so the default shallow `actions/checkout` works.

```groovy
tasks.register('updateReleaseNotesVersion') {
    doFirst {
        def version = "v${semver.major}.${semver.minor}.${semver.patch}"
        ant.replaceregexp(match: '^v\\d+.\\d+.\\d+', replace: version, flags: 's', byline: false) {
            fileset(dir: 'release-notes', includes: '**/*.txt')
        }
    }
}
```

### Inputs 📥

| name                    | description                                                                                                                                       | required | default         |
|:------------------------|:--------------------------------------------------------------------------------------------------------------------------------------------------|:---------|:----------------|
| increment-type          | The digit to increment, either `major`, `minor` or `patch`.                                                                                       | No       | `patch`         |
| update-release-notes    | Set to `true` for updating release notes; This will execute gradle task `updateReleaseNotesVersion` which can be added into your android project. | No       | `false`         |
| setup-java              | Set to `false` to skip JDK setup when your workflow already runs `actions/setup-java`.                                                            | No       | `true`          |
| java-version            | JDK version used to run Gradle.                                                                                                                   | No       | `17`            |
| java-distribution       | JDK distribution passed to `actions/setup-java`.                                                                                                  | No       | `zulu`          |
| working-directory       | Directory containing the `gradlew` wrapper.                                                                                                       | No       | `.`             |
| github-token            | Token passed to `gradle/actions/setup-gradle` for GitHub API access.                                                                              | No       | `github.token`  |

### Outputs 📤

1. **latest-tag** :- Latest tag or default `v0.0.0` if tag does not exist.
2. **tag-version** :- Tag version without `v` eg: `1.0.0`.
3. **new-version** :- Incremented version.
4. **new-version-major** :- Incremented major version.
5. **new-version-minor** :- Incremented minor version.
6. **new-version-patch** :- Incremented patch version.

## Examples 🧪

- [`examples/bump-version-pr.yml`](examples/bump-version-pr.yml) bumps the version on demand and opens a pull request with the change. The repository setting *Allow GitHub Actions to create and approve pull requests* must be enabled.
- [`examples/bump-version-and-tag.yml`](examples/bump-version-and-tag.yml) uses its own JDK (`setup-java: false`), commits the bump, pushes a `vX.Y.Z` tag and builds the release APK.
- [`examples/gradle-project`](examples/gradle-project) is a minimal Gradle project wired with the semver plugin and the `updateReleaseNotesVersion` task. CI runs the action against it.

## Development 🛠️

```bash
bash tests/version_script_test.sh
```

The tests create throwaway git repositories, so they need only `git` and `bash`. To try the Gradle side locally:

```bash
cd examples/gradle-project
./gradlew incrementBuildMeta -Dversion.major=1 -Dversion.minor=2 -Dversion.patch=0 updateReleaseNotesVersion
```

| Workflow | Trigger | What it does |
|:---------|:--------|:-------------|
| [CI](.github/workflows/ci.yml) | push to `main`, pull requests | ShellCheck, actionlint, unit tests on Ubuntu and macOS, and an integration run of the action against `examples/gradle-project`. |
| [Release](.github/workflows/release.yml) | manual (`patch` / `minor` / `major`) | Runs CI, calculates the next version with this action's own script, publishes a GitHub release with generated notes, and moves the `vMAJOR` tag. |
