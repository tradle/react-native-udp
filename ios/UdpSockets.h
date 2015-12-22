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
#import "RCTBridgeModule.h"
#import "RCTBridge.h"
#import "RCTEventDispatcher.h"

@interface UdpSockets : NSObject<SocketClientDelegate, RCTBridgeModule>

@end
