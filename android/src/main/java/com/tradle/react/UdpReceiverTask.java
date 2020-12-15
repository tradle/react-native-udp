package com.tradle.react;

import android.util.Base64;

import java.io.IOException;
import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.InetAddress;

/**
 * This is a specialized Runnable that receives data from a socket in the background, and
 * notifies it's listener when data is received. This is not threadsafe, the listener
 * should handle synchronicity.
 */
public class UdpReceiverTask implements Runnable {
    private static final int MAX_UDP_DATAGRAM_LEN = 0xffff;
    private final DatagramSocket socket;
    private final UdpReceiverTask.OnDataReceivedListener receiverListener;
    private boolean isRunning = false;

    public UdpReceiverTask(DatagramSocket socket, UdpReceiverTask.OnDataReceivedListener receivedListener) {
        this.socket = socket;
        this.receiverListener = receivedListener;
    }

    public boolean isRunning() {
        return isRunning;
    }

    public void terminate() {
        isRunning = false;
    }

    /**
     * An infinite loop to block and read data from the socket.
     */
    @Override
    public void run() {
        isRunning = true;
        final byte[] buffer = new byte[MAX_UDP_DATAGRAM_LEN];
        DatagramPacket packet = new DatagramPacket(buffer, buffer.length);

        while (isRunning) {
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
                isRunning = false;
            } catch (RuntimeException rte) {
                if (receiverListener != null) {
                    receiverListener.didReceiveRuntimeException(rte);
                }
                isRunning = false;
            }
        }
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
