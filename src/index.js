import web3 from '../services/web3.js'
import PancakeRouter, {
  address as PancakeRouterAddress,
} from '../contracts/PancakeRouter.js'
import PancakeFactory from '../contracts/PancakeFactory.js'
import PancakePair from '../contracts/PancakePair.js'

const main = async () => {
  const walletAddress = '0x7Fff80a8b0cc95C3A28eDbCEF9f2ca08e2aC243f'

  // const balance = await web3.eth.getBalance(walletAddress)
  // console.log(web3.utils.fromWei(balance, 'ether'))

  const currentBlock = await web3.eth.getBlockNumber()
  console.log(currentBlock)

  const token1 = '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c'
  const token2 = '0x844fa82f1e54824655470970f7004dd90546bb28'
  const pairAddress = await PancakeFactory.methods
    .getPair(token1, token2)
    .call()
  console.log(pairAddress)

  const pairContract = PancakePair(pairAddress)

  pairContract.getPastEvents(
    'allEvents',
    {
      fromBlock: currentBlock - 20,
    },
    (err, event) => {
      console.log(event)
    }
  )

  // pancakerouter.events.allEvents(
  //   {
  //     fromBlock: currentBlock - 1000,
  //   },
  //   (err, event) => {
  //     console.log(event)
  //   }
  // )

  // const eventDeposit = await dopple.events.Transfer(
  //   {
  //     fromBlock: currentBlock - 1000,
  //   },
  //   (err, event) => {
  //     if (!err) {
  //       console.log(event)
  //     }
  //   }
  // )

  // const subscribe = web3.eth
  //   .subscribe('logs', {
  //     fromBlock: currentBlock - 100,
  //     toBlock: currentBlock,
  //     address: pancakerouterAddress,
  //   })
  //   .on('data', console.log)
}

main()
