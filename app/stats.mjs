#!/usr/bin/env node

import { stats } from '#certificates-stats-tags'

console.log('🚀')

export default stats().then(() => console.log('👍')).catch(({ message }) => console.error(`💥 ${message}`))
