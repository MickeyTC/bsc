import web3 from '../services/web3.js'
import PancakeFactory from '../contracts/PancakeFactory.js'
import PancakePair from '../contracts/PancakePair.js'

const tokens = {
  '0x844fa82f1e54824655470970f7004dd90546bb28': { code: 'DOP' },
  '0xe9e7cea3dedca5984780bafc599bd69add087d56': { code: 'BUSD' },
  '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c': { code: 'WBNB' },
  '0xff54da7caf3bc3d34664891fc8f3c9b6dea6c7a5': { code: 'DOLLY' },
}

const getPancakePair = async (tokenA, tokenB) => {
  if (!tokens[tokenA] || !tokens[tokenB]) {
    throw new Error('Invalid token address')
  }

  const pairAddress = await PancakeFactory.methods
    .getPair(tokenA, tokenB)
    .call()
  const [token0, token1] = tokenA < tokenB ? [tokenA, tokenB] : [tokenB, tokenA]
  const pair = { address: pairAddress, token0, token1 }
  return pair
}

const main = async () => {
  console.log(`Current block: ${await web3.eth.getBlockNumber()}`)

  const pairs = []

  // DOP-WBNB
  pairs.push(
    await getPancakePair(
      '0x844fa82f1e54824655470970f7004dd90546bb28',
      '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c'
    )
  )

  // DOP-BUSD
  pairs.push(
    await getPancakePair(
      '0x844fa82f1e54824655470970f7004dd90546bb28',
      '0xe9e7cea3dedca5984780bafc599bd69add087d56'
    )
  )

  // DOP-DOLLY
  pairs.push(
    await getPancakePair(
      '0x844fa82f1e54824655470970f7004dd90546bb28',
      '0xff54da7caf3bc3d34664891fc8f3c9b6dea6c7a5'
    )
  )

  const toBN = web3.utils.toBN
  const toETH = web3.utils.fromWei
  const subscription = web3.eth
    .subscribe('logs', {
      address: pairs.map(pair => pair.address),
      topics: [
        web3.utils.sha3(
          'Swap(address,uint256,uint256,uint256,uint256,address)'
        ),
      ],
    })
    .on('data', log => {
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

      const { token0, token1 } = pairs.find(
        pair => pair.address === log.address
      )

      const result = {
        block: log.blockNumber,
        txHash: log.transactionHash,
        result: isToken0In
          ? `${amount0} ${tokens[token0].code} -> ${amount1} ${tokens[token1].code}`
          : `${amount1} ${tokens[token1].code} -> ${amount0} ${tokens[token0].code}`,
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
