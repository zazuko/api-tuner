# api-tuner

## 0.5.1

### Patch Changes

- 475aec9: build(deps): bump tar from 7.5.1 to 7.5.2

## 0.5.0

### Minor Changes

- 72786bf: File paths in multipart form data should be relative to the script source

### Patch Changes

- 6d72414: Wrap multipart field nams in quotes

## 0.4.2

### Patch Changes

- 743f3ef: Use node to download eye

## 0.4.1

### Patch Changes

- fc667a6: Fixes an issue where blank nodes in response bodies would be interpreted as universally quantified variables.

## 0.4.0

### Minor Changes

- baed07f: Introduces `tuner:formula` as object of `earl:TestCase`

### Patch Changes

- baed07f: Added `resource:getIn`, `resource:postIn`, `resource:putIn` helpers
- a271634: Info messages were not shown unless a test case failed. Now they are displayed by default, if the `--silent` flag is set

## 0.3.4

### Patch Changes

- 5fb8cb9: `tuner:query` to set query params without altering the request URL
- e8b60be: Arguments passed with `-F` were not properly quoted

## 0.3.3

### Patch Changes

- 5ffaf1f: Script looked for test files in wrong directory

## 0.3.2

### Patch Changes

- acab1de: Temporary files are written to actual temporary directory

## 0.3.1

### Patch Changes

- 3127d53: Failed assertion were not nicely rewritten
- 703310d: Report failed test script (fixes #22)
- 8ffb6ad: Fixed packaging
- fb85dd3: Display eye logs only when tests fail
- a1695f3: `--lib` was ignored

## 0.3.0

### Minor Changes

- 337f523: `--base-iri` is now required

### Patch Changes

- 337f523: Rewrite main script to JS

## 0.2.6

### Patch Changes

- eb209a8: Rewrite eye trace lines for nicer output
- eb209a8: Added `--no-parallel` option to make it easier to look at logs

## 0.2.5

### Patch Changes

- 85e82c3: `--lib` globs were not correctly expanded

## 0.2.4

### Patch Changes

- 9dc894c: Fix the fix from 0.2.3

## 0.2.3

### Patch Changes

- 3db9152: `tuner:assertThat` sometimes did not write the expected message

## 0.2.2

### Patch Changes

- 42adb7b: `--lib` option

## 0.2.1

### Patch Changes

- 6bf7006: Run tests sequentially

## 0.2.0

### Minor Changes

- d8e9772: Change how tests are parsed to assume that hash URLs are resolved against test source's `file://` URL and everything else requires `--base-iri`

### Patch Changes

- 0907960: Updated eye to v11.10.0

## 0.1.4

### Patch Changes

- 51493a9: Added `tuner:assertThat` backward rule

## 0.1.3

### Patch Changes

- cd11255: Exit code was '0' when the eye process fail
- c2a477e: Temporary request body file was not removed

## 0.1.2

### Patch Changes

- 83f1910: When uploading files in a multipart request, their media type can be defined using a third argument like `tuner:form ( "name" <file:path> "metia/type" )`
- 8774b4a: When request fails, ensure that the temporary files are cleaned-up

## 0.1.1

### Patch Changes

- 3f879e5: Multipart `tuner:body` was not always correctly matched

## 0.1.0

### Minor Changes

- 1aa3431: First release with basic testing functionality, response code assertions, header assertions, and support for inline RDF bodies, bodies from files, and `multipart/form-data` payloads.
