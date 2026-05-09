import { homedir } from 'node:os'

/**
 * @param {unknown | null} value
 * @returns {string}
 */
export default function normalise (value) {
  return String(value ?? '').trim().replace(/^~/, homedir())
}
