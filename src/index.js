import web3 from '../services/web3.js'
import PancakeFactory from '../contracts/PancakeFactory.js'
import PancakePair from '../contracts/PancakePair.js'
import BandOracle from '../contracts/StdReference.js'

const tokens = {
  '0x844fa82f1e54824655470970f7004dd90546bb28': { symbol: 'DOP' },
  '0xe9e7cea3dedca5984780bafc599bd69add087d56': { symbol: 'BUSD' },
  '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c': { symbol: 'WBNB' },
  '0xff54da7caf3bc3d34664891fc8f3c9b6dea6c7a5': { symbol: 'DOLLY' },
}

// pairs: {
//   [pairAddress] : {
//     address,
//     token0,
//     token1,
//   }
// }
const pairs = {}

const getPancakePairAddress = async (tokenA, tokenB) => {
  if (tokenA.toLowerCase() === tokenB.toLowerCase()) {
    throw new Error('Token cannot be the same')
  }
  if (!tokens[tokenA] || !tokens[tokenB]) {
    throw new Error('Invalid token address')
  }

  const [token0, token1] =
    tokenA.toLowerCase() < tokenB.toLowerCase()
      ? [tokenA, tokenB]
      : [tokenB, tokenA]

  const pair = Object.values(pairs).find(
    p => p.token0 === token0 && p.token1 === token1
  )
  if (pair) return pair

  const pairAddress = await PancakeFactory.methods
    .getPair(token0, token1)
    .call()

  pairs[pairAddress] = { address: pairAddress, token0, token1 }
  return pairs[pairAddress]
}

const getPancakePairRate = async pancakePairAddress => {
  const pancakePairContract = PancakePair(pancakePairAddress)
  const {
    _reserve0: reserve0,
    _reserve1: reserve1,
    _blockTimestampLast: timestamp,
  } = await pancakePairContract.methods.getReserves().call()

  return {
    reserve0,
    reserve1,
    timestamp,
    rate0: Number(reserve1) / Number(reserve0),
    rate1: Number(reserve0) / Number(reserve1),
  }
}

const main = async () => {
  console.log(`Current block: ${await web3.eth.getBlockNumber()}`)

  const watchList = []

  // DOP-WBNB
  watchList.push(
    await getPancakePairAddress(
      '0x844fa82f1e54824655470970f7004dd90546bb28',
      '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c'
    )
  )

  // DOP-BUSD
  watchList.push(
    await getPancakePairAddress(
      '0x844fa82f1e54824655470970f7004dd90546bb28',
      '0xe9e7cea3dedca5984780bafc599bd69add087d56'
    )
  )

  // DOP-DOLLY
  watchList.push(
    await getPancakePairAddress(
      '0x844fa82f1e54824655470970f7004dd90546bb28',
      '0xff54da7caf3bc3d34664891fc8f3c9b6dea6c7a5'
    )
  )

  const toBN = web3.utils.toBN
  const toETH = web3.utils.fromWei
  const subscription = web3.eth
    .subscribe('logs', {
      address: watchList.map(w => w.address),
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

      const { timestamp, rate0, rate1 } = await getPancakePairRate(log.address)

      // const { rate: rateBusdUsd } = await BandOracle.methods
      //   .getReferenceData('BUSD', 'USD')
      //   .call()
      // const { rate: rateBnbUsd } = await BandOracle.methods
      //   .getReferenceData('BNB', 'USD')
      //   .call()
      const [{ rate: rateBusdUsd }, { rate: rateBnbUsd }] =
        await BandOracle.methods
          .getReferenceDataBulk(['BUSD', 'BNB'], ['USD', 'USD'])
          .call()

      const result = {
        timestamp,
        date: new Date(Number(timestamp) * 1000).toLocaleString('th'),
        token0: tokens[token0].symbol,
        token1: tokens[token1].symbol,
        rate0,
        rate1,
        rateBusdUsd: toETH(rateBusdUsd),
        rateBnbUsd: toETH(rateBnbUsd),
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
