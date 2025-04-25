import * as url from 'node:url'
import * as childProcess from 'node:child_process'
import { PassThrough, type Readable } from 'node:stream'
import { resolve } from 'node:path'
import { program } from 'commander'
import getStream from 'get-stream'
import packageJson from './package.json' with { type: 'json' }
import parseTestCase from './lib/parse-test-case.js'
import summariseResults from './lib/summarise-results.js'

const eyePvmPath = url.fileURLToPath(new URL('eye/lib/eye.pvm', import.meta.url))

program
  .name('api-tuner')
  .option('--lib <lib>', 'Specify rules to include in all tests. Can be used multiple times. Make sure to surround globs in quotes to prevent expansion.', (lib, arr: string[]) => [...arr, lib], [])
  .option('--silent', 'Less output', false)
  .option('--debug', 'Enable debug output', false)
  .option('--raw', 'Output raw results from eyes')
  .requiredOption('--base-iri <baseIri>', 'Specify the base IRI for parsing the test case files')
  .option('--version', 'Show version information')
  .argument('[paths...]', 'Paths to test files')
  .parse()

const options = program.opts()

if (options.version) {
  process.stdout.write(`API-TUNER ${packageJson.version}\n`)
  childProcess.execSync(`swipl -x ${eyePvmPath} -- --version`, { stdio: 'inherit' })
  process.exit()
}

if (!program.args.length) {
  program.help()
  process.exit()
}

const eyeArgs = [
  '--quiet',
  '--nope',
  '--pass',
]

if (options.debug) {
  const debugN3Path = url.fileURLToPath(new URL('logging/debug.n3', import.meta.url))
  eyeArgs.push(debugN3Path)
}

if (!options.silent) {
  const infoN3Path = url.fileURLToPath(new URL('logging/info.n3', import.meta.url))
  eyeArgs.push(infoN3Path)
}

const rulesPath = url.fileURLToPath(new URL('rules/*.n3', import.meta.url))

const levelIcon = {
  INFO: 'ℹ️',
  DEBUG: '🐞',
  'Failed assertion': '❌ Failed assertion',
} as const

interface EyeProcessResult {
  stdout: Readable
  stderr: Readable
  success: boolean
}

async function processPath(path: string) {
  return new Promise<EyeProcessResult>(resolve => {
    const testCaseStream = parseTestCase(path, options.baseIri)
    const eyeProc = childProcess.spawn('swipl', [
      '-x',
      eyePvmPath,
      '--',
      ...eyeArgs,
      rulesPath,
      ...options.lib,
      '-',
    ], {
      shell: true,
    })

    testCaseStream.pipe(eyeProc.stdin)

    const stdout = new PassThrough()
    const stderr = new PassThrough()
    eyeProc.on('exit', (code) => {
      resolve({
        stdout,
        stderr,
        success: code === 0,
      })
    })

    eyeProc.stdout.pipe(stdout)
    eyeProc.stderr.pipe(stderr)
  })
}

const testSuites = program.args.map(async (path) => {
  const absolutePath = resolve(process.cwd(), path)

  const result = await processPath(path)
  const summaryPassThrough = new PassThrough()
  const rawPassThrough = new PassThrough()

  result.stdout.pipe(summaryPassThrough)
  result.stdout.pipe(rawPassThrough)

  const validationResult = await summariseResults(summaryPassThrough)

  if (options.raw) {
    const header = options.silent ? '' : `\n⚡️ SUITE   <file://${absolutePath}>\n`
    process.stdout.write(header + await getStream(rawPassThrough))
  }

  if (!result.success) {
    return {
      summary: `\n🔎 SUITE   <file://${absolutePath}>\n❌  FAIL   Test script failed`,
      success: false,
    }
  }

  let summary = `\n🔎 SUITE   <file://${absolutePath}>\n`
  if (!validationResult.success) {
    const stderr = await getStream(result.stderr)
    summary += stderr.replace(/"([^"]*)" TRACE ("([^"]*)")?/gm, (_, level: keyof typeof levelIcon, quoted, text) => {
      return `${levelIcon[level]} ${text || ''}`
    })
  }

  summary += validationResult.summary

  return {
    summary,
    success: validationResult.success,
  }
})

Promise.all(testSuites).then((results) => {
  const summary = results.map(result => result.summary).join('\n')
  if (!options.raw) {
    process.stdout.write(summary + '\n')
  }
  // exit code equals number of failed tests
  process.exit(results.filter(result => !result.success).length)
})
