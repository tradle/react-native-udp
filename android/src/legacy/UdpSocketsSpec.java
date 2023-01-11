package com.tradle.react;

import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.Callback;
import javax.annotation.Nullable;

public abstract class UdpSocketsSpec extends ReactContextBaseJavaModule {
    UdpSocketsSpec(ReactApplicationContext context) {
        super(context);
    }

    public abstract void createSocket(double cId, ReadableMap options);
    public abstract void bind(
        double cId,
        double port,
        @Nullable String address,
        @Nullable ReadableMap options,
        Callback callback
    );
    public abstract void addMembership(double cId, String multicastAddress);
    public abstract void dropMembership(double cId, String multicastAddress);
    public abstract void send(
        double cId,
        String base64String,
        double port,
        String address,
        Callback callback
    );
    public abstract void close(double cId, Callback callback);
    public abstract void setBroadcast(double cId, Boolean flag, Callback callback);
}
