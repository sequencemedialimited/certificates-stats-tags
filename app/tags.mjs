#!/usr/bin/env node

import { tags } from '#certificates-stats-tags'

console.log('🚀')

export default tags().then(() => console.log('👍')).catch(({ message }) => console.error(`💥 ${message}`))
