import * as url from 'node:url'
import { createReadStream } from 'node:fs'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import replaceStream from 'replacestream'
import isAbsoluteUrl from 'is-absolute-url'
import StreamConcat from 'stream-concat'

const argv = yargs(hideBin(process.argv)).argv

const baseIri = argv['base-iri'] || 'http://example.org/'
const testCases = argv._

function replacer(fileUrl) {
  return (_, match) => {
    if (match.startsWith('#')) {
      return `<${fileUrl}${match}>`
    }

    if (isAbsoluteUrl(match)) {
      return `<${match}>`
    }

    return `<${baseIri}${match}>`
  }
}

let fileIndex = 0
function nextStream() {
  if (fileIndex === testCases.length) {
    return null
  }
  const testCase = testCases[fileIndex++]
  const testCaseUrl = url.pathToFileURL(testCase).toString()
  return createReadStream(testCase)
    .pipe(replaceStream(/<([^>]*)>(?=([^"\\]*(\\.|"([^"\\]*\\.)*[^"\\]*"))*[^"]*$)/g, replacer(testCaseUrl)))
}

new StreamConcat(nextStream).pipe(process.stdout)
