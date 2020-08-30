import normalizeBindOptions from '../src/normalizeBindOptions'

describe('normalizeBindOptions', function() {
  it('should support all combinations of arguments for [port], [address], [callback]', function() {
    const args = [
      { name: 'port', value: 1234 },
      { name: 'address', value: '1.2.3.4' },
      { name: 'callback', value: () => {} },
    ]

    // check every combination of arguments (retaining order)
    // use a bit mask to decide whether to keep an argument
    for (let i = 0, numCombinations = Math.pow(2, args.length); i < numCombinations; i++) {
      const usedArgs = args.filter((arg, bit) => (i + 1) & (1 << bit))
      const expected = {}
      // @ts-ignore
      usedArgs.forEach((arg) => (expected[arg.name] = arg.value))
      const usedArgsValues = usedArgs.map((arg) => arg.value)

      const result = normalizeBindOptions(...usedArgsValues)
      expect(result).toStrictEqual(expected)
    }
  })

  it('should support all combinations of arguments for [options], [callback]', function() {
    const callback = () => {}
    const inOut = [
      [[{ port: 123 }, callback], { port: 123, callback }],
      [[{ port: 123 }], { port: 123 }],
      [[callback], { callback }],
    ]

    for (const [args, expected] of inOut) {
      // @ts-ignore
      const result = normalizeBindOptions(...args)
      expect(result).toStrictEqual(expected)
    }
  })
})
