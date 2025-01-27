import * as fs from 'node:fs/promises'
import { createReadStream } from 'node:fs'
import jsonld from 'jsonld'
import rdf from '@zazuko/env-node'
import { write } from '@jeswr/pretty-turtle'

const ns = rdf.namespace('https://api-tuner.described.at/');

(async () => {
  const bodyPath = process.argv[2]

  const curlJsonPath = `${bodyPath}.curl.json`
  /**
   * @type {Record<string, string | number | null>}
   */
  const curlJson = Object.assign({
    '@context': {
      '@vocab': ns().value,
    },
    '@id': 'http://example.com/response',
    '@type': ns.Response.value,
  }, JSON.parse((await fs.readFile(curlJsonPath)).toString()))

  /**
   * @type {import('@rdfjs/types').Quad[]}
   */
  const responseQuads = await jsonld.toRDF(curlJson)
  const response = rdf.clownface({
    dataset: rdf.dataset(responseQuads),
  }).has(ns.exitcode)

  let contentType
  if (typeof curlJson.content_type === 'string') {
    contentType = curlJson.content_type.substring(0, curlJson.content_type.indexOf(';')) || curlJson.content_type
  }
  if (contentType) {
    const parser = rdf.formats.parsers.get(contentType)
    if (parser) {
      const bodyGraph = rdf.blankNode()
      const bodyStream = parser.import(createReadStream(bodyPath))
      for await (const quad of bodyStream) {
        response.dataset.add(rdf.quad(quad.subject, quad.predicate, quad.object, bodyGraph))
      }
      response.addOut(ns.body, bodyGraph)
    } else {
      response.addOut(ns.body, await fs.readFile(bodyPath, 'utf-8'))
    }
  }

  process.stdout.write(await write([...response.dataset], {
    format: 'text/n3',
  }))
})()
