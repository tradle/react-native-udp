/**
 *  UdpSenderTask.java
 *  react-native-udp
 *
 *  Created by Andy Prock on 9/24/15.
 */

package com.tradle.react;

import java.io.IOException;
import java.lang.ref.WeakReference;
import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.SocketAddress;

/**
 * Specialized AsyncTask that transmits data in the background, and notifies listeners of the result.
 */
public class UdpSenderTask implements Runnable {
    private static final String TAG = "UdpSenderTask";

    private final DatagramSocket mSocket;
    private final WeakReference<OnDataSentListener> mListener;

    private SocketAddress mSocketAddress;
    private byte[] mData;

    public UdpSenderTask(DatagramSocket socket, OnDataSentListener listener, SocketAddress socketAddress, byte[] data) {
        this.mSocket = socket;
        this.mListener = new WeakReference<>(listener);
        this.mSocketAddress = socketAddress;
        this.mData = data;
    }

    @Override
    public void run() {
        OnDataSentListener listener = mListener.get();

        try {
            if (mSocket == null) {
                return;
            }

            mSocket.send(new DatagramPacket(mData, mData.length, mSocketAddress));

            if (listener != null) {
                listener.onDataSent(this);
            }
        } catch (IOException e) {
            if (listener != null) {
                listener.onDataSentError(this, e.getMessage());
            }
        } catch (RuntimeException rte) {
            if (listener != null) {
                listener.onDataSentRuntimeException(this, rte);
            }
        }
    }

    /**
     * Callbacks for data send events.
     */
    public interface OnDataSentListener {
        void onDataSent(UdpSenderTask task);
        void onDataSentError(UdpSenderTask task, String error);
        void onDataSentRuntimeException(UdpSenderTask task, RuntimeException exception);
    }
}
