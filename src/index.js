import web3 from '../services/web3.js'
import PancakeRouter, {
  address as PancakeRouterAddress,
} from '../contracts/PancakeRouter.js'
import PancakeFactory from '../contracts/PancakeFactory.js'
import PancakePair from '../contracts/PancakePair.js'

const tokens = [
  { name: 'DOP', address: '0x844fa82f1e54824655470970f7004dd90546bb28' },
  { name: 'BUSD', address: '0xe9e7cea3dedca5984780bafc599bd69add087d56' },
  { name: 'WBNB', address: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c' },
  { name: 'DOLLY', address: '0xff54da7caf3bc3d34664891fc8f3c9b6dea6c7a5' },
]

const pairs = []

const getTokenAddressFromName = name =>
  tokens.find(token => token.name === name)?.address

const getTokenNameFromAddress = address =>
  tokens.find(token => token.address === address)?.name

const getPancakePairAddress = async (tokenA, tokenB) => {
  const addressA = getTokenAddressFromName(tokenA)
  const addressB = getTokenAddressFromName(tokenB)
  if (addressA && addressB) {
    const pairAddress = await PancakeFactory.methods
      .getPair(addressA, addressB)
      .call()
    const [token0, token1] = [addressA, addressB]
      .sort()
      .map(getTokenNameFromAddress)
    const pair = { address: pairAddress, token0, token1 }
    pairs.push(pair)
    return pair
  }
}

const main = async () => {
  const currentBlock = await web3.eth.getBlockNumber()
  console.log(currentBlock)

  await getPancakePairAddress('DOP', 'WBNB')
  await getPancakePairAddress('DOP', 'BUSD')
  await getPancakePairAddress('DOP', 'DOLLY')

  // const events = await pairContract.getPastEvents(
  //   // 'allEvents',
  //   'Swap',
  //   {
  //     // fromBlock: currentBlock - 20,
  //     fromBlock: 7634664,
  //     toBlock: 7634664,
  //   },
  //   (err, events) => {
  //     const result = events.map(e => {
  //       const amount0In = new BN(e.returnValues.amount0In)
  //       const amount0Out = new BN(e.returnValues.amount0Out)
  //       const amount1In = new BN(e.returnValues.amount1In)
  //       const amount1Out = new BN(e.returnValues.amount1Out)
  //       const isToken0Out = amount0In.lt(amount0Out) // Sell Token0 to Token1
  //       return {
  //         block: e.blockNumber,
  //         txHash: e.transactionHash,
  //         token0,
  //         token1,
  //         isToken0Out,
  //         amount0: isToken0Out ? toETH(amount0Out) : toETH(amount0In),
  //         amount1: isToken0Out ? toETH(amount1In) : toETH(amount1Out),
  //       }
  //     })
  //     console.log(result)
  //   }
  // )
  // console.log(events)

  // const events = await pairContract.events
  //   .Swap({
  //     fromBlock: 'pending',
  //   })
  //   .on('data', e => {
  //     const amount0In = new BN(e.returnValues.amount0In)
  //     const amount0Out = new BN(e.returnValues.amount0Out)
  //     const amount1In = new BN(e.returnValues.amount1In)
  //     const amount1Out = new BN(e.returnValues.amount1Out)
  //     const isToken0Out = amount0In.lt(amount0Out) // Sell Token0 to Token1
  //     const result = {
  //       block: e.blockNumber,
  //       txHash: e.transactionHash,
  //       token0,
  //       token1,
  //       isToken0Out,
  //       amount0: isToken0Out ? toETH(amount0Out) : toETH(amount0In),
  //       amount1: isToken0Out ? toETH(amount1In) : toETH(amount1Out),
  //     }
  //     console.log(result)
  //   })
  //   .on('connected', console.log)
  // console.log(events)

  const BN = web3.utils.BN
  const toETH = web3.utils.fromWei

  const subscription = web3.eth
    .subscribe('logs', {
      address: pairs.map(pair => pair.address),
      topics: [
        '0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822',
      ],
    })
    .on('data', log => {
      const data = web3.eth.abi.decodeLog(
        [
          { type: 'uint256', name: 'amount0In' },
          { type: 'uint256', name: 'amount1In' },
          { type: 'uint256', name: 'amount0Out' },
          { type: 'uint256', name: 'amount1Out' },
        ],
        log.data,
        log.topics
      )
      const amount0In = new BN(data.amount0In)
      const amount0Out = new BN(data.amount0Out)
      const amount1In = new BN(data.amount1In)
      const amount1Out = new BN(data.amount1Out)

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
          ? `${amount0} ${token0} -> ${amount1} ${token1}`
          : `${amount1} ${token1} -> ${amount0} ${token0}`,
      }
      console.log(result)
    })
    .on('error', err => console.log(`Error: ${err}`))
    .on('connected', id => console.log(`Connected: ${id}`))

  // subscription.unsubscribe((error, success) => {
  //   if (success) console.log('Successfully unsubscribed!')
  // })
}

main()
