#!/usr/bin/env node

import {
  certificates,
  stats,
  tags
} from '#certificates-stats-tags'

export default Promise.all([
  certificates(),
  stats(),
  tags()
])
