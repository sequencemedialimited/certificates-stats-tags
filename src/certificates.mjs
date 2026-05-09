import { resolve, join, parse } from 'node:path'
import { createWriteStream } from 'node:fs'
import { unlink, glob } from 'node:fs/promises'
import { createObjectCsvStringifier } from 'csv-writer'
import normalise from './utils/normalise.mjs'
import configMap from './config.mjs'

if (!configMap.has('from')) throw new Error('`from` is required')

const ORIGIN = resolve(normalise(configMap.get('from')))
const DESTINATION = join(resolve(normalise(configMap.get('to') || ORIGIN), 'certificates.csv'))
const PATTERN = join(ORIGIN, '**/*.{tiff,tif}')

const HEADER = [
  { id: 'filePath', title: 'File Path' },
  { id: 'extension', title: 'File Extension' },
  { id: 'nameNames', title: 'Name/Names' },
  { id: 'date', title: 'Date' },
  { id: 'dateTime', title: 'Date Time' },
  { id: 'dateTimeMs', title: 'Date Time (ms)' },
  { id: 'birth', title: 'Birth' },
  { id: 'marriage', title: 'Marriage' },
  { id: 'death', title: 'Death' }
]

export default async function certificates () {
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
        name,
        ext: extension
      } = parse(filePath)

      const [
        nameNames,
        date
      ] = name.split(',').map((v) => v.replace(/ - .+$/, '')).map((v) => v.trim())

      const DATE = new Date(date)

      await (new Promise((resolve) => {
        writeStream.write(csvStringifier.stringifyRecords([{
          filePath,
          extension,
          nameNames,
          date,
          dateTime: DATE.toISOString(),
          dateTimeMs: DATE.getTime(),
          birth: /\/Birth\//i.test(filePath) ? 1 : 0,
          marriage: /\/Marriage\//i.test(filePath) ? 1 : 0,
          death: /\/Death\//i.test(filePath) ? 1 : 0
        }]), resolve)
      }))
    }
  } finally {
    writeStream.end()
  }
}
