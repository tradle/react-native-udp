export default class UdpSockets {
    /**
     * @param {{ type: string; }} options
     */
    static createSocket(options: {
        type: string;
    }): UdpSocket;
    static Socket: typeof UdpSocket;
}
import UdpSocket from "./UdpSocket";
