//
//  react-native-udp
//
//  Created by Mark Vayngrib on 05/10/15.
//  Copyright (c) 2015 Tradle, Inc. All rights reserved.
//

/**
 * @providesModule UdpSocket
 * @flow
 */

'use strict';

var React = require('react-native')
var {
  Component
} = React

var mixInEventEmitter = require('mixInEventEmitter')
var DeviceEventEmitter = require('RCTDeviceEventEmitter')
var NativeModules = require('NativeModules')
var sockets = NativeModules.UdpSockets
var noop = function () {}
var instances = 0
var STATE = {
  UNBOUND: 0,
  BINDING: 1,
  BOUND: 2
}

class RCTSocket extends Component {
  id: String;

  _state: STATE.UNBOUND;

  _address: undefined;

  _port: undefined;

  constructor(props) {
    super(props)
    this.id = instances++
    this.subscriptiom = DeviceEventEmitter.addListener(
      'udp-' + this.id + '-data', this._onReceive.bind(this)
    );

    // ensure compatibility with node's EventEmitter
    if (!this.on) this.on = this.addListener.bind(this)

    sockets.createSocket(this.id, {
      type: props.type || 'udp4'
    }) // later
  }

  _debug() {
    var args = [].slice.call(arguments)
    args.unshift(this.id)
    console.log.apply(console, args)
  }

  bind(port, address, callback) {
    var self = this

    if (this._state !== STATE.UNBOUND) throw new Error('Socket is already bound')

    if (typeof address === 'function') {
      callback = address
      address = undefined
    }

    if (!address) address = '0.0.0.0'

    if (!port) port = 0

    if (callback) this.once('listening', callback.bind(this))

    this._state = STATE.BINDING
    this._debug('binding, address:', address, 'port:', port)
    sockets.bind(this.id, port, address, function(err, addr) {
      if (err) {
        // questionable: may want to self-destruct and
        // force user to create a new socket
        self._state = STATE.UNBOUND
        self._debug('failed to bind', err)
        return self.emit('error', err)
      }

      self._debug('bound to address:', addr.address, 'port:', addr.port)
      self._address = addr.address
      self._port = addr.port
      self._state = STATE.BOUND
      self.emit('listening')
    })
  }

  componentWillUnmount() {
    this.subscription.remove();
  }

  _onReceive(info) {
    this._debug('received', info)

    var buf = toByteArray(info.data)
    var rinfo = {
      address: info.address,
      port: info.port,
      family: 'IPv4', // not necessarily
      size: buf.length
    }

    if (typeof Buffer !== 'undefined') buf = new Buffer(buf)

    this.emit('message', buf, rinfo)
  }


  /**
   * socket.send(buf, offset, length, port, address, [callback])
   *
   * For UDP sockets, the destination port and IP address must be
   * specified. A string may be supplied for the address parameter, and it will
   * be resolved with DNS. An optional callback may be specified to detect any
   * DNS errors and when buf may be re-used. Note that DNS lookups will delay
   * the time that a send takes place, at least until the next tick. The only
   * way to know for sure that a send has taken place is to use the callback.
   *
   * If the socket has not been previously bound with a call to bind, it's
   * assigned a random port number and bound to the "all interfaces" address
   * (0.0.0.0 for udp4 sockets, ::0 for udp6 sockets).
   *
   * @param {Array|string} message to be sent
   * @param {number} offset Offset in the buffer where the message starts.
   * @param {number} length Number of bytes in the message.
   * @param {number} port destination port
   * @param {string} address destination IP
   * @param {function} callback Callback when message is done being delivered.
   *                            Optional.
   */
  // Socket.prototype.send = function (buf, host, port, cb) {
  send(buffer, offset, length, port, address, callback) {
    var self = this

    if (offset !== 0) throw new Error('Non-zero offset not supported yet')

    if (this._state === STATE.UNBOUND) {
      throw new Error('bind before sending, seriously dude')
    }
    else if (this._state === STATE.BINDING) {
      // we're ok, GCDAsync(Udp)Socket handles queueing internally
    }

    callback = callback || noop
    if (typeof buffer === 'string') {
      buffer = toByteArray(buffer)
    }
    else if (typeof Buffer !== 'undefined' && Buffer.isBuffer(buffer)) {
      buffer = buffer.toJSON().data
    }

    self._debug('sending', buffer)
    sockets.send(this.id, buffer, +port, address, function(err) {
      if (err) {
        self._debug('send failed', err)
        return callback(err)
      }

      self._debug('sent')
      callback()
    })
  }

  address() {
    if (this._state !== STATE.BOUND) {
      throw new Error('socket is not bound yet')
    }

    return {
      address: this._address,
      port: this._port,
      family: 'IPv4'
    }
  }

  close() {
    var self = this
    if (this._destroyed) return

    this._destroyed = true
    this._debug('closing')
    sockets.close(this.id, function() {
      self._debug('closed')
    })

    this.emit('close')
  }

  setBroadcast(flag) {
    // nothing yet
  }

  setTTL(ttl) {
    // nothing yet
  }

  setMulticastTTL(ttl, callback) {
    // nothing yet
  }

  setMulticastLoopback(flag, callback) {
    // nothing yet
  }

  addMembership(multicastAddress, multicastInterface, callback) {
    // nothing yet
  }

  dropMembership(multicastAddress, multicastInterface, callback) {
    // nothing yet
  }

  ref() {
    // anything?
  }

  unref() {
    // anything?
  }
}

mixInEventEmitter(RCTSocket, {
  'listening': true,
  'message': true,
  'close': true,
  'error': true
})

function toByteArray(obj) {
  if (typeof obj === 'object') {
    var i = 0
    var arr = []
    while (true) {
      if (!(i in obj)) break

      arr.push(+obj[i])
      i++
    }

    return new Uint8Array(arr)
  }
  else if (typeof obj !== 'string') {
    throw new Error('unsupported format')
  }

  var uint = new Uint8Array(obj.length);
  for (var i = 0, l = obj.length; i < l; i++){
    uint[i] = obj.charCodeAt(i);
  }

  return new Uint8Array(uint);
}
module.exports = RCTSocket