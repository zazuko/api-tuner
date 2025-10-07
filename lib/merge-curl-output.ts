import * as fs from 'node:fs/promises'
import { createReadStream } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import type { Readable } from 'node:stream'
import url from 'node:url'
// eslint-disable-next-line import/default
import jsonld from 'jsonld'
import rdf from '@zazuko/env-node'
import { write } from '@jeswr/pretty-turtle'
import type { DatasetCore, Quad } from '@rdfjs/types'

declare module '@rdfjs/types' {
  interface Stream extends AsyncIterable<Quad> {
  }
}

interface CurlFile {
  response: Record<string, string | number | null>
  headers: Record<string, string[]>
}

const ns = rdf.namespace('https://api-tuner.described.at/');

(async () => {
  const bodyPath = process.argv[2]

  const curlJsonPath = `${bodyPath}.curl.json`
  const { response: responseJson, headers: headersJson } = JSON.parse((await fs.readFile(curlJsonPath)).toString()) as CurlFile
  /**
   * @type {Record<string, string | number | null>}
   */
  const curlJsonLd = Object.assign({
    '@context': {
      '@vocab': ns().value,
    },
  }, responseJson)

  /**
   * @type {import('@rdfjs/types').Quad[]}
   */
  const responseQuads = await jsonld.toRDF(curlJsonLd) as DatasetCore
  const response = rdf.clownface({
    dataset: rdf.dataset(responseQuads),
  }).has(ns.exitcode).addOut(rdf.ns.rdf.type, ns.Response)

  let contentType
  if (typeof responseJson.content_type === 'string') {
    contentType = responseJson.content_type.substring(0, responseJson.content_type.indexOf(';')) || responseJson.content_type
  }
  let parser
  if (contentType) {
    parser = rdf.formats.parsers.get(contentType)
  }
  if (parser) {
    const body = parser.import(createReadStream(bodyPath))
    await writeFile(`${bodyPath}.nt`, rdf.formats.serializers.get('application/n-triples')!.import(body) as Readable)
    response.addOut(ns.body, rdf.namedNode(url.pathToFileURL(`${bodyPath}.nt`).toString()))
  } else {
    response.addOut(ns.body, bodyPath)
  }

  const headers = Object.entries(headersJson).flatMap(([header, values]) =>
    values.map(value => response.blankNode().addOut(ns('name'), header).addOut(ns.value, value)))
  response.addOut(ns.headers, headers)

  process.stdout.write(await write([...response.dataset], {
    format: 'text/n3',
  }))
})()
