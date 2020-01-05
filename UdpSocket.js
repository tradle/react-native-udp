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

const EventEmitter = require('events').EventEmitter;
const Buffer = (global.Buffer = global.Buffer || require('buffer').Buffer);
const { DeviceEventEmitter, NativeModules, Platform } = require('react-native');
const Sockets = NativeModules.UdpSockets;
const ipRegex = require('ip-regex');
const normalizeBindOptions = require('./normalizeBindOptions');
// RFC 952 hostname format, except for Huawei android devices that include '_' on their hostnames
const hostnameRegex = /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9_-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9_-]*[A-Za-z0-9])$/;
const noop = function() {};
let instances = 0;
const STATE = {
    UNBOUND: 0,
    BINDING: 1,
    BOUND: 2,
};

export default class UdpSocket extends EventEmitter {
    constructor(options, onmessage) {
        super(options);
        EventEmitter.call(this);
        if (typeof options === 'string') options = { type: options };
        if (options.type !== 'udp4' && options.type !== 'udp6')
            throw new Error('invalid udp socket type');

        this.type = options.type;
        this.reusePort = options && options.reusePort;
        this._ipv = Number(this.type.slice(3));
        this._ipRegex = ipRegex[`v${this._ipv}`]({ exact: true });
        this._id = instances++;
        this._state = STATE.UNBOUND;
        this._subscription = DeviceEventEmitter.addListener(
            `udp-${this._id}-data`,
            this._onReceive.bind(this)
        );
        // ensure compatibility with node's EventEmitter
        if (!this.on) this.on = this.addListener.bind(this);
        if (onmessage) this.on('message', onmessage);
        Sockets.createSocket(this._id, {
            type: this.type,
        }); // later
    }

    _debug() {
        if (__DEV__) {
            const args = [].slice.call(arguments);
            args.unshift(`socket-${this._id}`);
            console.log(...args);
        }
    }

    bind(...args) {
        const self = this;
        if (this._state !== STATE.UNBOUND) throw new Error('Socket is already bound');
        let { port, address, callback } = normalizeBindOptions(...args);
        if (!address) address = '0.0.0.0';
        if (!port) port = 0;
        if (!callback) callback = () => {};

        this.once('listening', callback.bind(this));
        this._state = STATE.BINDING;

        this._debug('binding, address:', address, 'port:', port);
        const bindArgs = [this._id, port, address];
        if (Platform.OS === 'ios') bindArgs.push({ reusePort: this.reusePort });

        Sockets.bind(...bindArgs, function(err, addr) {
            err = normalizeError(err);
            if (err) {
                // questionable: may want to self-destruct and
                // force user to create a new socket
                self._state = STATE.UNBOUND;
                self._debug('failed to bind', err);
                if (callback) callback(err);
                return self.emit('error', err);
            }
            self._debug('bound to address:', addr.address, 'port:', addr.port);
            self._address = addr.address;
            self._port = addr.port;
            self._state = STATE.BOUND;
            self.emit('listening');
        });
    }

    close(callback = noop) {
        if (this._destroyed) return setImmediate(callback);

        this.once('close', callback);
        if (this._destroying) return;
        this._destroying = true;
        this._debug('closing');
        this._subscription.remove();
        Sockets.close(this._id, (err) => {
            if (err) return this.emit('error', err);
            this._destroyed = true;
            this._debug('closed');
            this.emit('close');
        });
    }

    _onReceive(info) {
        // from base64 string
        const buf = new Buffer(info.data, 'base64');
        const rinfo = {
            address: info.address,
            port: info.port,
            family: 'IPv4',
            size: buf.length,
        };
        this.emit('message', buf, rinfo);
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
    send(buffer, offset, length, port, address, callback) {
        const self = this;
        if (typeof port !== 'number') throw new Error('invalid port');
        if (!isValidIpOrHostname(address, this._ipRegex)) throw new Error('invalid address');
        if (offset !== 0) throw new Error('Non-zero offset not supported yet');
        if (this._state === STATE.UNBOUND) {
            const args = [].slice.call(arguments);
            return this.bind(0, function(err) {
                if (err) return callback(err);
                self.send(self, args);
            });
        } else if (this._state === STATE.BINDING) {
            // we're ok, GCDAsync(Udp)Socket handles queueing internally
        }
        callback = callback || noop;
        let str;
        if (typeof buffer === 'string') {
            console.warn('socket.send(): interpreting as base64');
            str = buffer;
        } else if (typeof Buffer !== 'undefined' && Buffer.isBuffer(buffer)) {
            str = buffer.toString('base64');
        } else if (buffer instanceof Uint8Array || Array.isArray(buffer)) {
            str = Buffer.from(buffer).toString('base64');
        } else {
            throw new Error('invalid message format');
        }
        Sockets.send(this._id, str, +port, address, function(err) {
            err = normalizeError(err);
            if (err) {
                self._debug('send failed', err);
                return callback(err);
            }
            callback();
        });
    }

    address() {
        if (this._state !== STATE.BOUND) throw new Error('socket is not bound yet');

        return {
            address: this._address,
            port: this._port,
            family: 'IPv4',
        };
    }

    setBroadcast(flag) {
        const self = this;
        if (this._state !== STATE.BOUND) throw new Error('you must bind before setBroadcast()');

        Sockets.setBroadcast(this._id, flag, function(err) {
            err = normalizeError(err);
            if (err) {
                self._debug('failed to set broadcast', err);
                return self.emit('error', err);
            }
        });
    }

    // eslint-disable-next-line no-unused-vars
    setTTL(ttl) {
        // nothing yet
    }

    // eslint-disable-next-line no-unused-vars
    setMulticastTTL(ttl, callback) {
        // nothing yet
    }

    // eslint-disable-next-line no-unused-vars
    setMulticastLoopback(flag, callback) {
        // nothing yet
    }

    addMembership(multicastAddress) {
        if (this._state !== STATE.BOUND) throw new Error('you must bind before addMembership()');

        Sockets.addMembership(this._id, multicastAddress);
    }

    dropMembership(multicastAddress) {
        if (this._state !== STATE.BOUND) throw new Error('you must bind before addMembership()');

        Sockets.dropMembership(this._id, multicastAddress);
    }

    ref() {
        // anything?
    }

    unref() {
        // anything?
    }
}

function isValidIpOrHostname(address, ipRegex) {
    if (typeof address !== 'string') return false;

    return ipRegex.test(address) || hostnameRegex.test(address);
}

function normalizeError(err) {
    if (err) {
        if (typeof err === 'string') err = new Error(err);

        return err;
    }
}
