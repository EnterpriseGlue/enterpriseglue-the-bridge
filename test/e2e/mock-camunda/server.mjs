import http from 'node:http'
import { createMockCamundaHandler } from './server-handler.mjs'

const port = Number(process.env.PORT || 9080)
const server = http.createServer(createMockCamundaHandler())

server.listen(port, '0.0.0.0', () => {
  console.log(`mock camunda listening on ${port}`)
})
