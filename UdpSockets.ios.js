
/**
 * @providesModule UdpSockets
 * @flow
 */

var UdpSocket = require('./UdpSocket.ios')

module.exports = {
  createSocket: function(type) {
    return new UdpSocket({
      type: type
    })
  }
}