/**
 *  UdpErrorUtil.java
 *  react-native-udp
 *
 *  Created by Andy Prock on 9/24/15.
 */

package com.tradle.react;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;

import javax.annotation.Nonnull;

/**
 * Helper class for udp errors.
 */
public class UdpErrorUtil {
    /**
     * Create Error object to be passed back to the JS callback.
     */
    /* package */ static WritableMap getError(@Nonnull String key, String errorMessage) {
        final WritableMap errorMap = Arguments.createMap();
        errorMap.putString("key", key);
        errorMap.putString("message", errorMessage);
        return errorMap;
    }
}
