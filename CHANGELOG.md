# api-tuner

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
