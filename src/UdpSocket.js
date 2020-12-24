import { EventEmitter } from 'events'
import { Buffer } from 'buffer'
import { DeviceEventEmitter, NativeModules } from 'react-native'
const Sockets = NativeModules.UdpSockets
import normalizeBindOptions from './normalizeBindOptions'
let instances = 0
const STATE = {
  UNBOUND: 0,
  BINDING: 1,
  BOUND: 2,
}

/**
 * @typedef {"ascii" | "utf8" | "utf-8" | "utf16le" | "ucs2" | "ucs-2" | "base64" | "latin1" | "binary" | "hex"} BufferEncoding
 */
export default class UdpSocket extends EventEmitter {
  /**
   * @param {{ type: string; reusePort?: boolean; debug?: boolean; }} options
   * @param {((...args: any[]) => void) | undefined} [onmessage]
   */
  constructor(options, onmessage) {
    super()
    EventEmitter.call(this)
    if (typeof options === 'string') options = { type: options }
    if (options.type !== 'udp4' && options.type !== 'udp6') {
      throw new Error('invalid udp socket type')
    }
    this.type = options.type
    this.reusePort = options && options.reusePort
    this.debugEnabled = options && options.debug
    /** @private */
    this._destroyed = false
    /** @private */
    this._id = instances++
    /** @private */
    this._state = STATE.UNBOUND
    /** @private */
    this._address = ''
    /** @private */
    this._port = -1
    /** @private */
    this._subscription = DeviceEventEmitter.addListener(
      `udp-${this._id}-data`,
      this._onReceive.bind(this)
    )
    if (onmessage) this.on('message', onmessage)
    Sockets.createSocket(this._id, {
      type: this.type,
    })
  }

  /**
   * @private
   */
  _debug() {
    if (__DEV__ || this.debugEnabled) {
      /** @type {string[]} */
      const args = [].slice.call(arguments)
      args.unshift(`socket-${this._id}`)
      console.log(...args)
    }
  }

  /**
   * For UDP sockets, causes the `UdpSocket` to listen for datagram messages on a named `port`
   * and optional `address`. If `port` is not specified or is `0`, the operating system will
   * attempt to bind to a random port. If `address` is not specified, the operating system
   * will attempt to listen on all addresses. Once binding is complete, a `'listening'` event
   * is emitted and the optional `callback` function is called.
   *
   * Specifying both a `'listening'` event listener and passing a callback to the `socket.bind()`
   * method is not harmful but not very useful.
   *
   * If binding fails, an `'error'` event is generated. In rare case (e.g. attempting to bind
   * with a closed socket), an `Error` may be thrown.
   *
   * @param {any[]} args
   */
  bind(...args) {
    const self = this
    if (this._state !== STATE.UNBOUND) throw new Error('Socket is already bound')
    let { port, address, callback } = normalizeBindOptions(...args)
    if (!address) address = '0.0.0.0'
    if (!port) port = 0
    if (!callback) callback = () => {}
    this.once('listening', callback.bind(this))
    this._state = STATE.BINDING
    this._debug('binding, address:', address, 'port:', port)
    Sockets.bind(
      this._id,
      port,
      address,
      { reusePort: this.reusePort },
      /**
       * @param {any} err
       * @param {{ address: any; port: any; }} addr
       */
      function (err, addr) {
        err = normalizeError(err)
        if (err) {
          // questionable: may want to self-destruct and
          // force user to create a new socket
          self._state = STATE.UNBOUND
          self._debug('failed to bind', err)
          if (callback) callback(err)
          return self.emit('error', err)
        }
        self._debug('bound to address:', addr.address, 'port:', addr.port)
        self._address = addr.address
        self._port = addr.port
        self._state = STATE.BOUND
        self.emit('listening')
      }
    )
  }

