//
//  RCTUDP.h
//  react-native-udp
//
//  Created by Mark Vayngrib on 5/8/15.
//  Copyright (c) 2015 Tradle, Inc. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <Availability.h>
#import "GCDAsyncUdpSocket.h"
#import "UdpSocketClient.h"
#import <React/RCTBridge.h>
#import <React/RCTEventEmitter.h>

#ifdef RCT_NEW_ARCH_ENABLED

#import <UdpSocketsSpec/UdpSocketsSpec.h>

@interface UdpSockets : RCTEventEmitter<SocketClientDelegate, NativeUdpSocketsSpec>
#else

#import <React/RCTBridgeModule.h>

@interface UdpSockets : RCTEventEmitter<SocketClientDelegate, RCTBridgeModule>
#endif

@end
