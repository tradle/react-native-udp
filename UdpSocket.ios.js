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
var mixInEventEmitter = require('mixInEventEmitter')
var DeviceEventEmitter = require('RCTDeviceEventEmitter')
var Sockets = require('NativeModules').UdpSockets
var base64 = require('base64-js')
var noop = function () {}
var instances = 0
var STATE = {
  UNBOUND: 0,
  BINDING: 1,
  BOUND: 2
}

function UdpSocket(type) {
  this._id = instances++
  this._state = STATE.UNBOUND
  this._subscription = DeviceEventEmitter.addListener(
    'udp-' + this._id + '-data', this._onReceive.bind(this)
  );

  // ensure compatibility with node's EventEmitter
  if (!this.on) this.on = this.addListener.bind(this)

  Sockets.createSocket(this._id, {
    type: type || 'udp4'
  }) // later
}

UdpSocket.prototype._debug = function() {
  // for now
  var args = [].slice.call(arguments)
  args.unshift(this._id)
  console.log.apply(console, args)
}


UdpSocket.prototype.bind = function(port, address, callback) {
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
  Sockets.bind(this._id, port, address, function(err, addr) {
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

UdpSocket.prototype.close = function() {
  if (this._destroyed) return

  this._destroyed = true
  this._debug('closing')
  this._subscription.remove();

  Sockets.close(this._id, this._debug.bind(this, 'closed'))
  this.emit('close')
}

UdpSocket.prototype._onReceive = function(info) {
  this._debug('received', info)

  var buf = base64.toByteArray(info.data)
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
// UdpSocket.prototype.send = function (buf, host, port, cb) {
UdpSocket.prototype.send = function(buffer, offset, length, port, address, callback) {
  var self = this

  if (offset !== 0) throw new Error('Non-zero offset not supported yet')

  if (this._state === STATE.UNBOUND) {
    var args = [].slice.call(arguments)
    return this.bind(0, function(err) {
      if (err) return callback(err)

      self.send.apply(self, args)
    })
  }
  else if (this._state === STATE.BINDING) {
    // we're ok, GCDAsync(Udp)Socket handles queueing internally
  }

  callback = callback || noop
  var str
  if (typeof buffer === 'string') {
    console.warn('socket.send(): interpreting as base64')
    str = buffer
  }
  else if (typeof Buffer !== 'undefined' && Buffer.isBuffer(buffer)) {
    str = buffer.toString('base64')
  }
  else if (buffer instanceof Uint8Array || Array.isArray(buffer)) {
    str = base64.fromByteArray(buffer)
  }
  else {
    throw new Error('invalid message format')
  }

  self._debug('sending', buffer, str)
  Sockets.send(this._id, str, +port, address, function(err) {
    if (err) {
      self._debug('send failed', err)
      return callback(err)
    }

    self._debug('sent')
    callback()
  })
}

UdpSocket.prototype.address = function() {
  if (this._state !== STATE.BOUND) {
    throw new Error('socket is not bound yet')
  }

  return {
    address: this._address,
    port: this._port,
    family: 'IPv4'
  }
}

UdpSocket.prototype.setBroadcast = function(flag) {
  // nothing yet
}

UdpSocket.prototype.setTTL = function(ttl) {
  // nothing yet
}

UdpSocket.prototype.setMulticastTTL = function(ttl, callback) {
  // nothing yet
}

UdpSocket.prototype.setMulticastLoopback = function(flag, callback) {
  // nothing yet
}

UdpSocket.prototype.addMembership = function(multicastAddress, multicastInterface, callback) {
  // nothing yet
}

UdpSocket.prototype.dropMembership = function(multicastAddress, multicastInterface, callback) {
  // nothing yet
}

UdpSocket.prototype.ref = function() {
  // anything?
}

UdpSocket.prototype.unref = function() {
  // anything?
}

mixInEventEmitter(UdpSocket, {
  'listening': true,
  'message': true,
  'close': true,
  'error': true
})

module.exports = UdpSocket