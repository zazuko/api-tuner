import jsonld from 'jsonld'
import * as fs from "node:fs/promises";
import {createReadStream} from "node:fs";
import rdf from '@zazuko/env-node'
import { Quad } from '@rdfjs/types'
import {write} from "./n3-writer.js";

declare module '@rdfjs/types' {
  interface Stream extends AsyncIterable<Quad> {}
}

const ns = rdf.namespace('https://api-tuner.described.at/');

(async () => {
  const bodyPath = process.argv[2]

  const curlJsonPath = `${bodyPath}.curl.json`
  const curlJson: Record<string, any> = Object.assign({
    '@context': {
      '@vocab': ns().value,
    },
    '@id': 'http://example.com/response',
    '@type': ns.Response.value,
  }, JSON.parse((await fs.readFile(curlJsonPath)).toString()))

  const responseQuads = await jsonld.toRDF(curlJson) as Quad[]
  const response = rdf.clownface({
    dataset: rdf.dataset(responseQuads)
  }).has(ns.exitcode)

  const contentType: string = curlJson.content_type.substring(0, curlJson.content_type.indexOf(';'))
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

  process.stdout.write(write([...response.dataset]))
})()
