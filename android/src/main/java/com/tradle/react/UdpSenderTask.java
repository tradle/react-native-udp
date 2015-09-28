/**
 *  UdpSenderTask.java
 *  react-native-udp
 *
 *  Created by Andy Prock on 9/24/15.
 */

package com.tradle.react;

import android.os.AsyncTask;

import java.io.IOException;
import java.lang.ref.WeakReference;
import java.net.SocketAddress;
import java.nio.ByteBuffer;
import java.nio.channels.DatagramChannel;

/**
 * Specialized AsyncTask that transmits data in the background, and notifies listeners of the result.
 */
public class UdpSenderTask extends AsyncTask<UdpSenderTask.SenderPacket, Void, Void> {
    private static final String TAG = "UdpSenderTask";

    private DatagramChannel mChannel;
    private WeakReference<OnDataSentListener> mListener;

    public UdpSenderTask(DatagramChannel channel, OnDataSentListener listener) {
        this.mChannel = channel;
        this.mListener = new WeakReference<>(listener);
    }

    @Override
    protected Void doInBackground(SenderPacket... params) {
        OnDataSentListener listener = mListener.get();

        try {
            mChannel.send(params[0].data, params[0].socketAddress);
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

        return null;
    }

    /**
     * Simple class to marshall outgoing data across to this AsyncTask
     */
    public static class SenderPacket {
        SocketAddress socketAddress;
        ByteBuffer data;
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
