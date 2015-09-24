/**
 *  UdpSocketClient.java
 *  react-native-udp
 *
 *  Created by Andy Prock on 9/24/15.
 */

package com.tradle.react;

import android.os.AsyncTask;
import android.support.annotation.Nullable;
import android.util.Base64;

import com.facebook.react.bridge.Callback;

import java.io.IOException;
import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.SocketAddress;
import java.net.SocketException;
import java.net.UnknownHostException;
import java.nio.channels.DatagramChannel;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Client class that wraps a sender and a receiver for UDP data.
 */
public final class UdpSocketClient implements UdpReceiverTask.OnDataReceivedListener, UdpSenderTask.OnDataSentListener {
    private final OnDataReceivedListener mReceiverListener;
    private final OnRuntimeExceptionListener mExceptionListener;
    private final boolean mReuseAddress;
    private final Map<UdpSenderTask, Callback> mPendingSends;

    private DatagramChannel mChannel;
    private DatagramSocket mSocket;
    private UdpReceiverTask mReceiverTask;

    private UdpSocketClient(Builder builder) {
        this.mReceiverListener = builder.receiverListener;
        this.mExceptionListener = builder.exceptionListener;
        this.mReuseAddress = builder.reuse;
        this.mPendingSends = new ConcurrentHashMap<>();
    }

    /**
     * Binds to a specific port or address.  A random port is used if the address is {@code null}.
     *
     * @param port local port to bind to
     * @param address local address to bind to
     * @throws IOException
     * @throws IllegalArgumentException
     *             if the SocketAddress is not supported
     * @throws SocketException
     *             if the socket is already bound or a problem occurs during
     *             binding.
     */
    public void bind(Integer port, @Nullable String address) throws IOException {
        mChannel = DatagramChannel.open();
        mChannel.configureBlocking(true);
        mSocket = mChannel.socket();
        mReceiverTask = new UdpReceiverTask(mSocket, this);

        SocketAddress socketAddress = null;
        if (address != null) {
            socketAddress = new InetSocketAddress(address, port);
        } else {
            socketAddress = new InetSocketAddress(port);
        }

        mSocket.setReuseAddress(mReuseAddress);
        mSocket.bind(socketAddress);

        // begin listening for data in the background
        mReceiverTask.executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR);
    }

    /**
     * Creates a UdpSenderTask, and transmits udp data in the background.
     *
     * @param base64String byte array housed in a String.
     * @param port destination port
     * @param address destination address
     * @param callback callback for results
     * @throws UnknownHostException
     */
    public void send(String base64String, Integer port, String address, @Nullable Callback callback) throws UnknownHostException {
        byte[] data = Base64.decode(base64String, Base64.NO_WRAP);
        DatagramPacket packet = new DatagramPacket(data, data.length,
                InetAddress.getByName(address), port);
        UdpSenderTask task = new UdpSenderTask(mSocket, this);
        if (callback != null) {
            synchronized (mPendingSends) {
                mPendingSends.put(task, callback);
            }
        }
        task.execute(packet);
    }

    /**
     * Sets the socket to enable broadcasts.
     */
    public void setBroadcast(boolean flag) throws SocketException {
        if (mSocket != null) {
            mSocket.setBroadcast(flag);
        }
    }

    /**
     * Shuts down the receiver task, closing the socket.
     */
    public void close() throws IOException {
        if (mReceiverTask != null && !mReceiverTask.isCancelled()) {
            mReceiverTask.cancel(false);
        } else if (mChannel.isOpen()) {
            mChannel.close();
        }
    }

    /**
     * Retransmits the data back a level, attaching {@code this}
     */
    @Override
    public void didReceiveData(String data, String host, int port) {
        mReceiverListener.didReceiveData(this, data, host, port);
    }

    /**
     * Retransmits the error back a level, attaching {@code this}
     */
    @Override
    public void didReceiveError(String message) {
        mReceiverListener.didReceiveError(this, message);
    }

    /**
     * Retransmits the exception back a level, attaching {@code this}
     */
    @Override
    public void didReceiveRuntimeException(RuntimeException exception) {
        mExceptionListener.didReceiveException(exception);
    }

    /**
     * Transmits success to the javascript layer, if a callback is present.
     */
    @Override
    public void onDataSent(UdpSenderTask task) {
        Callback callback;

        synchronized (mPendingSends) {
            callback = mPendingSends.get(task);
            mPendingSends.remove(task);
        }

        if (callback != null) {
            callback.invoke();
        }
    }

    /**
     * Transmits an error to the javascript layer, if a callback is present.
     */
    @Override
    public void onDataSentError(UdpSenderTask task, String error) {
        Callback callback;

        synchronized (mPendingSends) {
            callback = mPendingSends.get(task);
            mPendingSends.remove(task);
        }

        if (callback != null) {
            callback.invoke(UdpErrorUtil.getError(null, error));
        }
    }

    /**
     * Retransmits the exception back a level, attaching {@code this}
     */
    @Override
    public void onDataSentRuntimeException(UdpSenderTask task, RuntimeException exception) {
        mExceptionListener.didReceiveException(exception);
        synchronized (mPendingSends) {
            mPendingSends.remove(task);
        }
    }


    public static class Builder {
        private OnDataReceivedListener receiverListener;
        private OnRuntimeExceptionListener exceptionListener;
        private boolean reuse = true;

        public Builder(OnDataReceivedListener receiverListener, OnRuntimeExceptionListener exceptionListener) {
            this.receiverListener = receiverListener;
            this.exceptionListener = exceptionListener;
        }

        public Builder reuseAddress(boolean reuse) {
            this.reuse = reuse;
            return this;
        }

        public UdpSocketClient build() {
            return new UdpSocketClient(this);
        }
    }

    /**
     * Callback interface for runtime exceptions.
     */
    public interface OnRuntimeExceptionListener {
        void didReceiveException(RuntimeException exception);
    }

    /**
     * Callback interface data received events.
     */
    public interface OnDataReceivedListener {
        void didReceiveData(UdpSocketClient client, String data, String host, int port);
        void didReceiveError(UdpSocketClient client, String message);
    }
}
