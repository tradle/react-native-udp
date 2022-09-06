/**
 *  UdpErrorUtil.java
 *  react-native-udp
 *
 *  Created by Andy Prock on 9/24/15.
 */

package com.tradle.react;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;

import javax.annotation.Nullable;

/**
 * Helper class for udp errors.
 */
public class UdpErrorUtil {
    /**
     * Create Error object to be passed back to the JS callback.
     */
    /* package */ static WritableMap getError(@Nullable String key, String errorMessage) {
        WritableMap errorMap = Arguments.createMap();
        errorMap.putString("message", errorMessage);
        if (key != null) {
            errorMap.putString("key", key);
        }
        return errorMap;
    }
}
