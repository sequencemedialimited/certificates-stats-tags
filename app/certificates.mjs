#!/usr/bin/env node

import { certificates } from '#certificates-stats-tags'

console.log('🚀')

export default certificates().then(() => console.log('👍')).catch(({ message }) => console.error(`💥 ${message}`))
