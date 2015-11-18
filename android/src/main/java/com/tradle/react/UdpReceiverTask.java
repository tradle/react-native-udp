/**
 *  UdpReceiverTask.java
 *  react-native-udp
 *
 *  Created by Andy Prock on 9/24/15.
 */

 package com.tradle.react;

 import android.os.AsyncTask;
 import android.util.Base64;

 import java.io.IOException;
 import java.lang.ref.WeakReference;
 import java.net.DatagramPacket;
 import java.net.DatagramSocket;
 import java.net.InetAddress;

/**
 * This is a specialized AsyncTask that receives data from a socket in the background, and
 * notifies it's listener when data is received.  This is not threadsafe, the listener
 * should handle synchronicity.
 */
public class UdpReceiverTask extends AsyncTask<Void, Void, Void> {
    private static final String TAG = "UdpReceiverTask";
    private static final int MAX_UDP_DATAGRAM_LEN = 1024;

    private DatagramSocket mSocket;
    private WeakReference<OnDataReceivedListener> mReceiverListener;

    /**
     * An {@link AsyncTask} that blocks to receive data from a socket.
     * Received data is sent via the {@link OnDataReceivedListener}
     */
    public UdpReceiverTask(DatagramSocket socket, UdpReceiverTask.OnDataReceivedListener
            receiverListener) {
        this.mSocket = socket;
        this.mReceiverListener = new WeakReference<>(receiverListener);
    }

    /**
     * Returns the UdpReceiverTask's DatagramChannel.
     */
    public DatagramSocket getSocket() {
        return mSocket;
    }

    /**
     * An infinite loop to block and read data from the socket.
     */
    @Override
    protected Void doInBackground(Void... a) {
        OnDataReceivedListener receiverListener = mReceiverListener.get();

        final byte[] buffer = new byte[MAX_UDP_DATAGRAM_LEN];
        DatagramPacket packet = new DatagramPacket(buffer, buffer.length);

        while (!isCancelled()) {
            try {
                mSocket.receive(packet);

                final InetAddress address = packet.getAddress();
                final String base64Data = Base64.encodeToString(packet.getData(), packet.getOffset(),
                    packet.getLength(), Base64.NO_WRAP);
                receiverListener.didReceiveData(base64Data, address.getHostName(), packet.getPort());
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
     * Close if cancelled.
     */
    @Override
    protected void onCancelled() {
//        mSocket.close();
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