  /**
   * Close the underlying socket and stop listening for data on it. If a callback is provided,
   * it is added as a listener for the `'close'` event.
   *
   * @param {(...args: any[]) => void} callback
   */
  close(callback = () => {}) {
    if (this._destroyed) return setImmediate(callback)
    this.once('close', callback)
    this._debug('closing')
    this._subscription.remove()
    Sockets.close(
      this._id,
      /**
       * @param {string} err
       */
      (err) => {
        if (err) return this.emit('error', err)
        this._destroyed = true
        this._debug('closed')
        this.emit('close')
      }
    )
  }

  /**
   * NOT IMPLEMENTED
   *
   * @deprecated
   * @param {number} port
   * @param {string} address
   * @param {(...args: any[]) => void} callback
   */
  // eslint-disable-next-line no-unused-vars
  connect(port, address, callback) {
    console.warn('react-native-udp: connect() is not implemented')
  }

  /**
   * NOT IMPLEMENTED
   *
   * @deprecated
   */
  disconnect() {
    console.warn('react-native-udp: disconnect() is not implemented')
  }

  /**
   * @private
   * @param {{ data: string; address: string; port: number; ts: number; }} info
   */
  _onReceive(info) {
    // from base64 string
    const buf = Buffer.from(info.data, 'base64')
    const rinfo = {
      address: info.address,
      port: info.port,
      family: 'IPv4',
      size: buf.length,
      ts: Number(info.ts),
    }
    this.emit('message', buf, rinfo)
  }

  /**
   * Broadcasts a datagram on the socket. For connectionless sockets, the
   * destination `port` and `address` must be specified. Connected sockets,
   * on the other hand, will use their associated remote endpoint,
   * so the `port` and `address` arguments must not be set.
   *
   * The `msg` argument contains the message to be sent. Depending on its type,
   * different behavior can apply. If `msg` is a Buffer, any `TypedArray` or a `DataView`,
   * the `offset` and `length` specify the offset within the `Buffer` where the message
   * begins and the number of bytes in the message, respectively. If `msg` is a
   * `string`, then it is automatically converted to a `Buffer` with `'utf8'` encoding.
   * With messages that contain multi-byte characters, `offset` and `length` will be
   * calculated with respect to byte length and not the character position.
   * If `msg` is an array, `offset` and `length` must not be specified.
   *
   * The `address` argument is a string. If the value of `address` is a host name,
   * DNS will be used to resolve the address of the host. If `address` is not provided
   * or otherwise falsy, `'127.0.0.1'` (for `udp4` sockets) or `'::1'`
   * (for `udp6` sockets) will be used by default.
   *
   * If the socket has not been previously bound with a call to `bind`, it's
   * assigned a random port number and bound to the "all interfaces" address
   * (`'0.0.0.0'` for `udp4` sockets, `'::0'` for `udp6` sockets).
   *
   * An optional `callback` function may be specified to as a way of
   * reporting DNS errors or for determining when it is safe to reuse the
   * `buf` object.
   *
   * The only way to know for sure that the datagram has been sent is by
   * using a `callback`. If an error occurs and a `callback` is given,
   * the `error` will be passed as the first argument to the `callback`.
   * If a `callback` is not given, the error is emitted as an `'error'`
   * event on the `socket` object.
   *
   * Offset and length are optional but both _must_ be set if either are used.
   * They are supported only when the first argument is a `Buffer`,
   * a `TypedArray`, or a `DataView`.
   *
   * This method throws `ERR_SOCKET_BAD_PORT` if called on an unbound socket.
   *
   * @param {string | Buffer | Uint8Array | Array<any>} msg Message to be sent.
   * @param {number} [offset] Offset in the buffer where the message starts.
   * @param {number} [length] Number of bytes in the message.
   * @param {number} [port] Destination port.
   * @param {string} [address] Destination host name or IP address.
   * @param {(error?: Error) => void} [callback] Called when the message has been sent.
   */
  send(msg, offset, length, port, address, callback) {
    if (this._state === STATE.UNBOUND) throw new Error('ERR_SOCKET_BAD_PORT')
    if (!address) {
      if (this.type === 'udp4') address = '127.0.0.1'
      else address = '::1'
    }
    if (port === undefined || address === undefined) {
      throw new Error('socket.send(): address and port parameters must be provided')
    }
    if (Array.isArray(msg) && (offset !== undefined || length !== undefined)) {
      throw new Error('socket.send(): offset and length must be undefined for a msg of type Array')
    }
    // Generate msg buffer
    const generatedBuffer = this._generateSendBuffer(msg).slice(offset, length)
    const str = generatedBuffer.toString('base64')
    // Call native module
    Sockets.send(this._id, str, port, address, (/** @type {any} */ err) => {
      err = normalizeError(err)
      if (err) {
        if (callback) callback(err)
        else this.emit('error', err)
      } else {
        if (callback) callback()
      }
    })
  }

