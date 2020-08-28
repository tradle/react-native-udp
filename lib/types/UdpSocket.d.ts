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
    _ipRegex: RegExp;
    _id: number;
    _state: number;
    _address: string;
    _port: number;
    _subscription: import("react-native").EmitterSubscription;
    _debug(...args: any[]): void;
    /**
     * @param {any[]} args
     */
    bind(...args: any[]): void;
    close(callback?: () => void): NodeJS.Immediate | undefined;
    _destroying: boolean | undefined;
    _destroyed: boolean | undefined;
    /**
     * @param {{ data: string; address: string; port: number; }} info
     */
    _onReceive(info: {
        data: string;
        address: string;
        port: number;
    }): void;
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
     * @param {DataView|string|Array<any>} buffer Message to be sent
     * @param {number} [offset] Offset in the buffer where the message starts.
     * @param {number} [length] Number of bytes in the message.
     * @param {number} [port] destination port
     * @param {string} [address] destination IP
     * @param {function} [callback] Callback when message is done being delivered.
     */
    send(buffer: DataView | string | Array<any>, offset?: number | undefined, length?: number | undefined, port?: number | undefined, address?: string | undefined, callback?: Function | undefined, ...args: any[]): void;
    address(): {
        address: string;
        port: number;
        family: string;
    };
    /**
     * @param {boolean} flag
     */
    setBroadcast(flag: boolean): void;
    setTTL(ttl: any): void;
    setMulticastTTL(ttl: any, callback: any): void;
    setMulticastLoopback(flag: any, callback: any): void;
    /**
     * @param {string} multicastAddress
     */
    addMembership(multicastAddress: string): void;
    /**
     * @param {string} multicastAddress
     */
    dropMembership(multicastAddress: string): void;
    ref(): void;
    unref(): void;
}
import { EventEmitter } from "node/events";
