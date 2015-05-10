
/**
 * @providesModule UdpSockets
 * @flow
 */

var UdpSocket = require('UdpSocket')

module.exports = {
  createSocket: function(type) {
    return new UdpSocket({
      type: type
    })
  }
}