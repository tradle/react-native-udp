//
//  UdpSockets.m
//  react-native-udp
//
//  Created by Mark Vayngrib on 5/8/15.
//  Copyright (c) 2015 Tradle, Inc. All rights reserved.
//

#import <React/RCTAssert.h>
#import <React/RCTBridge.h>
#import <React/RCTConvert.h>
#import <React/RCTEventDispatcher.h>
#import <React/RCTLog.h>
#import "UdpSockets.h"
#import "UdpSocketClient.h"

@implementation UdpSockets
{
    NSMutableDictionary<NSNumber *, UdpSocketClient *> *_clients;
}

RCT_EXPORT_MODULE()

@synthesize bridge = _bridge;

- (void)dealloc
{
    for (NSNumber *cId in _clients.allKeys) {
        [self closeClient:cId callback:nil];
    }
}


RCT_EXPORT_METHOD(createSocket:(nonnull NSNumber*)cId withOptions:(NSDictionary*)options)
{
    if (!cId) {
        RCTLogError(@"%@.createSocket called with nil id parameter.", [self class]);
        return;
    }

    if (!_clients) {
        _clients = [NSMutableDictionary new];
    }

    if (_clients[cId]) {
        RCTLogError(@"%@.createSocket called twice with the same id.", [self class]);
        return;
    }

    _clients[cId] = [UdpSocketClient socketClientWithConfig:self];
}

RCT_EXPORT_METHOD(bind:(nonnull NSNumber*)cId
                  port:(int)port
                  address:(NSString *)address
                  options:(NSDictionary *)options
                  callback:(RCTResponseSenderBlock)callback)
{
    UdpSocketClient* client = [self findClient:cId callback:callback];
    if (!client) return;

    NSError *error = nil;
    if (![client bind:port address:address options:options error:&error])
    {
        NSString *msg = error.localizedFailureReason ?: error.localizedDescription;
        callback(@[msg ?: @"unknown error when binding"]);
        return;
    }

    callback(@[[NSNull null], [client address]]);
}

RCT_EXPORT_METHOD(send:(nonnull NSNumber*)cId
                  string:(NSString*)base64String
                  port:(int)port
                  address:(NSString*)address
                  callback:(RCTResponseSenderBlock)callback) {
    UdpSocketClient* client = [self findClient:cId callback:callback];
    if (!client) return;

    // iOS7+
    // TODO: use https://github.com/nicklockwood/Base64 for compatibility with earlier iOS versions
    NSData *data = [[NSData alloc] initWithBase64EncodedString:base64String options:0];
    [client send:data remotePort:port remoteAddress:address callback:callback];
}

RCT_EXPORT_METHOD(close:(nonnull NSNumber*)cId
                  callback:(RCTResponseSenderBlock)callback) {
    [self closeClient:cId callback:callback];
}

RCT_EXPORT_METHOD(setBroadcast:(nonnull NSNumber*)cId
                  flag:(BOOL)flag
                  callback:(RCTResponseSenderBlock)callback) {
    UdpSocketClient* client = [self findClient:cId callback:callback];
    if (!client) return;

    NSError *error = nil;
    if (![client setBroadcast:flag error:&error])
    {
        NSString *msg = error.localizedFailureReason ?: error.localizedDescription;
        callback(@[msg ?: @"unknown error when setBroadcast"]);
        return;
    }
    callback(@[[NSNull null]]);
}

RCT_EXPORT_METHOD(addMembership:(nonnull NSNumber*)cId
                  multicastAddress:(NSString *)address) {
     UdpSocketClient *client = _clients[cId];
    
    if (!client) return;
    
    NSError *error = nil;
    [client joinMulticastGroup:address error:&error];
}

RCT_EXPORT_METHOD(dropMembership:(nonnull NSNumber*)cId
                  multicastAddress:(NSString *)address) {
    UdpSocketClient *client = _clients[cId];
    
    if (!client) return;
    
    NSError *error = nil;
    [client leaveMulticastGroup:address error:&error];
}

- (void) onData:(UdpSocketClient*) client data:(NSData *)data host:(NSString *)host port:(uint16_t)port
{
    NSNumber *clientID = [[_clients allKeysForObject:client] objectAtIndex:0];
    NSString *base64String = [data base64EncodedStringWithOptions:0];
    [self.bridge.eventDispatcher sendDeviceEventWithName:[NSString stringWithFormat:@"udp-%@-data", clientID]
                                                    body:@{
                                                           @"data": base64String,
                                                           @"address": host,
                                                           @"port": [NSNumber numberWithInt:port]
                                                           }
     ];
}

-(UdpSocketClient*)findClient:(nonnull NSNumber*)cId callback:(RCTResponseSenderBlock)callback
{
    UdpSocketClient *client = _clients[cId];
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

-(void) closeClient:(nonnull NSNumber*)cId
           callback:(RCTResponseSenderBlock)callback
{
    UdpSocketClient* client = [self findClient:cId callback:callback];
    if (!client) return;

    client.clientDelegate = nil;
    [client close];
    [_clients removeObjectForKey:cId];

    if (callback) callback(@[]);
}

@end
