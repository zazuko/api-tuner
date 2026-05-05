# API Tuner Rules Documentation

This document describes the N3 rules and vocabulary used by `api-tuner` for defining and executing API tests.

## Table of Contents

- [Namespaces](#namespaces)
- [Defining a Test Case](#defining-a-test-case)
- [HTTP Requests](#http-requests)
  - [Request Object](#request-object)
  - [Simplified Helpers](#simplified-helpers)
  - [Request Bodies](#request-bodies)
  - [Query Parameters](#query-parameters)
- [Assertions](#assertions)
  - [Status Code](#status-code)
  - [Headers](#headers)
  - [Body](#body)
  - [Generic Assertions](#generic-assertions)
- [Utility Rules](#utility-rules)
  - [Logging](#logging)
  - [File Operations](#file-operations)

## Namespaces

Commonly used prefixes in `api-tuner` tests:

```turtle
PREFIX tuner: <https://api-tuner.described.at/>
PREFIX resource: <https://api-tuner.described.at/resource#>
PREFIX earl: <http://www.w3.org/ns/earl#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX log: <http://www.w3.org/2000/10/swap/log#>
PREFIX string: <http://www.w3.org/2000/10/swap/string#>
```

## Defining a Test Case

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

## HTTP Requests

### Request Object

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

### Simplified Helpers

The `resource:` namespace provides shortcuts for common HTTP methods. These helpers automatically assert a `200 OK` response status unless used in a way that captures the response for further assertions.

- `( <url> ?res ) resource:getIn []`
- `( <url> ?body ?res ) resource:postIn []`
- `( <url> ?res ) resource:postIn []` (no body)
- `( <url> ?body ?res ) resource:putIn []`

Example:
```turtle
( <http://example.com> ?res ) resource:getIn [] .
```

### Request Bodies

`api-tuner` supports different types of request bodies:

1.  **Inline RDF**: Uses an N3 formula. It is serialized as Turtle and sent with `Content-Type: text/turtle`.
    ```turtle
    tuner:body { <#s> <#p> <#o> }
    ```
2.  **File Reference**: Sends the contents of a local file.
    ```turtle
    tuner:body <file:data.json>
    ```
3.  **Multipart Form**:
    ```turtle
    tuner:body [
      tuner:form ( "field1" "value1" ) ;
      tuner:form ( "fileField" <file:photo.jpg> "image/jpeg" ) ;
    ]
    ```

### Query Parameters

Query parameters can be added to a request using `tuner:query`.

```turtle
?req tuner:query ( "name" "value" ) .
```

## Assertions

Assertions are performed on the `tuner:Response` object (usually captured in a variable like `?res`).

### Status Code

Assert the HTTP status code:
```turtle
?res tuner:http_code 200 .
```

### Headers

Assert the presence and value of an HTTP header. Header names are case-insensitive.

- **Exact match**:
  ```turtle
  ?res tuner:header ( "Content-Type" "application/json" ) .
  ```
- **Regex match**:
  ```turtle
  ?res tuner:header ( "Content-Type" "application/.*" string:matches ) .
  ```

### Body

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

### Generic Assertions

Use `tuner:assertThat` to fail a test with a custom message if a condition is not met.

```turtle
{ ?value math:greaterThan 10 }!tuner:assertThat "Value should be greater than 10" .
```

## Utility Rules

### Logging

Print messages to the console during test execution (depending on log level).

- `?message^tuner:info`: Prints an INFO message.
- `?message^tuner:trace`: Prints a DEBUG message.

Example:
```turtle
"Starting request"^tuner:info .
```

### File Operations

- `() file:temp ?path`: Generates a temporary file path.
- `?path file:rm ?any`: Deletes a file.
- `?relative file:libPath ?absolute`: Resolves a path relative to the `api-tuner` library.
