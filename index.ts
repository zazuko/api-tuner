import * as url from 'node:url'
import * as childProcess from 'node:child_process'
import { PassThrough, Readable } from 'node:stream'
import { dirname, resolve } from 'node:path'
import { program } from 'commander'
import getStream from 'get-stream'
import mergeStreams from '@sindresorhus/merge-streams'
import rdf from '@zazuko/env-node'
import packageJson from './package.json' with {type: 'json'}
import parseTestCase from './lib/parse-test-case.js'
import summariseResults from './lib/summarise-results.js'

const eyePvmPath = url.fileURLToPath(new URL('eye/lib/eye.pvm', import.meta.url))

const tuner = rdf.namespace('https://api-tuner.described.at/')

program
  .name('api-tuner')
  .option('--lib <lib>', 'Specify rules to include in all tests. Can be used multiple times. Make sure to surround globs in quotes to prevent expansion.', (lib, arr: string[]) => [...arr, lib], [])
  .option('--silent', 'Less output', false)
  .option('--debug', 'Enable debug output', false)
  .option('--sequential', 'Run test suites sequentially instead of concurrently', false)
  .option('--raw', 'Output raw results from eyes')
  .option('--grep <pattern>', 'Only run tests matching the given pattern')
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

const infoN3Path = url.fileURLToPath(new URL('logging/info.n3', import.meta.url))
eyeArgs.push(infoN3Path)

const rulesPath = url.fileURLToPath(new URL('rules/*.n3', import.meta.url))

const levelIcon = {
  INFO: 'ℹ️',
  DEBUG: '🐞',
  'Failed assertion': '❌ Failed assertion',
} as const

function writeSummary(summary: string) {
  if (options.raw) return
  const out = summary.endsWith('\n') ? summary : summary + '\n'
  process.stdout.write(out)
}

function suiteHeader(absolutePath: string) {
  return `\n🔎 SUITE   <file://${absolutePath}>\n`
}

interface EyeProcessResult {
  stdout: Readable
  stderr: Readable
  success: boolean
}

async function processPath(path: string) {
  return new Promise<EyeProcessResult>(resolve => {
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

    mergeStreams([
      parseTestCase(path, options.baseIri),
      tunerParams({ path }),
    ]).pipe(eyeProc.stdin)

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

function tunerParams({ path }: { path: string }): Readable {
  const graph = rdf.clownface()
    .blankNode()
    .addOut(tuner.scriptPath, dirname(resolve(path)))

  if (options.grep) {
    graph.addOut(tuner.grep, options.grep)
  }

  return Readable.from(graph.dataset.toCanonical())
}

async function runSuite(path: string) {
  const absolutePath = resolve(process.cwd(), path)

  const result = await processPath(path)
  const summaryPassThrough = new PassThrough()
  const rawPassThrough = new PassThrough()

  result.stdout.pipe(summaryPassThrough)
  result.stdout.pipe(rawPassThrough)

  const validationResult = await summariseResults(summaryPassThrough)

  if (validationResult.allTestsSkipped) {
    const summary = `⏳  SKIP   <file://${absolutePath}>`
    writeSummary(summary)
    return true
  }

  if (options.raw) {
    const header = options.silent ? '' : `\n⚡️ SUITE  <file://${absolutePath}>\n`
    process.stdout.write(header + await getStream(rawPassThrough))
    process.stderr.write(header + await getStream(result.stderr))
  }

  if (!result.success) {
    const summary = `${suiteHeader(absolutePath)}❌  FAIL   Test script failed`
    writeSummary(summary)
    return false
  }

  let summary = suiteHeader(absolutePath)
  if (!validationResult.success || !options.silent) {
    const stderr = await getStream(result.stderr)
    summary += stderr.replace(/"([^"]*)" TRACE ("([^"]*)")?/gm, (_, level: keyof typeof levelIcon, quoted, text) => {
      return `${levelIcon[level]} ${text || ''}`
    })
  }

  summary += validationResult.summary + '\n'
  writeSummary(summary)
  return validationResult.success
}

async function runAllSuites() {
  let results: boolean[] = []

  if (options.sequential) {
    for (const path of program.args as string[]) {
      // Run each suite one by one
      // Raw output (if enabled) is already streamed inside runSuite
      const ok = await runSuite(path)
      results.push(ok)
    }
  } else {
    results = await Promise.all((program.args as string[]).map(runSuite))
  }

  // Summaries are written directly by runSuite (unless --raw),
  // so nothing else to print here.
  // exit code equals number of failed tests
  process.exit(results.filter(success => !success).length)
}

runAllSuites()
