# 🎛️ API Tun3r 🎛️

**API** **T**ests **U**sing **n3** **R**ules

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
- [Example](#example)
- [Run modes](#run-modes)
- [Documentation](#documentation)
  - [Namespaces](#namespaces)
  - [Defining a Test Case](#defining-a-test-case)
  - [HTTP Requests](#http-requests)
  - [Assertions](#assertions)
  - [Utility Rules](#utility-rules)
- [Debugging](#debugging)

## Prerequisites

- [SWI Prolog](https://www.swi-prolog.org/Download.html)

    Follow platform-specific instructions to install locally oor in a docker image.

    To run `api-tuner` in GitHub workflow, you add this action to your jobs:

    ```yaml
    - uses: fabasoad/setup-prolog-action@v1
    ```

- curl 7.83+

## Installation

`npm i api-tuner`

## Usage

```sh
> api-tuner --help
Usage: api-tuner [options] <path>...

Options:
  --lib <path>       Specify rules to include in all tests. Can be used multiple times. Make sure to surround globs in quotes to prevent expansion.
  --silent           Less output
  --debug            Enable debug output
  --sequential       Run test suites sequentially instead of concurrently
  --raw              Output raw results from eyes
  --grep <pattern>   Only run tests whose name or IRI matches the pattern (case-insensitive)
  --base-iri <iri>   Specify the base IRI for parsing the test case files
  --version          Show version information
  --help             Show this help message

```

## Example

Create a test case file `test.n3`:

```turtle
# test.n3
PREFIX earl: <http://www.w3.org/ns/earl#>
PREFIX tuner: <https://api-tuner.described.at/>
prefix resource: <https://api-tuner.described.at/resource#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX string: <http://www.w3.org/2000/10/swap/string#>

<#getExampleDotCom>
  a earl:TestCase ;
  rdfs:label "Simple GET test" ;
  tuner:formula {
    # Execute the request and capture its response
    ( <http://localhost:1080/example.com> ?res ) resource:getIn [] .

    # Check the response status code and content type
    ?res tuner:http_code 200 ;
      tuner:header ( "content-type" "text/html" ) ;
    .

    # Check the body contains the work "Example"
    ?res tuner:body ?body .
    ?body string:contains "Example Domain" .
  } ;
.

```

Execute the test case:

```sh
api-tuner test.n3
```

### Filter tests with --grep

Use the `--grep` option to only run tests whose label or identifier matches a pattern.

- Matching is case-insensitive
- The pattern is checked against, in order:
  - `rdfs:label` of the test case (if present)
  - Otherwise the test case IRI (its URI form)
- Tests that do not match the pattern are skipped and reported as skipped in the summary

Examples:

```sh
# Run only tests whose label/IRI contains "login"
api-tuner --grep "login" tests/**/*.n3

# Run tests matching a more specific phrase
api-tuner --grep "Simple GET" test.n3
```

## Run modes

By default, API Tun3r runs multiple test suites concurrently for faster feedback. Add `--sequential` flag to run suites one by one in the given order.

Notes and recommendations:

- Write tests to be independent and free of shared mutable state (e.g., unique test data, isolated resources). Independent tests enable safe parallel execution and faster CI times.
- If your suites currently depend on ordering or shared state, use `--sequential` as a temporary measure while refactoring toward independence.

Examples:

```sh
# Default (concurrent)
api-tuner --base-iri http://localhost:1080/ tests/**/*.n3

# Force sequential execution
api-tuner --base-iri http://localhost:1080/ --sequential tests/**/*.n3
```

## More examples

See the [Documentation](#documentation) section below for more examples and detailed documentation of the N3 rules.

## Documentation

This section describes the N3 rules and vocabulary used by `api-tuner` for defining and executing API tests.

### Namespaces

Commonly used prefixes in `api-tuner` tests:

```turtle
PREFIX tuner: <https://api-tuner.described.at/>
PREFIX resource: <https://api-tuner.described.at/resource#>
PREFIX earl: <http://www.w3.org/ns/earl#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX log: <http://www.w3.org/2000/10/swap/log#>
PREFIX string: <http://www.w3.org/2000/10/swap/string#>
```

### Defining a Test Case

A test case is defined as an `earl:TestCase`. The core logic of the test resides in `tuner:formula`.

```turtle
<#myTest>
  a earl:TestCase ;
  rdfs:label "Description of my test" ;
  tuner:formula {
    # Test logic goes here
  } .
```

If the formula evaluates to true (all statements inside match), the test is considered `earl:passed`.

### HTTP Requests

#### Request Object

You can define a detailed request using the `tuner:Request` class.

```turtle
<#test> tuner:request [
  a tuner:Request ;
  tuner:method "POST" ;
  tuner:url <http://example.com/api> ;
  tuner:header ( "Accept" "application/json" ) ;
  tuner:query ( "verbose" "true" ) ;
  tuner:body { <#s> <#p> <#o> }
] .
```

To execute the request and get a response:
```turtle
<#test> tuner:request ?req .
?req tuner:response ?res .
```

#### Simplified Helpers

The `resource:` namespace provides shortcuts for common HTTP methods. These helpers automatically assert a `200 OK` response status unless used in a way that captures the response for further assertions.

- `( <url> ?res ) resource:getIn []`
- `( <url> ?body ?res ) resource:postIn []`
- `( <url> ?res ) resource:postIn []` (no body)
- `( <url> ?body ?res ) resource:putIn []`
- `( <url> ?res ) resource:deleteIn []`

Example:
```turtle
( <http://example.com> ?res ) resource:getIn [] .
```

#### Request Bodies

`api-tuner` supports different types of request bodies:

1.  **Inline RDF**: Uses an N3 formula. It is serialized as Turtle and sent with `Content-Type: text/turtle`.
    ```turtle
    tuner:body { <#s> <#p> <#o> }
    ```
2.  **File Reference**: Sends the contents of a local file.
    ```turtle
    tuner:body <file:data.json>
    ```
3.  **URL-Encoded Form** (`application/x-www-form-urlencoded`): Use `tuner:form` directly on the `tuner:Request` object with `( name value )` pairs. Values are percent-encoded automatically.
    ```turtle
    <#test> tuner:request [
      a tuner:Request ;
      tuner:method "POST" ;
      tuner:url <http://example.com/api> ;
      tuner:form ( "foo" "hello world" ) ;
      tuner:form ( "bar" "Ü" ) ;
    ] .
    ```
    This sends `foo=hello%20world&bar=%C3%9C` as the request body.

4.  **Multipart Form** (`multipart/form-data`): Use `tuner:body` with a blank node containing `tuner:form` triples. Each field is a `( name value )` pair. For file uploads, use a `file:` URI and optionally a MIME type as a third element.
    ```turtle
    tuner:body [
      tuner:form ( "field1" "value1" ) ;
      tuner:form ( "fileField" <file:photo.jpg> "image/jpeg" ) ;
    ]
    ```

#### Query Parameters

Query parameters can be added to a request using `tuner:query`.

```turtle
?req tuner:query ( "name" "value" ) .
```

#### Basic Authentication

Use `tuner:basicAuth` to add HTTP Basic Authentication to a request. It takes a list of `( username password )` and automatically sets the `Authorization: Basic ...` header.

```turtle
<#test> tuner:request [
  a tuner:Request ;
  tuner:url <http://example.com/api> ;
  tuner:basicAuth ( "admin" "secret" ) ;
] .
```

#### Shell Variables

Values used in request URL, headers and query params are resolved from the shell environment.

```turtle
<#test> tuner:request [
  a tuner:Request ;
  tuner:url <http://example.com/api/$PATH> ;
  tuner:header ( "X-Api-Key" "$API_KEY" ) ;
  tuner:query ( "q" "$QUERY" ) ;
] .
```

### Assertions

Assertions are performed on the `tuner:Response` object (usually captured in a variable like `?res`).

#### Status Code

Assert the HTTP status code:
```turtle
?res tuner:http_code 200 .
```

#### Headers

Assert the presence and value of an HTTP header. Header names are case-insensitive.

- **Exact match**:
  ```turtle
  ?res tuner:header ( "Content-Type" "application/json" ) .
  ```
- **Regex match**:
  ```turtle
  ?res tuner:header ( "Content-Type" "application/.*" string:matches ) .
  ```

#### Body

- **Raw body string**:
  ```turtle
  ?res tuner:body ?body .
  ?body string:contains "Expected Text" .
  ```
- **RDF Semantics**: If the response is RDF, you can use `log:includes` to check its content.
  ```turtle
  ?res tuner:body ?body.
  ?body log:includes { <#s> <#p> <#o> } .
  ```
  ⚠️ Be careful when using `?res!log:includes` resource path shorthand which will not work inside `tuner:formula`. Please refer to [this discussion](https://github.com/eyereasoner/eye/issues/148#issuecomment-2810940959).

- **JSON Path**: If the response is JSON, you can use `tuner:jsonPath` to assert values within the body.
  ```turtle
  # Exact match
  ?res tuner:jsonPath ( "$.foo" "bar" ) .
  # Custom assertion (e.g. regex, contains, math)
  ?res tuner:jsonPath ( "$.baz" "42" string:contains ) .
  ```
  ⚠️ Note that unlike RDF assersion, JSON Path assertions are used on the response itself, without using `tuner:body`.

#### Generic Assertions

Use `tuner:assertThat` to fail a test with a custom message if a condition is not met.

```turtle
{ ?value math:greaterThan 10 }!tuner:assertThat "Value should be greater than 10" .
```

### Utility Rules

#### Logging

Print messages to the console during test execution (depending on log level).

- `?message^tuner:info`: Prints an INFO message.
- `?message^tuner:trace`: Prints a DEBUG message.

Example:
```turtle
"Starting request"^tuner:info .
```

#### File Operations

- `() file:temp ?path`: Generates a temporary file path.
- `?path file:rm ?any`: Deletes a file.
- `?relative file:libPath ?absolute`: Resolves a path relative to the `api-tuner` library.

#### Executing Shell Commands

Use `tuner:exec` to execute a shell command during a test. The command runs in the directory of the current test file (resolved via `tuner:scriptPath`). The subject of the triple is ignored — you can use `[]` or use shorthand.

```turtle
# Run a command in the test file's directory
[] tuner:exec "npm run build" .

# Chain multiple commands using normal shell syntax
[] tuner:exec "npm ci && npm test" .

# Environment variables are expanded by the shell
[] tuner:exec "curl -s $BASE_URL/health" .

# Shorthand usage
"npm run build"^tuner:exec .
```

Notes:
- This rule is intended for setup/teardown steps inside your test logic.
- Output is not captured by `tuner:exec`. If you need to read command output inside rules, consider using `log:shell`/`log:shellTrimmed` with a string literal command instead.

### Debugging

Setting the `--debug` flag will print verbose response information. The `--raw` flag will print
the raw triples produced by the n3 rules.

Additionally, you can inspect the raw response files, which are written to the system's temp directory. The are prefixed
with `api-tuner`. Thus, you can list them with `ls -l "${TMPDIR:-/tmp}"/api-tuner*`, or upload to CI artifacts, as shown
in the GitHub Workflow step example below.

```yaml
- run: npx api-tuner ...
  env:
    TMPDIR: ${{ runner.temp }}
- if: failure()
  name: upload api-tuner response data
  uses: actions/upload-artifact@v7
  with:
    name: api-tuner-debug
    path: '${{ runner.temp }}/api-tuner*'
```
