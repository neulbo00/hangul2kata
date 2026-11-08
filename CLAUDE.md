# hangul2kata implementation notes

- This is a pronunciation transcription tool, not a translation tool.
- Preserve every non-Hangul character exactly.
- Never add user lyrics, answer sheets, or final PDF/XLSX content to this public repository.
- Keep phonological processing separate from katakana mapping.
- Treat H1-H5 and reference-site behavior as hypotheses until supported by a multi-example corpus.
- Keep standard-pronunciation accuracy, reference-site reproduction, and final-card reproduction as separate metrics.
- Default options: ng_style=na, final_style=small, boundary_mode=independent.
- boundary_mode values: independent and connected. Connected is experimental and does not claim full phrase-level Korean standard pronunciation.
- Use Node's built-in test runner; avoid unnecessary dependencies.
- The core must remain usable from both browser modules and Node.js.
- Do not add network requests, analytics, external fonts, or runtime CDNs.
