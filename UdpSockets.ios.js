
/**
 * @providesModule UdpSockets
 * @flow
 */

var UdpSocket = require('./UdpSocket.ios')

exports.createSocket = function(type) {
  return new UdpSocket({
    type: type
  })
}

exports.Socket = UdpSocket;
