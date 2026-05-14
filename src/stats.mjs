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
  { id: 'atimeMs', title: 'Accessed Time (ms)' },
  { id: 'mtime', title: 'Modified Time' },
  { id: 'mtimeMs', title: 'Modified Time (ms)' },
  { id: 'ctime', title: 'Created Time' },
  { id: 'ctimeMs', title: 'Created Time (ms)' },
  { id: 'birthtime', title: 'Birth Time' },
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

      await (new Promise((resolve) => {
        const atime = new Date(atimeMs)
        const mtime = new Date(mtimeMs)
        const ctime = new Date(ctimeMs)
        const birthtime = new Date(birthtimeMs)

        writeStream.write(csvStringifier.stringifyRecords([{
          filePath,
          size,
          atime: atime.toISOString(),
          atimeMs,
          mtime: mtime.toISOString(),
          mtimeMs,
          ctime: ctime.toISOString(),
          ctimeMs,
          birthtime: birthtime.toISOString(),
          birthtimeMs
        }]), resolve)
      }))
    }
  } finally {
    writeStream.end()
  }
}
