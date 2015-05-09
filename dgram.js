
/**
 * @providesModule RCTUDP
 * @flow
 */

var RCTSocket = require('RCTUDPSocket')

module.exports = {
  createSocket: function(type) {
    return new RCTSocket({
      type: type
    })
  }
}