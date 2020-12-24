/**
 * @typedef {"ascii" | "utf8" | "utf-8" | "utf16le" | "ucs2" | "ucs-2" | "base64" | "latin1" | "binary" | "hex"} BufferEncoding
 */
export default class UdpSocket extends EventEmitter {
    /**
     * @param {{ type: string; reusePort?: boolean; debug?: boolean; }} options
     * @param {((...args: any[]) => void) | undefined} [onmessage]
     */
    constructor(options: {
        type: string;
        reusePort?: boolean;
        debug?: boolean;
    }, onmessage?: ((...args: any[]) => void) | undefined);
    type: string;
    reusePort: boolean | undefined;
    debugEnabled: boolean | undefined;
    /** @private */
    private _destroyed;
    /** @private */
    private _id;
    /** @private */
    private _state;
    /** @private */
    private _address;
    /** @private */
    private _port;
    /** @private */
    private _subscription;
    /**
     * @private
     */
    private _debug;
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
    bind(...args: any[]): void;
    /**
     * Close the underlying socket and stop listening for data on it. If a callback is provided,
     * it is added as a listener for the `'close'` event.
     *
     * @param {(...args: any[]) => void} callback
     */
    close(callback?: (...args: any[]) => void): number | undefined;
    /**
     * NOT IMPLEMENTED
     *
     * @deprecated
     * @param {number} port
     * @param {string} address
     * @param {(...args: any[]) => void} callback
     */
    connect(port: number, address: string, callback: (...args: any[]) => void): void;
    /**
     * NOT IMPLEMENTED
     *
     * @deprecated
     */
    disconnect(): void;
    /**
     * @private
     * @param {{ data: string; address: string; port: number; ts: number; }} info
     */
    private _onReceive;
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
    send(msg: string | Buffer | Uint8Array | Array<any>, offset?: number | undefined, length?: number | undefined, port?: number | undefined, address?: string | undefined, callback?: ((error?: Error | undefined) => void) | undefined): void;
    /**
     * @private
     * @param {string | Buffer | Uint8Array | Array<any>} msg
     * @param {BufferEncoding} [encoding]
     */
    private _generateSendBuffer;
    /**
     * Returns an object containing the address information for a socket.
     * For UDP sockets, this object will contain `address`, `family` and `port` properties.
     */
    address(): {
        address: string;
        port: number;
        family: string;
    };
    /**
     * Sets or clears the `SO_BROADCAST` socket option. When set to `true`,
     * UDP packets may be sent to a local interface's broadcast address.
     *
     * This method throws `EBADF` if called on an unbound socket.
     *
     * @param {boolean} flag
     */
    setBroadcast(flag: boolean): void;
    /**
     * NOT IMPLEMENTED
     *
     * @deprecated
     * @param {string} multicastInterface
     */
    setMulticastInterface(multicastInterface: string): void;
    /**
     * NOT IMPLEMENTED
     *
     * @deprecated
     * @param {boolean} flag
     */
    setMulticastLoopback(flag: boolean): void;
    /**
     * NOT IMPLEMENTED
     *
     * @deprecated
     * @param {number} ttl
     */
    setMulticastTTL(ttl: number): void;
    /**
     * NOT IMPLEMENTED
     *
     * @deprecated
     * @param {number} size
     */
    setRecvBufferSize(size: number): void;
    /**
     * NOT IMPLEMENTED
     *
     * @deprecated
     * @param {number} size
     */
    setSendBufferSize(size: number): void;
    /**
     * NOT IMPLEMENTED
     *
     * @deprecated
     * @param {number} ttl
     */
    setTTL(ttl: number): void;
    /**
     * NOT IMPLEMENTED
     *
     * @deprecated
     */
    unref(): void;
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
    addMembership(multicastAddress: string, multicastInterface?: string | undefined): void;
    /**
     * NOT IMPLEMENTED
     *
     * @deprecated
     * @param {string} sourceAddress
     * @param {string} groupAddress
     * @param {string} [multicastInterface]
     */
    addSourceSpecificMembership(sourceAddress: string, groupAddress: string, multicastInterface?: string | undefined): void;
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
    dropMembership(multicastAddress: string, multicastInterface?: string | undefined): void;
    /**
     * NOT IMPLEMENTED
     *
     * @deprecated
     * @param {string} sourceAddress
     * @param {string} groupAddress
     * @param {string} [multicastInterface]
     */
    dropSourceSpecificMembership(sourceAddress: string, groupAddress: string, multicastInterface?: string | undefined): void;
    /**
     * NOT IMPLEMENTED
     *
     * @deprecated
     */
    getRecvBufferSize(): void;
    /**
     * NOT IMPLEMENTED
     *
     * @deprecated
     */
    getSendBufferSize(): void;
    /**
     * NOT IMPLEMENTED
     *
     * @deprecated
     */
    ref(): void;
    /**
     * NOT IMPLEMENTED
     *
     * @deprecated
     */
    remoteAddress(): void;
}
export type BufferEncoding = "ascii" | "utf8" | "utf-8" | "utf16le" | "ucs2" | "ucs-2" | "base64" | "latin1" | "binary" | "hex";
import { EventEmitter } from "events";
import { Buffer } from "buffer";
