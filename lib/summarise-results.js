import SHACLValidator from 'rdf-validate-shacl'
import rdf from '@zazuko/env-node'

const shapesTtl = new URL('./shapes.ttl', import.meta.url)

;(async () => {
  const shapes = await rdf.dataset().import(rdf.fromFile(shapesTtl))
  const validator = new SHACLValidator(shapes, {
    factory: rdf,
  })

  const data = await rdf.dataset().import(rdf.formats.parsers.import('text/n3', process.stdin, {
    format: 'n3',
  }))

  const validationReport = validator.validate(data)

  const testCases = rdf.clownface({ dataset: data }).has(rdf.ns.rdf.type, rdf.ns.earl.TestCase)

  for (const testCase of testCases.toArray()) {
    const result = validationReport.results.find(result => result.focusNode.equals(testCase.term))
    if (result?.severity.equals(rdf.ns.sh.Violation)) {
      process.stdout.write(`❌  FAIL <${testCase.value}>\n`)
    } else {
      process.stdout.write(`✅  PASS <${testCase.value}>\n`)
    }
  }
})()
