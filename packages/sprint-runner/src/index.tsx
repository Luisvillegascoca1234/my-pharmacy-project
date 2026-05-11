#!/usr/bin/env node
import React from 'react'
import { render } from 'ink'
import { App } from './App.js'
import { parseArgs } from './lib/args.js'

try {
  const config = parseArgs(process.argv.slice(2))
  render(<App config={config} />)
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}
