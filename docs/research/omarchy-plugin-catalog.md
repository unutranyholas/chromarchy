# Research: Omarchy plugin catalog

_Snapshot: 2026-09-02._

## Method

“Popular” means the catalog’s reproducible **Most starred** ordering for
community entries. It sorts the numeric GitHub `stars` field descending, then
by plugin name. Stars belong to repositories—not necessarily the individual
plugin—and are not install counts. The marketplace also says its views, copies,
and hearts are aggregate interactions rather than downloads or rankings.

Sources: [catalog](https://plugins.omarchy.org/?sort=stars),
[sorting code](https://github.com/omacom/omarchy-plugin-marketplace/blob/main/site/assets/js/app.js),
[metrics definition](https://github.com/omacom/omarchy-plugin-marketplace#engagement-metrics).

## Twelve most-starred community entries

| Rank | Plugin | Stars | Repository | README summary |
|---:|---|---:|---|---|
| 1 | LetsFG Flights | 1,966 | [LetsFG/LetsFG](https://github.com/LetsFG/LetsFG) | Flight-search bar backed by letsfg.co; its [plugin guide](https://github.com/LetsFG/LetsFG/blob/main/OMARCHY-PLUGIN.md) documents token, network, privacy, install, removal, and validation boundaries. |
| 2 | AI Usage | 390 | [akitaonrails/ai-usagebar](https://github.com/akitaonrails/ai-usagebar) | Omarchy panel plus other frontends for AI quota/balance data; requires a separate executable. [README](https://github.com/akitaonrails/ai-usagebar#omarchy-quattro) |
| 3 | AirPods | 171 | [thisisgm/omarchy-pods](https://github.com/thisisgm/omarchy-pods) | Pod/case battery and listening controls; requires its librepods-derived daemon. [README](https://github.com/thisisgm/omarchy-pods#requirements) |
| 4 | Omarchy Spotify | 165 | [stappmus/Omarchy-Spotify](https://github.com/stappmus/Omarchy-Spotify) | Theme-aware Quickshell Spotify client; requires Spotify Premium and documents complete removal. [README](https://github.com/stappmus/Omarchy-Spotify#install) |
| 5 | Omamail | 135 | [huacnlee/omamail](https://github.com/huacnlee/omamail) | Gmail/HEY/IMAP+SMTP client with keyring credentials, bar unread count, and panel/window. [README](https://github.com/huacnlee/omamail#add-it-to-omarchy) |
| 6 | SHIBUMI | 123 | [HANCORE-linux/Shibumi-Shell](https://github.com/HANCORE-linux/Shibumi-Shell) | Full replacement bar and plugin suite with its own installation lifecycle. [README](https://github.com/HANCORE-linux/Shibumi-Shell#install) |
| 7 | Mihoro | 112 | [huacnlee/omarchy-mihoro](https://github.com/huacnlee/omarchy-mihoro) | Bar panel for the separately installed Mihoro/Mihomo proxy CLI. [README](https://github.com/huacnlee/omarchy-mihoro#requirements) |
| 8 | Lock Screen Explorer | 104 | [SirJul1337/omarchy-lock-explorer](https://github.com/SirJul1337/omarchy-lock-explorer) | Lock-screen replacement/design picker cloned from `omarchy.lock`. [README](https://github.com/SirJul1337/omarchy-lock-explorer#install) |
| 9 | Time Machine | 91 | [jankeesvw/omarchy-time-machine](https://github.com/jankeesvw/omarchy-time-machine) | Scheduled encrypted Restic backups and restore browser. [README](https://github.com/jankeesvw/omarchy-time-machine#install) |
| 10 | Tesla | 72 | [jankeesvw/omarchy-tesla](https://github.com/jankeesvw/omarchy-tesla) | Tesla owner-API panel requiring a refresh token and throttling reads so the car can sleep. [README](https://github.com/jankeesvw/omarchy-tesla#install) |
| 11 | hyprmoncfg | 68 | [crmne/omarchy-hyprmoncfg](https://github.com/crmne/omarchy-hyprmoncfg) | Visual monitor/profile manager requiring hyprmoncfg and its daemon. [README](https://github.com/crmne/omarchy-hyprmoncfg#requirements) |
| 12 | Okomart | 56 | [brianblakely/omarchy-plugins](https://github.com/brianblakely/omarchy-plugins) | GUI storefront for finding, installing, enabling, updating, and removing plugins. [README](https://github.com/brianblakely/omarchy-plugins#okomart) |

## Recurring patterns

### README and lifecycle

1. **Standard installation dominates.** Ten of twelve document
   `omarchy plugin add https://github.com/<owner>/<repo>[.git] --enable`.
   Time Machine separates add/enable/bar placement; SHIBUMI is a suite with its
   own installer. This matches Omarchy’s root-`manifest.json` repository model.
   [Official manual](https://github.com/basecamp/omarchy/blob/quattro/manual/32-shell-plugins.md)
2. **Dependencies are explicit.** Strong READMEs list binaries, daemons,
   accounts, credentials, privileges, and services separately from plugin
   installation rather than implying that `plugin add` installs them.
3. **Removal is a real lifecycle.** Better READMEs distinguish removing the
   checkout from deleting credentials, services, caches, packages, or generated
   configuration. See [Spotify](https://github.com/stappmus/Omarchy-Spotify#remove-it-completely),
   [Tesla](https://github.com/jankeesvw/omarchy-tesla#removing-it), and
   [hyprmoncfg](https://github.com/crmne/omarchy-hyprmoncfg#remove).
4. **Visual and operational documentation is common.** Ten repositories have a
   root `preview.png`; READMEs commonly include screenshots, bar placement,
   keyboard or IPC usage, configuration, troubleshooting, and an unsandboxed
   code warning.

### Manifest

Eleven selections are ordinary root-manifest repositories; SHIBUMI is the
suite-layout exception.

- All ordinary plugins use `schemaVersion: 1`, a namespaced non-reserved `id`,
  `name`, `version`, `author`, `description`, `kinds`, and `entryPoints`.
- All eleven declare MIT in the manifest and ship a license file. MIT is a
  sample convention, not a catalog requirement.
- Nine expose `bar-widget`; five also or alternatively expose `service`, three
  expose `panel`, and Lock Screen Explorer exposes `overlay` plus `service`.
- Every kind has the matching entry-point key. Entry points may be nested.
- Bar widgets commonly add display name/description/category,
  `allowMultiple`, `defaultSection`, and sometimes defaults/settings schemas.
- Optional fields include `license`, `homepage`, `activation`, `keepLoaded`,
  and specialized metadata such as `omarchy.clonedFrom`.

The shell validator—not the sample—is authoritative. It checks the schema,
required fields, non-reserved ID, safe relative existing entry points, and
rejects symlinks.
[Official reference](https://github.com/basecamp/omarchy/blob/quattro/shell/plugins/README.md)

### Releases

Release practice is inconsistent. Every ordinary plugin has a manifest version,
but tags, GitHub Releases, changelogs, and release workflows are not submission
requirements. More engineered projects coordinate several of them:
[AI Usage changelog](https://github.com/akitaonrails/ai-usagebar/blob/main/CHANGELOG.md),
[Spotify changelog](https://github.com/stappmus/Omarchy-Spotify/blob/main/CHANGELOG.md),
[SHIBUMI release guide](https://github.com/HANCORE-linux/Shibumi-Shell/blob/main/docs/development/release.md).

Keeping manifest version, tag, and release notes synchronized is a useful
inferred convention, not a verified marketplace requirement.

## How to enter the catalog

Verified from the marketplace’s
[README](https://github.com/omacom/omarchy-plugin-marketplace),
[submission guide](https://github.com/omacom/omarchy-plugin-marketplace/blob/main/SUBMISSION.md),
[security policy](https://github.com/omacom/omarchy-plugin-marketplace/blob/main/SECURITY.md),
and [issue form](https://github.com/omacom/omarchy-plugin-marketplace/blob/main/.github/ISSUE_TEMPLATE/submit-plugin.yml):

1. Submit a **public GitHub repository root URL** containing **one plugin**, a
   valid root `manifest.json`, root README with installation and removal
   instructions, root license file, and documented external dependencies.
2. Choose a globally unique, permanent, namespaced lowercase ID outside
   `omarchy.*`. Retired IDs cannot be reused.
3. Run `omarchy plugin validate`. The marketplace additionally checks repository
   structure and Omarchy Quattro compatibility.
4. Optionally add one root preview (`png`, `jpg`, `jpeg`, `webp`, or `avif`),
   at most 50 MB and 40 megapixels. The marketplace strips metadata and creates
   optimized variants.
5. Choose exactly one category and one to three allowed tags. Current useful
   choices for Chromarchy are probably category `Appearance` and tags
   `bar`, `quickshell`.
6. Confirm all five attestations: public repository with install/removal docs;
   license and dependencies documented; ownership/permission for code/assets;
   no configuration overwrite without explicit consent; and understanding that
   listing is not a security review.
7. Open the official
   [Submit a plugin issue](https://github.com/omacom/omarchy-plugin-marketplace/issues/new?template=submit-plugin.yml).
   CLI submissions must use `[Plugin]: <name>`, the repository root URL, all six
   headings in order, valid category/tags, and the exact checked checklist.
8. Automation validates and statically scans the exact full commit SHA without
   executing plugin code. Results are `passed`, `review-required`, or
   `needs-fixes`; incomplete scans fail closed.
9. A write-authorized maintainer must explicitly apply
   `approved-and-verified`. Publication performs a fresh matching scan and binds
   approval to the exact repository, plugin set, SHA, policy, findings, and
   capabilities. Blocking findings must be fixed.
10. Fix validation failures in the same repository/issue and edit the issue to
    rerun validation; do not open duplicates.

Marketplace verification covers only the recorded commit. Current
`omarchy plugin add` and update commands obtain mutable upstream HEAD, so
installation is not bound to the verified snapshot. Plugins remain unsandboxed.

## Applied to Chromarchy

Before publication, Chromarchy adopted the ordinary single-repository layout:

- root `manifest.json` with a nested `plugin/BarWidget.qml` entry point;
- standard `omarchy plugin add ... --enable` installation;
- explicit basic and complete removal instructions;
- documented its system-Python helper and bundled-library dependencies;
- root MIT license and manifest license/homepage metadata;
- a 1600×900 root preview built from an actual popup capture.

The remaining external steps are creating the public GitHub repository and
submitting its exact commit through the marketplace issue form. Re-check the
marketplace `main` branch and live form immediately before submission because
the workflow changes quickly.

## Residual risks

- Star counts drift and are repository-level. LetsFG’s stars reflect a broader
  project; SHIBUMI is a suite.
- README inspection verifies documentation, not runtime correctness or safety;
  none of the plugins was installed or executed.
- Existing special layouts do not override the current new-submission guide’s
  explicit one-plugin/root-manifest requirement.
