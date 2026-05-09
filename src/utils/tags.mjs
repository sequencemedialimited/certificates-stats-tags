/**
 * @param {string | null} value
 * @returns {Date | null}
 */
export function transformToDate (value) {
  if (value) {
    let groups

    if (/\d{2}.\d{2}.\d{4} \d{2}:\d{2}:\d{2}/.test(value)) {
      groups = /(?<day>\d{2}).(?<month>\d{2}).(?<year>\d{4}) (?<hour>\d{2}):(?<minute>\d{2}):(?<second>\d{2})/.exec(value)?.groups
    } else {
      if (/\d{4}:\d{2}:\d{2} \d{2}:\d{2}:\d{2}/.test(value)) {
        groups = /(?<year>\d{4}):(?<month>\d{2}):(?<day>\d{2}) (?<hour>\d{2}):(?<minute>\d{2}):(?<second>\d{2})/.exec(value)?.groups
      }
    }

    if (groups) {
      const {
        year,
        month,
        day,
        hour,
        minute,
        second
      } = groups

      try {
        return new Date(`${year}-${month}-${day} ${hour}:${minute}:${second}`)
      } catch {
        return null
      }
    }
  }

  return null
}

/**
 * @param {string | null} value
 * @returns {number | null}
 */
export function transformToDateMs (value) {
  return transformToDate(value)?.getTime() ?? null
}
