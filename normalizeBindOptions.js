module.exports = function normalizeBindOptions(...args) {
  const [arg1, arg2] = args
  const lastArg = args[args.length - 1]
  let options = {}

  if (typeof arg1 === 'object') {
    options = arg1
  } else if (typeof arg1 === 'number') {
    options.port = arg1
  } else if (typeof arg1 === 'string') {
    options.address = arg1
  }
  if (typeof arg2 === 'string') {
    options.address = arg2
  }
  if (typeof lastArg === 'function') {
    options.callback = lastArg
  }

  return options
}
