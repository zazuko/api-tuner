import * as fs from 'node:fs/promises'
import { createReadStream } from 'node:fs'
import jsonld from 'jsonld'
import rdf from '@zazuko/env-node'
import { write } from '@jeswr/pretty-turtle'

const ns = rdf.namespace('https://api-tuner.described.at/');

(async () => {
  const bodyPath = process.argv[2]

  const curlJsonPath = `${bodyPath}.curl.json`
  const { response: responseJson, headers: headersJson } = JSON.parse((await fs.readFile(curlJsonPath)).toString())
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
  const responseQuads = await jsonld.toRDF(curlJsonLd)
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
    const bodyGraph = rdf.blankNode()
    const bodyStream = parser.import(createReadStream(bodyPath))
    for await (const quad of bodyStream) {
      response.dataset.add(rdf.quad(quad.subject, quad.predicate, quad.object, bodyGraph))
    }
    response.addOut(ns.body, bodyGraph)
  } else {
    const body = await fs.readFile(bodyPath, 'utf-8')
    if (body) {
      response.addOut(ns.body, body)
    }
  }

  const headers = Object.entries(headersJson).flatMap(([header, values]) =>
    values.map(value => response.blankNode().addOut(ns.name, header).addOut(ns.value, value)))
  response.addOut(ns.headers, headers)

  process.stdout.write(await write([...response.dataset], {
    format: 'text/n3',
  }))
})()
