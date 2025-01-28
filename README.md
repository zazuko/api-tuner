# 🎛️ API Tun3r 🎛️

**API** **T**ests **U**sing **n3** **R**ules

## Prerequisites

- [SWI Prolog](https://www.swi-prolog.org/Download.html)

## Installation

`npm i api-tuner`

## Usage

```sh
> api-tuner --help
Usage: api-tuner [options] <path>...

Options:
  --debug            Enable debug output
  --raw              Output raw results from eye
  --base-iri <iri>   Specify the base IRI for parsing the test case files
  --version          Show version information
  --help             Show this help message
```

## Example

Create a test case file `test.n3`:

```turtle
# test.n3
PREFIX : <http://example.com/>
PREFIX earl: <http://www.w3.org/ns/earl#>
PREFIX tuner: <https://api-tuner.described.at/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX log: <http://www.w3.org/2000/10/swap/log#>
PREFIX string: <http://www.w3.org/2000/10/swap/string#>

:getExampleDotCom
  a earl:TestCase ;
  rdfs:label "Simple GET test" ;
.

# Configure a request
:req
  a tuner:Request ;
  tuner:url <http://example.com/> ;
  tuner:method "GET" ;
.

{
  # Execute the request and capture its response
  :req tuner:response ?res .

  # Check the response status code and content type
  ?res log:includes {
    [] tuner:http_code 200 .
    [] tuner:header ( "content-type" "text/html" ) .
  } .

  # Check the body contains the work "Example"
  ?res log:includes {
    [] tuner:body ?body .
  } .

  # Note that assertions on ?body are outside the log:includes block
  ?body string:contains "Example Domain" .
} => {
  # Use te EARL vocabulary to assert the test passed
  :getExampleDotCom earl:outcome earl:passed .
} .

```

Execute the test case:

```sh
api-tuner test.n3
```

## More examples

TBD
