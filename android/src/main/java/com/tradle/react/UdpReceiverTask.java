/**
 *  UdpReceiverTask.java
 *  react-native-udp
 *
 *  Created by Andy Prock on 9/24/15.
 */

package com.tradle.react;

import android.os.AsyncTask;
import android.util.Base64;
import android.util.Pair;

import java.io.IOException;
import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.InetAddress;

/**
 * This is a specialized AsyncTask that receives data from a socket in the background, and
 * notifies it's listener when data is received.  This is not threadsafe, the listener
 * should handle synchronicity.
 */
public class UdpReceiverTask extends AsyncTask<Pair<DatagramSocket, UdpReceiverTask.OnDataReceivedListener>, Void, Void> {
    private static final String TAG = "UdpReceiverTask";
    private static final int MAX_UDP_DATAGRAM_LEN = 0xffff;

    /**
     * An infinite loop to block and read data from the socket.
     */
    @Override
    protected Void doInBackground(Pair<DatagramSocket, UdpReceiverTask.OnDataReceivedListener>... params) {
        if (params.length > 1) {
            throw new IllegalArgumentException("This task is only for a single socket/listener pair.");
        }

        DatagramSocket socket = params[0].first;
        OnDataReceivedListener receiverListener = params[0].second;

        final byte[] buffer = new byte[MAX_UDP_DATAGRAM_LEN];
        DatagramPacket packet = new DatagramPacket(buffer, buffer.length);

        while (!isCancelled()) {
            try {
                socket.receive(packet);

                final InetAddress address = packet.getAddress();
                final String base64Data = Base64.encodeToString(packet.getData(), packet.getOffset(),
                    packet.getLength(), Base64.NO_WRAP);
                receiverListener.didReceiveData(base64Data, address.getHostAddress(), packet.getPort());
            } catch (IOException ioe) {
                if (receiverListener != null) {
                    receiverListener.didReceiveError(ioe.getMessage());
                }
                this.cancel(false);
            } catch (RuntimeException rte) {
                if (receiverListener != null) {
                    receiverListener.didReceiveRuntimeException(rte);
                }
                this.cancel(false);
            }
        }

        return null;
    }

    /**
     * Listener interface for receive events.
     */
    public interface OnDataReceivedListener {
        void didReceiveData(String data, String host, int port);
        void didReceiveError(String message);
        void didReceiveRuntimeException(RuntimeException exception);
    }
}
