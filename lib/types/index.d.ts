export default UdpSockets;
export type Buffer = import("buffer").Buffer;
/**
 * @typedef {import('buffer').Buffer} Buffer
 */
declare class UdpSockets {
    /**
     * Creates a `UdpSockets.Socket` object. Once the socket is created, calling
     * `socket.bind()` will instruct the socket tobegin listening for datagram
     * messages. When `address` and `port` are not passed to `socket.bind()` the
     * method will bind the socket to the "all interfaces" address on a random port
     * (it does the right thing for both `udp4` and `udp6` sockets).
     * The bound address and port can be retrieved using `socket.address().address`
     * and `socket.address().port`.
     *
     * @param {{ type: string; reusePort?: boolean; debug?: boolean; }} options
     * @param {(msg: Buffer) => void} [callback]
     */
    static createSocket(options: {
        type: string;
        reusePort?: boolean;
        debug?: boolean;
    }, callback?: ((msg: Buffer) => void) | undefined): UdpSocket;
    static Socket: typeof UdpSocket;
}
import UdpSocket from "./UdpSocket";
