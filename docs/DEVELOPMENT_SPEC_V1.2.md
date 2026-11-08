# hangul2kata v1.2 implementation specification

## Product purpose
Convert Korean Hangul text into Japanese katakana pronunciation notation for lyric-card preparation. This is not translation. Non-Hangul text must be preserved verbatim.

## Privacy boundary
- Conversion runs entirely in the browser.
- No analytics, external fonts, CDN scripts, network calls, or remote text processing.
- Never commit lyric originals, final lyric-card PDFs/XLSX files, answer keys, or user-provided reference corpora.
- Keep private source material outside the repository. A .gitignore rule is not a security boundary for files already tracked.

## Architecture
1. Unicode Hangul decomposition and pronunciation preprocessing.
2. Intermediate syllable representation preserving source character, onset, vowel, coda, word identity, and raw non-Hangul spans.
3. Independent katakana mapping layer.
4. Browser UI consuming the same ESM core as Node tests.

## Defaults
- ng_style: na
- final_style: small
- boundary_mode: independent

## Boundary modes
- independent: do not apply cross-word phonological rules.
- connected: reserved for explicitly implemented and tested cross-word rules. It must not be described as full phrase-level standard pronunciation.
- Morphology-dependent rules are out of scope unless a separate morphology layer is introduced.

## Rule sequencing
Keep rule passes explicit and testable. Candidate passes include coda neutralization, liaison, ㅎ deletion/aspiration, palatalization, tensification, nasal assimilation, and liquid assimilation. Do not apply a rule solely because two characters are adjacent if its linguistic conditions are not satisfied.

## Mapping
- Map pronunciation output separately from the pronunciation engine.
- Explicitly cover plain, tense, and aspirated onsets.
- Final consonant mapping is configurable: small extension kana or full-size kana.
- Treat ㇷ゚ as U+31F7 followed by U+309A; do not assume NFC turns it into one code point.
- Test font support for small extension kana on target devices.

## User dictionary
- Browser localStorage only.
- JSON import/export.
- If localStorage is unavailable, the converter must continue to work in memory and clearly report that persistence is unavailable.
- Dictionary entries override a whole whitespace-delimited token in the initial implementation.

## Evaluation
Track these independently:
1. Standard Korean pronunciation example pass rate.
2. Reference-site output reproduction rate.
3. Final PDF/XLSX lyric-card reproduction rate.

Reference-site behavior is not the definition of standard pronunciation. H1-H5 remain hypotheses until tested against multiple independent examples. A single song is only a pipeline smoke test.

## Deployment
- GitHub Pages deploys the static `web/` directory.
- CI runs Node's built-in test runner before deployment.
- The source core remains outside the deploy folder and is imported by the web app at runtime; therefore the deployment artifact must include the source modules or a build step must bundle them. Do not deploy only `web/` while leaving imported `../src/` unavailable.

## H1-H5 working hypotheses

These are implementation hypotheses, not verified reference-site behavior.

- H1: plain ㄱ/ㄷ/ㅂ/ㅈ use an unvoiced Japanese row initially and a voiced row after a vowel or sonorant within the same eojeol.
- H2: initial tense onsets ㄲ/ㄸ/ㅃ/ㅆ/ㅉ do not receive a leading small ッ; medial tense onsets do.
- H3: no cross-eojeol liaison, tensification, or assimilation in the default independent mode.
- H4: coda output uses ㇰ/ン/ッ/ㇽ/ㇺ/ㇷ゚ for the neutralized final categories. Complex codas and ㅎ environments require context-sensitive processing.
- H5: the exact ㅂ onset rendering (including possible ポ/ボ variants) remains unresolved and must be decided from a multi-example reference corpus rather than assumed.

## Current implementation limits

- The connected boundary mode is not implemented yet and is disabled in the UI.
- Morphology-sensitive exceptions, liquid assimilation, and several complex-coda exceptions are not complete.
- The current regression suite is a smoke-test set, not a representative accuracy benchmark.
- The current mapping table is an initial baseline and must be compared against the user's reference outputs and final lyric-card examples before claiming reproduction accuracy.