  /**
   * @private
   * @param {string | Buffer | Uint8Array | Array<any>} msg
   * @param {BufferEncoding} [encoding]
   */
  _generateSendBuffer(msg, encoding = 'utf-8') {
    if (typeof msg === 'string') {
      return Buffer.from(msg, encoding)
    } else if (Buffer.isBuffer(msg)) {
      return msg
    } else if (msg instanceof Uint8Array || Array.isArray(msg)) {
      return Buffer.from(/** @type {any[]} */ (msg))
    } else {
      throw new TypeError(`Invalid type for msg, found ${typeof msg}`)
    }
  }

  /**
   * Returns an object containing the address information for a socket.
   * For UDP sockets, this object will contain `address`, `family` and `port` properties.
   */
  address() {
    if (this._state !== STATE.BOUND) throw new Error('socket is not bound yet')
    return {
      address: this._address,
      port: this._port,
      family: 'IPv4',
    }
  }

  /**
   * Sets or clears the `SO_BROADCAST` socket option. When set to `true`,
   * UDP packets may be sent to a local interface's broadcast address.
   *
   * This method throws `EBADF` if called on an unbound socket.
   *
   * @param {boolean} flag
   */
  setBroadcast(flag) {
    const self = this
    if (this._state !== STATE.BOUND) throw new Error('EBADF')
    Sockets.setBroadcast(
      this._id,
      flag,
      /**
       * @param {string | Error | undefined} err
       */ (err) => {
        err = normalizeError(err)
        if (err) {
          self._debug('failed to set broadcast', err)
          self.emit('error', err)
        }
      }
    )
  }

  /**
   * NOT IMPLEMENTED
   *
   * @deprecated
   * @param {string} multicastInterface
   */
  // eslint-disable-next-line no-unused-vars
  setMulticastInterface(multicastInterface) {
    console.warn('react-native-udp: setMulticastInterface() is not implemented')
  }

  /**
   * NOT IMPLEMENTED
   *
   * @deprecated
   * @param {boolean} flag
   */
  // eslint-disable-next-line no-unused-vars
  setMulticastLoopback(flag) {
    console.warn('react-native-udp: setMulticastLoopback() is not implemented')
  }

  /**
   * NOT IMPLEMENTED
   *
   * @deprecated
   * @param {number} ttl
   */
  // eslint-disable-next-line no-unused-vars
  setMulticastTTL(ttl) {
    console.warn('react-native-udp: setMulticastTTL() is not implemented')
  }

  /**
   * NOT IMPLEMENTED
   *
   * @deprecated
   * @param {number} size
   */
  // eslint-disable-next-line no-unused-vars
  setRecvBufferSize(size) {
    console.warn('react-native-udp: setRecvBufferSize() is not implemented')
  }

  /**
   * NOT IMPLEMENTED
   *
   * @deprecated
   * @param {number} size
   */
  // eslint-disable-next-line no-unused-vars
  setSendBufferSize(size) {
    console.warn('react-native-udp: setSendBufferSize() is not implemented')
  }

