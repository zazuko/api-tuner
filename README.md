# 🎛️ API Tun3r 🎛️

**API** **T**ests **U**sing **n3** **R**ules

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
  --raw              Output raw results from eye
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

## More examples

### Debugging

Setting the `--debug` flag will print verbose response information. The `--raw` flag will print
the raw triples produced by the n3 rules.

Additionally, you can inspect the raw response files, which are written to the system's temp directory. The are prefixed
with `api-tuner`. Thus, you can list them with `ls -l "${TMPDIR:-/tmp}"/api-tuner*`, or upload to CI artifacts, as shown
in the GitHub Workflow step example below.

```yaml
- if: failure()
  name: upload api-tuner response data
  uses: actions/upload-artifact@v7
  with:
    name: api-tuner-debug
    path: '${{ runner.temp }}/api-tuner*'
```
