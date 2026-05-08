#! /usr/bin/env node
/* eslint-disable no-console */
import fs from 'node:fs'
import { spawnSync } from 'node:child_process'
import { Readable } from 'node:stream'
import * as tar from 'tar'

async function main() {
  const EYE_VERSION = process.env.EYE_VERSION

  if (fs.existsSync('eye')) {
    try {
      const versionOutput = spawnSync('eye/bin/eye', ['--version'], { encoding: 'utf-8' })
      if (versionOutput.stderr.includes(EYE_VERSION)) {
        console.log(`EYE v${EYE_VERSION} already installed`)
        return
      }
    } catch (e) {
      console.warn(`Failed to check EYE version: ${e.message}`)
      console.warn('Re-downloading...')
    }
  }

  const url = `https://github.com/eyereasoner/eye/archive/refs/tags/v${EYE_VERSION}.tar.gz`

  // Download and extract tarball directly from stream
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to download: ${res.statusText}`)
  await new Promise((resolve, reject) => {
    Readable.fromWeb(res.body)
      .pipe(tar.x())
      .on('finish', resolve)
      .on('error', reject)
  })

  // Remove existing 'eye' directory if it exists
  if (fs.existsSync('eye')) {
    fs.rmSync('eye', { recursive: true, force: true })
  }
  // Rename extracted folder
  fs.renameSync(`eye-${EYE_VERSION}`, 'eye')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
