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

/**
 * This is a specialized AsyncTask that receives data from a socket in the background, and
 * notifies it's listener when data is received.
 */
public class UdpReceiverTask extends AsyncTask<Void, UdpReceiverTask.ReceivedPacket, Void> {
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
     * An infinite loop to block and read data from the socket.
     */
    @Override
    protected Void doInBackground(Void... a) {
        OnDataReceivedListener receiverListener = mReceiverListener.get();
        try {
            byte[] lMsg = new byte[MAX_UDP_DATAGRAM_LEN];
            DatagramPacket dp = new DatagramPacket(lMsg, lMsg.length);
            while(!isCancelled()){
                mSocket.receive(dp);
                publishProgress(new ReceivedPacket(Base64.encodeToString(lMsg, Base64.NO_WRAP),
                        dp.getAddress().getHostAddress(), dp.getPort()));
            }
        } catch (IOException ioe) {
            if (receiverListener != null) {
                receiverListener.didReceiveError(ioe.getMessage());
            }
        } catch (RuntimeException rte) {
            if (receiverListener != null) {
                receiverListener.didReceiveRuntimeException(rte);
            }
        }

        return null;
    }

    /**
     * Send data out to the listener.
     * @param {@link ReceivedPacket} packet marshalled data
     */
    @Override
    protected void onProgressUpdate(ReceivedPacket... packet) {
        OnDataReceivedListener receiverListener = mReceiverListener.get();
        if (receiverListener != null) {
            receiverListener.didReceiveData(packet[0].base64String, packet[0].address,
              packet[0].port);
        }
    }

    /**
     * Close if cancelled.
     */
    @Override
    protected void onCancelled(){
        if (mSocket != null){
            mSocket.close();
        }
    }

    /**
     * Internal class used to marshall packet data as a progress update.
     * base64String the data encoded as a base64 string
     * address the address of the sender
     * port the port number of the sender
     */
    class ReceivedPacket {
        String base64String;
        String address;
        int port;

        ReceivedPacket(String base64String, String address, int port) {
            this.base64String = base64String;
            this.address = address;
            this.port = port;
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
