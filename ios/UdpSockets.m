//
//  UdpSockets.m
//  react-native-udp
//
//  Created by Mark Vayngrib on 5/8/15.
//  Copyright (c) 2015 Tradle, Inc. All rights reserved.
//

#import "RCTAssert.h"
#import "RCTBridge.h"
#import "RCTConvert.h"
#import "RCTEventDispatcher.h"
#import "RCTLog.h"
#import "UdpSockets.h"
#import "UdpSocketClient.h"

@implementation UdpSockets

RCT_EXPORT_MODULE()

@synthesize bridge = _bridge;

+ (void) initialize {
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(closeAllSockets)
                                               name:RCTReloadNotification
                                             object:nil];
}

+(NSMutableDictionary*) clients
{
    static NSMutableDictionary* c = nil;

    static dispatch_once_t oncePredicate;

    dispatch_once(&oncePredicate, ^{
      c = [[NSMutableDictionary alloc] init];
    });

    return c;
}

RCT_EXPORT_METHOD(createSocket:(nonnull NSNumber*)cId withOptions:(NSDictionary*)options)
{
//    if (!UdpSockets._clients) UdpSockets._clients = [[NSMutableDictionary alloc] init];

    NSMutableDictionary* _clients = [UdpSockets clients];
    if (!cId) {
        RCTLogError(@"%@.createSocket called with nil id parameter.", [self class]);
        return;
    }

    UdpSocketClient *client = [_clients objectForKey:cId];
    if (client) {
        RCTLogError(@"%@.createSocket called twice with the same id.", [self class]);
        return;
    }

    client = [UdpSocketClient socketClientWithConfig:self];
    [_clients setObject:client forKey:cId];
}

RCT_EXPORT_METHOD(bind:(nonnull NSNumber*)cId
                  port:(int)port
                  address:(NSString *)address
                  callback:(RCTResponseSenderBlock)callback)
{
    UdpSocketClient* client = [UdpSockets findClient:cId callback:callback];
    if (!client) return;

    NSError *error = nil;
    if (![client bind:port address:address error:&error])
    {
        NSString* msg = [[error userInfo] valueForKey:@"NSLocalizedFailureReason"];
        callback(@[msg]);
        return;
    }

    callback(@[[NSNull null], [client address]]);
}

RCT_EXPORT_METHOD(send:(nonnull NSNumber*)cId
                  string:(NSString*)base64String
                  port:(int)port
                  address:(NSString*)address
                  callback:(RCTResponseSenderBlock)callback) {
    UdpSocketClient* client = [UdpSockets findClient:cId callback:callback];
    if (!client) return;

    // iOS7+
    // TODO: use https://github.com/nicklockwood/Base64 for compatibility with earlier iOS versions
    NSData *data = [[NSData alloc] initWithBase64EncodedString:base64String options:0];
    [client send:data remotePort:port remoteAddress:address callback:callback];
}

RCT_EXPORT_METHOD(close:(nonnull NSNumber*)cId
                  callback:(RCTResponseSenderBlock)callback) {
    [UdpSockets closeClient:cId callback:callback];
}

RCT_EXPORT_METHOD(setBroadcast:(nonnull NSNumber*)cId
                  flag:(BOOL)flag
                  callback:(RCTResponseSenderBlock)callback) {
    UdpSocketClient* client = [UdpSockets findClient:cId callback:callback];
    if (!client) return;

    NSError *error = nil;
    if (![client setBroadcast:flag error:&error])
    {
        NSString* msg = [[error userInfo] valueForKey:@"NSLocalizedFailureReason"];
        callback(@[msg]);
        return;
    }
    callback(@[[NSNull null]]);
}

RCT_EXPORT_METHOD(addMembership:(nonnull NSNumber*)cId
                  multicastAddress:(NSString *)address) {
    /* nop */
}

RCT_EXPORT_METHOD(dropMembership:(nonnull NSNumber*)cId
                  multicastAddress:(NSString *)address) {
    /* nop */
}

- (void) onData:(UdpSocketClient*) client data:(NSData *)data host:(NSString *)host port:(uint16_t)port
{
    NSMutableDictionary* _clients = [UdpSockets clients];
    NSString *clientID = [[_clients allKeysForObject:client] objectAtIndex:0];
    NSString *base64String = [data base64EncodedStringWithOptions:0];
    [self.bridge.eventDispatcher sendDeviceEventWithName:[NSString stringWithFormat:@"udp-%@-data", clientID]
                                                    body:@{
                                                           @"data": base64String,
                                                           @"address": host,
                                                           @"port": [NSNumber numberWithInt:port]
                                                           }
     ];
}

+(UdpSocketClient*)findClient:(nonnull NSNumber*)cId callback:(RCTResponseSenderBlock)callback
{
    NSMutableDictionary* _clients = [UdpSockets clients];
    UdpSocketClient *client = [_clients objectForKey:cId];
    if (!client) {
        if (!callback) {
            RCTLogError(@"%@.missing callback parameter.", [self class]);
        }
        else {
            callback(@[[NSString stringWithFormat:@"no client found with id %@", cId]]);
        }

        return nil;
    }

    return client;
}

+(void) closeClient:(nonnull NSNumber*)cId
           callback:(RCTResponseSenderBlock)callback
{
    NSMutableDictionary* _clients = [UdpSockets clients];
    UdpSocketClient* client = [UdpSockets findClient:cId callback:callback];
    if (!client) return;

    [client close];
    [_clients removeObjectForKey:cId];

    if (callback) callback(@[]);
}

+(void) closeAllSockets {
    NSMutableDictionary* _clients = [UdpSockets clients];
    for (NSNumber* cId in _clients) {
        [UdpSockets closeClient:cId callback:nil];
    }
}

@end
