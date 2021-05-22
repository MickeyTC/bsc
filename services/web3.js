import Web3 from 'web3'
import Web3WsProvider from 'web3-providers-ws'

// const web3 = new Web3('https://bsc-dataseed1.binance.org:443')
// const web3 = new Web3('https://data-seed-prebsc-1-s1.binance.org:8545')

const options = {
  timeout: 30000, // ms

  // Useful for credentialed urls, e.g: ws://username:password@localhost:8546
  // headers: {
  //   authorization: 'Basic username:password'
  // },

  clientConfig: {
    // Useful if requests are large
    // maxReceivedFrameSize: 100000000,   // bytes - default: 1MiB
    // maxReceivedMessageSize: 100000000, // bytes - default: 8MiB

    // Useful to keep a connection alive
    keepalive: true,
    keepaliveInterval: 60000, // ms
  },

  // Enable auto reconnection
  reconnect: {
    auto: true,
    delay: 5000, // ms
    maxAttempts: 5,
    onTimeout: false,
  },
}
const provider = new Web3WsProvider('wss://bsc-ws-node.nariox.org:443', options)
const web3 = new Web3(provider)

export default web3
