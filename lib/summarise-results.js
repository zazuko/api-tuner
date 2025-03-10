import { PassThrough } from 'node:stream'
import SHACLValidator from 'rdf-validate-shacl'
import rdf from '@zazuko/env-node'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

const argv = yargs(hideBin(process.argv)).argv

const shapesTtl = new URL('./shapes.ttl', import.meta.url)

;(async () => {
  const shapes = await rdf.dataset().import(rdf.fromFile(shapesTtl))
  const validator = new SHACLValidator(shapes, {
    factory: rdf,
  })

  const dataPassThrough = new PassThrough()
  process.stdin.pipe(dataPassThrough)

  if (!argv.summary) {
    process.stdin.pipe(process.stdout)
  }

  const data = await rdf.dataset().import(rdf.formats.parsers.import('text/n3', dataPassThrough, {
    format: 'n3',
  }))

  const validationReport = validator.validate(data)

  if (argv.summary) {
    const testCases = rdf.clownface({ dataset: data }).has(rdf.ns.rdf.type, rdf.ns.earl.TestCase)

    for (const { value } of testCases.toArray()) {
      const testCase = new URL(value)

      const result = validationReport.results.find(result => result.focusNode.equals(testCase.term))
      if (result?.severity.equals(rdf.ns.sh.Violation)) {
        process.stdout.write(`❌  FAIL <${testCase.hash}> (file://${testCase.pathname})\n`)
      } else {
        process.stdout.write(`✅  PASS <${testCase.hash}> (file://${testCase.pathname})\n`)
      }
    }
  }

  process.exit(validationReport.conforms ? 0 : 1)
})()
