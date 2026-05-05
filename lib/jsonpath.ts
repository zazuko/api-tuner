/* eslint-disable no-console */
import { JSONPath } from 'jsonpath-plus'
import getStream from 'get-stream'

async function main() {
  const path = process.argv[2]
  if (!path) {
    console.error('Usage: node jsonpath.js <path>')
    process.exit(1)
  }

  const jsonString = await getStream(process.stdin)
  try {
    const json = JSON.parse(jsonString)
    const result = JSONPath({ path, json, wrap: false })

    if (result !== undefined && result !== null) {
      process.stdout.write(JSON.stringify(result))
    }
  } catch (e) {
    console.error('Error parsing JSON or executing JSONPath:', (e as Error).message)
    process.exit(1)
  }
}

main()
