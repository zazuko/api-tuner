# api-tuner

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
