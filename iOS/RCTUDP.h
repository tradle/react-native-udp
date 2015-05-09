//
//  RCTUDP.h
//  react-native-udp
//
//  Created by Mark Vayngrib on 5/8/15.
//  Copyright (c) 2015 Tradle, Inc. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "RCTUDPClient.h"
#import "RCTBridgeModule.h"
#import "RCTBridge.h"
#import "RCTEventDispatcher.h"

@interface RCTUDP : NSObject<SocketClientDelegate, RCTBridgeModule>

@property(retain, nonatomic)NSMutableDictionary *clients;

@end
