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
    const resultMap = rdf.clownface({ dataset: data })
      .has(rdf.ns.rdf.type, rdf.ns.earl.TestCase)
      .toArray()
      .reduce((map, testCase) => {
        const { pathname } = new URL(testCase)

        const testCases = map.get(pathname) || []
        testCases.push(testCase)

        return map.set(pathname, testCases)
      }, new Map())

    for (const [pathname, testCases] of resultMap.entries()) {
      process.stdout.write(`\n🔎 SUITE  <file://${pathname}>\n`)

      for (const testCase of testCases) {
        const { hash } = new URL(testCase.value)
        const result = validationReport.results.find(result => result.focusNode.equals(testCase.term))
        const label = testCase.out(rdf.ns.rdfs.label).value
        const resultLine = label ? `${label} (<${hash}>)` : `<${hash}>`

        if (result?.severity.equals(rdf.ns.sh.Violation)) {
          process.stderr.write(`❌  FAIL   ${resultLine}\n`)
        } else {
          process.stderr.write(`✅  PASS   ${resultLine}\n`)
        }
      }
    }
  }

  process.exit(validationReport.conforms ? 0 : 1)
})()
