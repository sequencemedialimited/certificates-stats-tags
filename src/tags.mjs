/**
 *  @typedef {import('#types').ExifType} ExifType
 */

import { resolve, join } from 'node:path'
import { createWriteStream } from 'node:fs'
import { unlink, readFile, glob } from 'node:fs/promises'
import ExifReader from 'exifreader'
import { createObjectCsvStringifier } from 'csv-writer'
import { transformToDate } from '#certificates-stats-tags/utils/tags'

const { env: { FILE_PATH } } = process

if (!FILE_PATH) throw new Error('`FILE_PATH` is required')

const ORIGIN = resolve(FILE_PATH)
const DESTINATION = join(ORIGIN, 'tags.csv')
const PATTERN = join(ORIGIN, '**/*.{tiff,tif}')

const HEADER = [
  { id: 'filePath', title: 'File Path' },
  { id: 'fileType', title: 'File Type' },
  { id: 'dateTime', title: 'Date Time' },
  { id: 'dateTimeMs', title: 'Date Time (ms)' },
  { id: 'imageWidth', title: 'Image Width' },
  { id: 'imageLength', title: 'Image Length' },
  { id: 'compression', title: 'Compression' },
  { id: 'orientation', title: 'Orientation' },
  { id: 'make', title: 'Make' },
  { id: 'model', title: 'Model' },
  { id: 'software', title: 'Software' },
  { id: 'iccProfile', title: 'ICC Profile' }
]

export default async function tags () {
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
      const buffer = await readFile(filePath)

      /**
     *  @type {ExifType}
     */
      const {
        FileType: { value: fileType } = { value: null },
        DateTime: { value: dateTime } = { value: null },
        ImageWidth: { value: imageWidth } = { value: null },
        ImageLength: { value: imageLength } = { value: null },
        Compression: { value: compression } = { value: null },
        Orientation: { value: orientation } = { value: null },
        Make: { value: make } = { value: null },
        Model: { value: model } = { value: null },
        Software: { value: software } = { value: null },
        ICCProfile: { value: iccProfile } = { value: null }
      } = await ExifReader.load(buffer, { async: true })

      const d = (Array.isArray(dateTime) ? dateTime.at(0) : dateTime) ?? null
      const w = Number((Array.isArray(imageWidth) ? imageWidth.at(0) : imageWidth) ?? null)
      const l = Number((Array.isArray(imageLength) ? imageLength.at(0) : imageLength) ?? null)
      const c = Number((Array.isArray(compression) ? compression.at(0) : compression) ?? null)
      const o = Number((Array.isArray(orientation) ? orientation.at(0) : orientation) ?? null)
      const DATE = transformToDate(d)

      await (new Promise((resolve) => {
        writeStream.write(csvStringifier.stringifyRecords([{
          filePath,
          fileType: fileType ?? '',
          dateTime: DATE?.toISOString() ?? '',
          dateTimeMs: DATE?.getTime() ?? '',
          imageWidth: isNaN(w) ? '' : w,
          imageLength: isNaN(l) ? '' : l,
          compression: isNaN(c) ? '' : c,
          orientation: isNaN(o) ? '' : o,
          make: (Array.isArray(make) ? make.at(0) : make) ?? '',
          model: (Array.isArray(model) ? model.at(0) : model) ?? '',
          software: (Array.isArray(software) ? software.at(0) : software) ?? '',
          iccProfile: (Array.isArray(iccProfile) ? iccProfile.at(0) : iccProfile) ?? ''
        }]), resolve)
      }))
    }
  } finally {
    writeStream.end()
  }
}
