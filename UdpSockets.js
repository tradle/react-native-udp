/**
 * @providesModule UdpSockets
 * @flow
 */

import UdpSocket from './UdpSocket'

export default class UdpSockets {
  static createSocket(options) {
    if (typeof options === 'string') options = { type: options }
    return new UdpSocket(options)
  }

  static Socket = UdpSocket
}
