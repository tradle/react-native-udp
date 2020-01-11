/**
 * @providesModule UdpSockets
 * @flow
 */

import UdpSocket from './UdpSocket'

export function createSocket(options) {
  if (typeof options === 'string') options = { type: options }
  return new UdpSocket(options)
}

export const Socket = UdpSocket
