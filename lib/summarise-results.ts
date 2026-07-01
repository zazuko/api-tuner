import type { Readable } from 'node:stream'
import rdf from '@zazuko/env-node'

interface Result {
  summary: string
  success: boolean
  allTestsSkipped: boolean
}

export default async (resultStream: Readable): Promise<Result> => {
  const data = await rdf.dataset().import(rdf.formats.parsers.import('text/n3', resultStream, {
    format: 'n3',
  })!)

  const testCases = rdf.clownface({ dataset: data })
    .has(rdf.ns.rdf.type, rdf.ns.earl.TestCase)
    .toArray()

  const summary = []
  let success = true
  let allTestsSkipped = true
  for (const testCase of testCases) {
    const { hash } = new URL(testCase.value)
    const label = testCase.out(rdf.ns.rdfs.label).value
    const resultLine = label ? `${label} (<${hash}>)` : `<${hash}>`

    if (testCase.has(rdf.ns.earl.outcome, rdf.ns.earl.passed).values.length) {
      summary.push(`✅  PASS   ${resultLine}`)
      allTestsSkipped = false
    } else if (testCase.has(rdf.ns.earl.outcome, rdf.ns.earl.failed).values.length) {
      summary.push(`❌  FAIL   ${resultLine}`)
      allTestsSkipped = false
      success = false
    } else {
      summary.push(`⏳  SKIP   ${resultLine}`)
    }
  }

  return {
    success,
    summary: summary.join('\n'),
    allTestsSkipped,
  }
}
