const assert = require('assert')
const normalizeBindOptions = require('../normalizeBindOptions')
const prettify = obj => JSON.stringify(obj, null, 2)

describe('normalizeBindOptions', () => {
  const args = [
    { name: 'port', value: 1234 },
    { name: 'address', value: '1.2.3.4' },
    { name: 'callback', value: () => {} },
  ]

  it('should support all combinations of arguments', () => {
    // check every combination of arguments (retaining order)
    // use a bit mask to decide whether to keep an argument
    for (let i = 0, numCombinations = Math.pow(2, args.length); i < numCombinations; i++) {
      const usedArgs = args.filter((arg, bit) => (i + 1) & 1 << bit)
      const expected = {}
      usedArgs.forEach(arg => expected[arg.name] = arg.value)
      const usedArgsValues = usedArgs.map(arg => arg.value)

      const result = normalizeBindOptions(...usedArgsValues)
      try {
        assert.deepEqual(result, expected)
      } catch (err) {
        throw new Error(`for args: ${prettify(usedArgsValues)}\nexpected: ${prettify(expected)}\ngot ${prettify(result)}`)
      }
    }
  })
})