  /**
   * NOT IMPLEMENTED
   *
   * @deprecated
   * @param {number} ttl
   */
  // eslint-disable-next-line no-unused-vars
  setTTL(ttl) {
    console.warn('react-native-udp: setTTL() is not implemented')
  }

  /**
   * NOT IMPLEMENTED
   *
   * @deprecated
   */
  unref() {
    console.warn('react-native-udp: unref() is not implemented')
  }

  /**
   * Tells the kernel to join a multicast group at the given `multicastAddress` and
   * `multicastInterface` using the `IP_ADD_MEMBERSHIP` socket option.
   *
   * If the `multicastInterface` argument is not specified, the operating system will
   * choose one interface and will add membership to it. To add membership to every
   * available interface, call `addMembership` multiple times, once per interface.
   *
   * @param {string} multicastAddress
   * @param {string} [multicastInterface]
   */
  addMembership(multicastAddress, multicastInterface) {
    if (this._state !== STATE.BOUND) throw new Error('you must bind before addMembership()')
    if (multicastInterface) {
      console.warn('react-native-udp: addMembership() ignores `multicastInterface` parameter')
    }
    Sockets.addMembership(this._id, multicastAddress)
  }

  /**
   * NOT IMPLEMENTED
   *
   * @deprecated
   * @param {string} sourceAddress
   * @param {string} groupAddress
   * @param {string} [multicastInterface]
   */
  // eslint-disable-next-line no-unused-vars
  addSourceSpecificMembership(sourceAddress, groupAddress, multicastInterface) {
    console.warn('react-native-udp: addSourceSpecificMembership() is not implemented')
  }

  /**
   * Instructs the kernel to leave a multicast group at `multicastAddress` using the
   * `IP_DROP_MEMBERSHIP` socket option. This method is automatically called by the
   * kernel when the socket is closed or the process terminates, so most apps will
   * never have reason to call this.
   *
   * If `multicastInterface` is not specified, the operating system will attempt to
   * drop membership on all valid interfaces.
   *
   * @param {string} multicastAddress
   * @param {string} [multicastInterface]
   */
  dropMembership(multicastAddress, multicastInterface) {
    if (this._state !== STATE.BOUND) throw new Error('you must bind before addMembership()')
    if (multicastInterface) {
      console.warn('react-native-udp: dropMembership() ignores `multicastInterface` parameter')
    }
    Sockets.dropMembership(this._id, multicastAddress)
  }

  /**
   * NOT IMPLEMENTED
   *
   * @deprecated
   * @param {string} sourceAddress
   * @param {string} groupAddress
   * @param {string} [multicastInterface]
   */
  // eslint-disable-next-line no-unused-vars
  dropSourceSpecificMembership(sourceAddress, groupAddress, multicastInterface) {
    console.warn('react-native-udp: dropSourceSpecificMembership() is not implemented')
  }

  /**
   * NOT IMPLEMENTED
   *
   * @deprecated
   */
  getRecvBufferSize() {
    console.warn('react-native-udp: getRecvBufferSize() is not implemented')
  }

  /**
   * NOT IMPLEMENTED
   *
   * @deprecated
   */
  getSendBufferSize() {
    console.warn('react-native-udp: getSendBufferSize() is not implemented')
  }

  /**
   * NOT IMPLEMENTED
   *
   * @deprecated
   */
  ref() {
    console.warn('react-native-udp: ref() is not implemented')
  }

  /**
   * NOT IMPLEMENTED
   *
   * @deprecated
   */
  remoteAddress() {
    console.warn('react-native-udp: remoteAddress() is not implemented')
  }
}

/**
 * @param {string | Error | undefined} err
 */
function normalizeError(err) {
  if (err) {
    if (typeof err === 'string') err = new Error(err)

    return err
  }
}
