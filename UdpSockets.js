/**
 * @providesModule UdpSockets
 * @flow
 */

import UdpSocket from './UdpSocket';

export default {
    createSocket: function(options) {
        if (typeof options === 'string') options = { type: options };
        return new UdpSocket(options);
    },
    Socket: UdpSocket,
};
