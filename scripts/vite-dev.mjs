#!/usr/bin/env node
/**
 * Thin wrapper so you always see output before Vite's CLI runs.
 * If this prints but nothing follows, Vite is hanging during startup
 * (try Node 22 LTS: `nvm use` in this repo, then rm -rf node_modules && npm i).
 */
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const viteBin = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js')

console.log('[prompt-repo] Node', process.version)
console.log('[prompt-repo] Starting Vite…')

const child = spawn(process.execPath, [viteBin, ...process.argv.slice(2)], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
})

child.on('exit', (code, signal) => {
  if (signal) process.exit(1)
  process.exit(code ?? 0)
})
