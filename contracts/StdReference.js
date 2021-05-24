import web3 from '../services/web3.js'

const abi = [
  {
    inputs: [
      { internalType: 'contract IStdReference', name: '_ref', type: 'address' },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'previousOwner',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'newOwner',
        type: 'address',
      },
    ],
    name: 'OwnershipTransferred',
    type: 'event',
  },
  {
    inputs: [
      { internalType: 'string', name: '_base', type: 'string' },
      { internalType: 'string', name: '_quote', type: 'string' },
    ],
    name: 'getReferenceData',
    outputs: [
      {
        components: [
          { internalType: 'uint256', name: 'rate', type: 'uint256' },
          { internalType: 'uint256', name: 'lastUpdatedBase', type: 'uint256' },
          {
            internalType: 'uint256',
            name: 'lastUpdatedQuote',
            type: 'uint256',
          },
        ],
        internalType: 'struct IStdReference.ReferenceData',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'string[]', name: '_bases', type: 'string[]' },
      { internalType: 'string[]', name: '_quotes', type: 'string[]' },
    ],
    name: 'getReferenceDataBulk',
    outputs: [
      {
        components: [
          { internalType: 'uint256', name: 'rate', type: 'uint256' },
          { internalType: 'uint256', name: 'lastUpdatedBase', type: 'uint256' },
          {
            internalType: 'uint256',
            name: 'lastUpdatedQuote',
            type: 'uint256',
          },
        ],
        internalType: 'struct IStdReference.ReferenceData[]',
        name: '',
        type: 'tuple[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'ref',
    outputs: [
      { internalType: 'contract IStdReference', name: '', type: 'address' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'contract IStdReference', name: '_ref', type: 'address' },
    ],
    name: 'setRef',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'newOwner', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
]

const address = '0xDA7a001b254CD22e46d3eAB04d937489c93174C3'

const contract = new web3.eth.Contract(abi, address)

export { abi, address }
export default contract
