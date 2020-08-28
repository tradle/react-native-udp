import UdpSocket from './UdpSocket'

export default class UdpSockets {
  /**
   * @param {{ type: string; }} options
   */
  static createSocket(options) {
    if (typeof options === 'string') options = { type: options }
    return new UdpSocket(options)
  }

  static Socket = UdpSocket
}
