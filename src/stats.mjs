import { resolve, join, parse } from 'node:path'
import { createWriteStream, lstatSync } from 'node:fs'
import { unlink, glob, stat } from 'node:fs/promises'
import { createObjectCsvStringifier } from 'csv-writer'
import normalise from './utils/normalise.mjs'
import configMap from './config.mjs'

if (!configMap.has('from')) throw new Error('`from` is required')

const ORIGIN = resolve(normalise(configMap.get('from')))
try {
  lstatSync(ORIGIN)
} catch {
  throw new Error('No such `from`')
}
const to = resolve(normalise(configMap.get('to') || ORIGIN))
const isDirectory = !parse(to).ext
const DESTINATION = isDirectory ? join(to, 'stats.csv') : to
const PATTERN = join(ORIGIN, '**/*.{tiff,tif}')

const HEADER = [
  { id: 'filePath', title: 'File Path' },
  { id: 'size', title: 'Size' },
  { id: 'atime', title: 'Accessed Time' },
  { id: 'mtime', title: 'Modified Time' },
  { id: 'ctime', title: 'Created Time' },
  { id: 'birthtime', title: 'Birth Time' },
  { id: 'atimeMs', title: 'Accessed Time (ms)' },
  { id: 'mtimeMs', title: 'Modified Time (ms)' },
  { id: 'ctimeMs', title: 'Created Time (ms)' },
  { id: 'birthtimeMs', title: 'Birth Time (ms)' }
]

export default async function stats () {
  try {
    await unlink(DESTINATION)
  } catch (e) {
    if (e instanceof Error) { // @ts-ignore
      const { code } = e
      if (code !== 'ENOENT') {
        const { message } = e
        console.error(message)
      }
    }
  }

  const csvStringifier = createObjectCsvStringifier({
    header: HEADER
  })

  const writeStream = createWriteStream(DESTINATION, {
    flags: 'a'
  })

  try {
    writeStream.write(csvStringifier.getHeaderString())

    for await (const filePath of glob(PATTERN)) {
      const {
        size,
        atimeMs,
        mtimeMs,
        ctimeMs,
        birthtimeMs
      } = await stat(filePath)

      const atime = new Date(atimeMs)
      const mtime = new Date(mtimeMs)
      const ctime = new Date(ctimeMs)
      const birthtime = new Date(birthtimeMs)

      await (new Promise((resolve) => {
        writeStream.write(csvStringifier.stringifyRecords([{
          filePath,
          size,
          atimeMs,
          mtimeMs,
          ctimeMs,
          birthtimeMs,
          atime: atime.toISOString(),
          mtime: mtime.toISOString(),
          ctime: ctime.toISOString(),
          birthtime: birthtime.toISOString()
        }]), resolve)
      }))
    }
  } finally {
    writeStream.end()
  }
}
