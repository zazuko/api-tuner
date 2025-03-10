# 🎛️ API Tun3r 🎛️

**API** **T**ests **U**sing **n3** **R**ules

## Prerequisites

- [SWI Prolog](https://www.swi-prolog.org/Download.html)

Follow platform-specific instructions to install locally oor in a docker image.

To run `api-tuner` in GitHub workflow, you add this action to your jobs:

```yaml
- uses: fabasoad/setup-prolog-action@v1
```

## Installation

`npm i api-tuner`

## Usage

```sh
> api-tuner --help
Usage: api-tuner [options] <path>...

Options:
  --silent           Less output
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

<#getExampleDotCom>
  a earl:TestCase ;
  rdfs:label "Simple GET test" ;
.

# Configure a request
_:req
  a tuner:Request ;
  tuner:url <http://localhost:1080/example.com> ;
  tuner:method "GET" ;
.

{
  # Execute the request and capture its response
  _:req tuner:response ?res .

  # Check the response status code and content type
  ?res tuner:http_code 200 ;
    tuner:header ( "content-type" "text/html" ) ;
  .

  # Check the body contains the work "Example"
  ?res!tuner:body string:contains "Example Domain" .
} => {
  # Use te EARL vocabulary to assert the test passed
  <#getExampleDotCom> earl:outcome earl:passed .
} .
```

Execute the test case:

```sh
api-tuner test.n3
```

## More examples

TBD
