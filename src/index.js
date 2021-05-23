import web3 from '../services/web3.js'
import PancakeFactory from '../contracts/PancakeFactory.js'
import PancakePair from '../contracts/PancakePair.js'

const tokens = {
  '0x844fa82f1e54824655470970f7004dd90546bb28': { symbol: 'DOP' },
  '0xe9e7cea3dedca5984780bafc599bd69add087d56': { symbol: 'BUSD' },
  '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c': { symbol: 'WBNB' },
  '0xff54da7caf3bc3d34664891fc8f3c9b6dea6c7a5': { symbol: 'DOLLY' },
}

const pairs = {}

const getPancakePair = async (tokenA, tokenB) => {
  if (!tokens[tokenA] || !tokens[tokenB]) {
    throw new Error('Invalid token address')
  }

  const pairAddress = await PancakeFactory.methods
    .getPair(tokenA, tokenB)
    .call()
  const [token0, token1] = tokenA < tokenB ? [tokenA, tokenB] : [tokenB, tokenA]

  pairs[pairAddress] = { token0, token1 }

  return { address: pairAddress, token0, token1 }
}

const main = async () => {
  console.log(`Current block: ${await web3.eth.getBlockNumber()}`)

  // DOP-WBNB
  await getPancakePair(
    '0x844fa82f1e54824655470970f7004dd90546bb28',
    '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c'
  )

  // DOP-BUSD
  await getPancakePair(
    '0x844fa82f1e54824655470970f7004dd90546bb28',
    '0xe9e7cea3dedca5984780bafc599bd69add087d56'
  )

  // DOP-DOLLY
  await getPancakePair(
    '0x844fa82f1e54824655470970f7004dd90546bb28',
    '0xff54da7caf3bc3d34664891fc8f3c9b6dea6c7a5'
  )

  const toBN = web3.utils.toBN
  const toETH = web3.utils.fromWei
  const subscription = web3.eth
    .subscribe('logs', {
      address: Object.keys(pairs),
      topics: [
        web3.utils.sha3(
          'Swap(address,uint256,uint256,uint256,uint256,address)'
        ),
      ],
    })
    .on('data', async log => {
      const data = web3.eth.abi.decodeLog(
        [
          {
            indexed: false,
            internalType: 'uint256',
            name: 'amount0In',
            type: 'uint256',
          },
          {
            indexed: false,
            internalType: 'uint256',
            name: 'amount1In',
            type: 'uint256',
          },
          {
            indexed: false,
            internalType: 'uint256',
            name: 'amount0Out',
            type: 'uint256',
          },
          {
            indexed: false,
            internalType: 'uint256',
            name: 'amount1Out',
            type: 'uint256',
          },
        ],
        log.data,
        log.topics
      )
      const amount0In = toBN(data.amount0In)
      const amount0Out = toBN(data.amount0Out)
      const amount1In = toBN(data.amount1In)
      const amount1Out = toBN(data.amount1Out)

      const isToken0In = amount0In.gt(amount0Out) // Sell Token0 to Token1

      const [amount0, amount1] = isToken0In
        ? [toETH(amount0In), toETH(amount1Out)]
        : [toETH(amount0Out), toETH(amount1In)]

      const { token0, token1 } = pairs[log.address]

      const timestamp = (await web3.eth.getBlock(log.blockNumber)).timestamp

      const pancakePairContract = PancakePair(log.address)

      const price0Cumulative = await pancakePairContract.methods
        .price0CumulativeLast()
        .call()
      const price1Cumulative = await pancakePairContract.methods
        .price1CumulativeLast()
        .call()

      const result = {
        timestamp,
        price0Cumulative,
        price1Cumulative,
        block: log.blockNumber,
        txHash: log.transactionHash,
        result: isToken0In
          ? `${amount0} ${tokens[token0].symbol} -> ${amount1} ${tokens[token1].symbol}`
          : `${amount1} ${tokens[token1].symbol} -> ${amount0} ${tokens[token0].symbol}`,
      }
      console.log(result)
    })
    .on('error', err => console.log(`Error: ${err}`))
    .on('connected', id => console.log(`Connected: ${id}`))

  // subscription.unsubscribe((error, success) => {
  //   if (success) console.log('Unsubscribed')
  // })
}

// const main2 = async () => {
//   const subscription = web3.eth
//     .subscribe('pendingTransactions')
//     .on('data', async txHash => {
//       console.log(txHash)
//       const tx = await web3.eth.getTransaction(txHash)
//       console.log(tx)
//     })
// }

main()

// const aa = web3.eth.abi.encodeFunctionSignature(
//   'swapExactETHForTokens(uint256,address[],address,uint256)'
// )
// console.log(aa)
