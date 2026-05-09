/**
 * @param {number} value
 * @returns {Date}
 */
export function fromDateMsToDate (value) {
  return new Date(value)
}

/**
 * @param {Date} value
 * @returns {number}
 */
export function fromDateToDateMs (value) {
  return value.getTime()
}
