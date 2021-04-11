import web3 from './services/web3.js'
import doppleContract from './contracts/dopple.js'

const main = async () => {
  const address = '0xf3f6916d4ae203aec430ddcf5db429cddcc7c2e8'

  const balance = await web3.eth.getBalance(address)
  console.log(web3.utils.fromWei(balance, 'ether'))

  const lockBalance = await doppleContract.methods.lockOf(address).call()
  console.log(web3.utils.fromWei(lockBalance, 'ether'))
}

main()
