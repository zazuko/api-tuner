import * as url from 'node:url'
import { createReadStream } from 'node:fs'
import type { Readable } from 'node:stream'
import replaceStream from 'replacestream'
import isAbsoluteUrl from 'is-absolute-url'

export default function (testCase: string, baseIri: string): Readable {
  function replacer(fileUrl: string) {
    return (_: unknown, match: string) => {
      if (match.startsWith('#')) {
        return `<${fileUrl}${match}>`
      }

      if (isAbsoluteUrl(match)) {
        return `<${match}>`
      }

      return `<${baseIri}${match}>`
    }
  }

  const testCaseUrl = url.pathToFileURL(testCase).toString()
  return createReadStream(testCase)
    .pipe(replaceStream(/<([^>]*)>(?=([^"\\]*(\\.|"([^"\\]*\\.)*[^"\\]*"))*[^"]*$)/g, replacer(testCaseUrl)))
}
