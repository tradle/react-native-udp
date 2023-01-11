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

    public abstract void createSocket(final Integer cId, final ReadableMap options);
    public abstract void bind(
        final Integer cId,
        final Integer port,
        final @Nullable String address,
        final @Nullable ReadableMap options,
        final Callback callback
    );
    public abstract void addMembership(final Integer cId, final String multicastAddress);
    public abstract void dropMembership(final Integer cId, final String multicastAddress);
    public abstract void send(
        final Integer cId,
        final String base64String,
        final Integer port,
        final String address,
        final Callback callback
    );
    public abstract void close(final Integer cId, final Callback callback);
    public abstract void setBroadcast(final Integer cId, final Boolean flag, final Callback callback);
}
