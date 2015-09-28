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
import java.net.InetSocketAddress;
import java.net.SocketAddress;
import java.nio.ByteBuffer;
import java.nio.channels.ClosedChannelException;
import java.nio.channels.DatagramChannel;
import java.nio.channels.SelectionKey;
import java.nio.channels.Selector;

/**
 * This is a specialized AsyncTask that receives data from a socket in the background, and
 * notifies it's listener when data is received.  This is not threadsafe, the listener
 * should handle synchronicity.
 */
public class UdpReceiverTask extends AsyncTask<Void, Void, Void> {
    private static final String TAG = "UdpReceiverTask";
    private static final int MAX_UDP_DATAGRAM_LEN = 1024;

    private DatagramChannel mChannel;
    private WeakReference<OnDataReceivedListener> mReceiverListener;

    /**
     * An {@link AsyncTask} that blocks to receive data from a socket.
     * Received data is sent via the {@link OnDataReceivedListener}
     */
    public UdpReceiverTask(DatagramChannel channel, UdpReceiverTask.OnDataReceivedListener
            receiverListener) {
        this.mChannel = channel;
        this.mReceiverListener = new WeakReference<>(receiverListener);
    }

    /**
     * Returns the UdpReceiverTask's DatagramChannel.
     */
    public DatagramChannel getChannel() {
        return mChannel;
    }

    /**
     * An infinite loop to block and read data from the socket.
     */
    @Override
    protected Void doInBackground(Void... a) {
        OnDataReceivedListener receiverListener = mReceiverListener.get();

        Selector selector = null;
        try {
            selector = Selector.open();
            mChannel.register(selector, SelectionKey.OP_READ);
        } catch (ClosedChannelException cce) {
            if (receiverListener != null) {
                receiverListener.didReceiveError(cce.getMessage());
            }
        } catch (IOException ioe) {
            if (receiverListener != null) {
                receiverListener.didReceiveError(ioe.getMessage());
            }
        }

        final ByteBuffer packet = ByteBuffer.allocate(MAX_UDP_DATAGRAM_LEN);
        while(!isCancelled()){
            try {
                if(selector.selectNow() >= 1){
                    final InetSocketAddress address = (InetSocketAddress) mChannel.receive(packet);
                    String base64Data = Base64.encodeToString(packet.array(), Base64.NO_WRAP);
                    receiverListener.didReceiveData(base64Data, address.getHostName(), address.getPort());
                    packet.clear();
                }
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
        OnDataReceivedListener receiverListener = mReceiverListener.get();

        if (mChannel != null && mChannel.isOpen()){
            try {
                mChannel.close();
            } catch (IOException ioe) {
                if (receiverListener != null) {
                    receiverListener.didReceiveError(ioe.getMessage());
                }
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
