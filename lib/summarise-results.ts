import type { Readable } from 'node:stream'
import SHACLValidator from 'rdf-validate-shacl'
import rdf from '@zazuko/env-node'

const shapesTtl = new URL('./shapes.ttl', import.meta.url)

interface Result {
  summary: string
  success: boolean
}

export default async (resultStream: Readable): Promise<Result> => {
  const shapes = await rdf.dataset().import(rdf.fromFile(shapesTtl))
  const validator = new SHACLValidator(shapes, {
    factory: rdf,
  })

  const data = await rdf.dataset().import(rdf.formats.parsers.import('text/n3', resultStream, {
    format: 'n3',
  })!)

  const validationReport = await validator.validate(data)

  const testCases = rdf.clownface({ dataset: data })
    .has(rdf.ns.rdf.type, rdf.ns.earl.TestCase)
    .toArray()

  const summary = []
  for (const testCase of testCases) {
    const { hash } = new URL(testCase.value)
    const result = validationReport.results.find(result => testCase.term.equals(result.focusNode))
    const label = testCase.out(rdf.ns.rdfs.label).value
    const resultLine = label ? `${label} (<${hash}>)` : `<${hash}>`

    if (rdf.ns.sh.Violation.equals(result?.severity)) {
      summary.push(`❌  FAIL   ${resultLine}`)
    } else {
      summary.push(`✅  PASS   ${resultLine}`)
    }
  }

  return {
    success: validationReport.conforms,
    summary: summary.join('\n'),
  }
}
