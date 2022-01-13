#!/usr/bin/env node

import handler from 'serve-handler'
import http from 'http'
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url))


var port = process.env.PORT || 7788
var root = path.join(__dirname, '..')

console.log('root directory:', root)

const options = {
  port: port,
  root: root
}

const server = http.createServer((request, response) => {
  return handler(request, response,
    options
  )
})

server.listen(port, () => {
  console.log('Running nostr.chat at http://localhost:' + port)
})
