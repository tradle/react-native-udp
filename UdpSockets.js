
/**
 * @providesModule UdpSockets
 * @flow
 */

var UdpSocket = require('./UdpSocket');

exports.createSocket = function(type) {
  return new UdpSocket({
    type: type
  })
}

exports.Socket = UdpSocket;
