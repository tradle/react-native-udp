package com.tradle.react;

import android.content.Context;
import android.net.wifi.WifiManager;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import android.util.SparseArray;

import com.facebook.common.logging.FLog;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.io.IOException;
import java.net.SocketException;
import java.net.UnknownHostException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * The NativeModule in charge of storing active {@link UdpSocketClient}s, and acting as an api layer.
 */
public final class UdpSockets extends ReactContextBaseJavaModule
        implements UdpSocketClient.OnDataReceivedListener, UdpSocketClient.OnRuntimeExceptionListener {
    private static final String TAG = "UdpSockets";
    private static final int N_THREADS = 2;

    private WifiManager.MulticastLock mMulticastLock;
    private final SparseArray<UdpSocketClient> mClients = new SparseArray<>();
    private final ExecutorService executorService = Executors.newFixedThreadPool(N_THREADS);

    public UdpSockets(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @NonNull
    @Override
    public String getName() {
        return TAG;
    }

    @Override
    public void onCatalystInstanceDestroy() {
        executorService.execute(new Thread(new Runnable() {
            @Override
            public void run() {
                for (int i = 0; i < mClients.size(); i++) {
                    try {
                        mClients.valueAt(i).close();
                    } catch (IOException e) {
                        FLog.e(TAG, "exception when shutting down", e);
                    }
                }
                mClients.clear();
            }
        }));
    }

    /**
     * Private method to retrieve clients. Must be called from a GuardedAsyncTask for thread-safety.
     */
    private UdpSocketClient findClient(final Integer cId, final Callback callback) {
        final UdpSocketClient client = mClients.get(cId);
        if (client == null) {
            if (callback == null) {
                FLog.e(TAG, "missing callback parameter.");
            } else {
                callback.invoke(UdpErrorUtil.getError(null, "no client found with id " + cId), null);
            }
        }

        return client;
    }

    /**
     * Creates a {@link UdpSocketClient} with the given ID, and options
     */
    @ReactMethod
    public void createSocket(final Integer cId, final ReadableMap options) {
        if (cId == null) {
            FLog.e(TAG, "createSocket called with nil id parameter.");
            return;
        }

        UdpSocketClient client = mClients.get(cId);
        if (client != null) {
            FLog.e(TAG, "createSocket called twice with the same id.");
            return;
        }

        UdpSocketClient.Builder builder = new UdpSocketClient.Builder(UdpSockets.this, UdpSockets.this);
        mClients.put(cId, builder.build());
    }

    /**
     * Binds to a given port and address, and begins listening for data.
     */
    @ReactMethod
    public void bind(final Integer cId, final Integer port, final @Nullable String address, final @Nullable ReadableMap options,
                     final Callback callback) {
        executorService.execute(new Thread(new Runnable() {
            @Override
            public void run() {
                UdpSocketClient client = findClient(cId, callback);
                if (client == null) {
                    return;
                }

                try {
                    client.bind(port, address);

                    WritableMap result = Arguments.createMap();
                    result.putString("address", address);
                    result.putInt("port", port);

                    callback.invoke(null, result);
                } catch (SocketException se) {
                    // Socket is already bound or a problem occurred during binding
                    callback.invoke(UdpErrorUtil.getError(null, se.getMessage()));
                } catch (IllegalArgumentException iae) {
                    // SocketAddress is not supported
                    callback.invoke(UdpErrorUtil.getError(null, iae.getMessage()));
                } catch (IOException ioe) {
                    // an exception occurred
                    callback.invoke(UdpErrorUtil.getError(null, ioe.getMessage()));
                }
            }
        }));
    }

    /**
     * Joins a multi-cast group
     */
    @SuppressWarnings("unused")
    @ReactMethod
    public void addMembership(final Integer cId, final String multicastAddress) {
        executorService.execute(new Thread(new Runnable() {
            @Override
            public void run() {
                UdpSocketClient client = findClient(cId, null);
                if (client == null) {
                    return;
                }

                if (mMulticastLock == null) {
                    WifiManager wifiMgr = (WifiManager) getReactApplicationContext()
                            .getApplicationContext()
                            .getSystemService(Context.WIFI_SERVICE);
                    mMulticastLock = wifiMgr.createMulticastLock("react-native-udp");
                    mMulticastLock.setReferenceCounted(true);
                }

                try {
                    mMulticastLock.acquire();
                    client.addMembership(multicastAddress);
                } catch (IllegalStateException ise) {
                    // an exception occurred
                    if (mMulticastLock != null && mMulticastLock.isHeld()) {
                        mMulticastLock.release();
                    }
                    FLog.e(TAG, "addMembership", ise);
                } catch (UnknownHostException uhe) {
                    // an exception occurred
                    if (mMulticastLock != null && mMulticastLock.isHeld()) {
                        mMulticastLock.release();
                    }
                    FLog.e(TAG, "addMembership", uhe);
                } catch (IOException ioe) {
                    // an exception occurred
                    if (mMulticastLock != null && mMulticastLock.isHeld()) {
                        mMulticastLock.release();
                    }
                    FLog.e(TAG, "addMembership", ioe);
                }
            }
        }));
    }

    /**
     * Leaves a multi-cast group
     */
    @ReactMethod
    public void dropMembership(final Integer cId, final String multicastAddress) {
        executorService.execute(new Thread(new Runnable() {
            @Override
            public void run() {
                UdpSocketClient client = findClient(cId, null);
                if (client == null) {
                    return;
                }

                try {
                    client.dropMembership(multicastAddress);
                } catch (IOException ioe) {
                    // an exception occurred
                    FLog.e(TAG, "dropMembership", ioe);
                } finally {
                    if (mMulticastLock != null && mMulticastLock.isHeld()) {
                        mMulticastLock.release();
                    }
                }
            }
        }));
    }

    /**
     * Sends udp data via the {@link UdpSocketClient}
     */
    @ReactMethod
    public void send(final Integer cId, final String base64String,
                     final Integer port, final String address, final Callback callback) {
        executorService.execute(new Thread(new Runnable() {
            @Override
            public void run() {
                UdpSocketClient client = findClient(cId, callback);
                if (client == null) {
                    return;
                }

                try {
                    client.send(base64String, port, address, callback);
                } catch (IllegalStateException ise) {
                    callback.invoke(UdpErrorUtil.getError(null, ise.getMessage()));
                } catch (UnknownHostException uhe) {
                    callback.invoke(UdpErrorUtil.getError(null, uhe.getMessage()));
                } catch (IOException ioe) {
                    // an exception occurred
                    callback.invoke(UdpErrorUtil.getError(null, ioe.getMessage()));
                }
            }
        }));
    }

    /**
     * Closes a specific client's socket, and removes it from the list of known clients.
     */
    @ReactMethod
    public void close(final Integer cId, final Callback callback) {
        executorService.execute(new Thread(new Runnable() {
            @Override
            public void run() {
                UdpSocketClient client = findClient(cId, callback);
                if (client == null) {
                    return;
                }

                if (mMulticastLock != null && mMulticastLock.isHeld() && client.isMulticast()) {
                    // drop the multi-cast lock if this is a multi-cast client
                    mMulticastLock.release();
                }

                try {
                    client.close();
                    callback.invoke();
                } catch (IOException ioe) {
                    callback.invoke(UdpErrorUtil.getError(null, ioe.getMessage()));
                }

                mClients.remove(cId);
            }
        }));
    }

    /**
     * Sets the broadcast flag for a given client.
     */
    @ReactMethod
    public void setBroadcast(final Integer cId, final Boolean flag, final Callback callback) {
        executorService.execute(new Thread(new Runnable() {
            @Override
            public void run() {
                UdpSocketClient client = findClient(cId, callback);
                if (client == null) {
                    return;
                }

                try {
                    client.setBroadcast(flag);
                    callback.invoke();
                } catch (SocketException e) {
                    callback.invoke(UdpErrorUtil.getError(null, e.getMessage()));
                }
            }
        }));
    }

    /**
     * Notifies the javascript layer upon data receipt.
     */
    @Override
    public void didReceiveData(final UdpSocketClient socket, final String data, final String host, final int port) {
        executorService.execute(new Thread(new Runnable() {
            @Override
            public void run() {
                int clientID = -1;
                for (int i = 0; i < mClients.size(); i++) {
                    clientID = mClients.keyAt(i);
                    // get the object by the key.
                    if (socket.equals(mClients.get(clientID))) {
                        break;
                    }
                }

                if (clientID == -1) {
                    return;
                }

                WritableMap eventParams = Arguments.createMap();
                eventParams.putString("data", data);
                eventParams.putString("address", host);
                eventParams.putInt("port", port);

                ReactContext reactContext = UdpSockets.this.getReactApplicationContext();
                reactContext
                        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                        .emit("udp-" + clientID + "-data", eventParams);
            }
        }));
    }

    /**
     * Logs an error that happened during or prior to data reception.
     */
    @Override
    public void didReceiveError(UdpSocketClient client, String message) {
        FLog.e(TAG, message);
    }

    /**
     * Sends RuntimeExceptions to the application context handler.
     */
    @Override
    public void didReceiveException(RuntimeException exception) {
        getReactApplicationContext().handleException(exception);
    }
}
