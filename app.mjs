#!/usr/bin/env node

import {
  certificates,
  stats,
  tags
} from '#certificates-stats-tags'

console.log('🚀')

export default Promise.all([
  certificates(),
  stats(),
  tags()
]).then(() => console.log('👍')).catch(({ message }) => console.error(`💥 ${message}`))
