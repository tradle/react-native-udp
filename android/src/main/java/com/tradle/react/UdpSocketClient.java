package com.tradle.react;

import android.util.Base64;

import com.facebook.react.bridge.Callback;

import java.io.IOException;
import java.net.DatagramSocket;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.MulticastSocket;
import java.net.SocketAddress;
import java.net.SocketException;
import java.net.UnknownHostException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import static com.tradle.react.UdpSenderTask.OnDataSentListener;

import javax.annotation.Nullable;

/**
 * Client class that wraps a sender and a receiver for UDP data.
 */
public final class UdpSocketClient implements UdpReceiverTask.OnDataReceivedListener, OnDataSentListener {
    private final OnDataReceivedListener mReceiverListener;
    private final OnRuntimeExceptionListener mExceptionListener;

    private ExecutorService executor = Executors.newSingleThreadExecutor();

    private UdpReceiverTask mReceiverTask;

    private final Map<UdpSenderTask, Callback> mPendingSends;
    private DatagramSocket mSocket;
    private boolean mIsMulticastSocket = false;

    public UdpSocketClient(OnDataReceivedListener receiverListener, OnRuntimeExceptionListener exceptionListener) {
        this.mReceiverListener = receiverListener;
        this.mExceptionListener = exceptionListener;
        this.mPendingSends = new ConcurrentHashMap<>();
    }

    /**
     * Checks to see if client part of a multi-cast group.
     * @return boolean true IF the socket is part of a multi-cast group.
     */
    public boolean isMulticast() {
        return mIsMulticastSocket;
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
        if (mSocket != null || mReceiverTask != null) {
            throw new IllegalStateException("Socket is already bound");
        }
        SocketAddress socketAddress;
        if (address != null) {
            socketAddress = new InetSocketAddress(InetAddress.getByName(address), port);
        } else {
            socketAddress = new InetSocketAddress(port);
        }

        mSocket = new MulticastSocket(socketAddress);
        mSocket.setReuseAddress(true);

        // begin listening for data in the background
        mReceiverTask = new UdpReceiverTask(mSocket, this);
        new Thread(mReceiverTask).start();
    }

    /**
     * Adds this socket to the specified multicast group. Rebuilds the receiver task with a
     * MulticastSocket.
     *
     * @param address the multicast group to join
     * @throws UnknownHostException
     * @throws IOException
     * @throws IllegalStateException if socket is not bound.
     */
    public void addMembership(String address) throws UnknownHostException, IOException, IllegalStateException {
        if (null == mSocket || !mSocket.isBound()) {
            throw new IllegalStateException("Socket is not bound.");
        }

        ((MulticastSocket) mSocket).joinGroup(InetAddress.getByName(address));
        mIsMulticastSocket = true;
    }

    /**
     * Removes this socket from the specified multicast group.
     *
     * @param address the multicast group to leave
     * @throws UnknownHostException
     * @throws IOException
     */
    public void dropMembership(String address) throws UnknownHostException, IOException {
        ((MulticastSocket) mSocket).leaveGroup(InetAddress.getByName(address));
        mIsMulticastSocket = false;
    }

    /**
     * Creates a UdpSenderTask, and transmits udp data in the background.
     *
     * @param base64String byte array housed in a String.
     * @param port destination port
     * @param address destination address
     * @param callback callback for results
     * @throws UnknownHostException
     * @throws IOException
     * @throws IllegalStateException if socket is not bound.
     */
    public void send(String base64String, Integer port, String address, @Nullable Callback callback)
            throws UnknownHostException, IllegalStateException, IOException {
        if (null == mSocket || !mSocket.isBound()) {
            throw new IllegalStateException("Socket is not bound.");
        }

        byte[] data = Base64.decode(base64String, Base64.NO_WRAP);

        UdpSenderTask task = new UdpSenderTask(mSocket, this, new InetSocketAddress(InetAddress.getByName(address), port), data);

        if (callback != null) {
            synchronized (mPendingSends) {
                mPendingSends.put(task, callback);
            }
        }

        executor.submit(task);
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
    public void close() {
        // stop the receiving task
        if (mReceiverTask != null && mReceiverTask.isRunning()) {
            mReceiverTask.terminate();
        }

        // stop pending send tasks
        executor.shutdownNow();

        // close the socket
        if (mSocket != null && !mSocket.isClosed()) {
            mSocket.close();
        }

        mSocket = null;
        mReceiverTask = null;
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
            callback.invoke(UdpErrorUtil.getError(UdpErrorCodes.sendError.name(), error));
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
