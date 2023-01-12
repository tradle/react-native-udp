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


- (NSArray<NSString *> *)supportedEvents
{
    return @[@"UdpSocketMessage"];
}

- (void)startObserving
{
}

- (void)stopObserving
{
}

- (void)dealloc
{
    for (NSNumber *cId in _clients.allKeys) {
        [self closeClient:cId callback:nil];
    }
}

RCT_EXPORT_METHOD(createSocket:(double)idNum withOptions:(NSDictionary*)options)
{
    NSNumber *cId = [NSNumber numberWithInt:idNum];

    if (!_clients) {
        _clients = [NSMutableDictionary new];
    }

    if (_clients[cId]) {
        RCTLogError(@"%@.createSocket called twice with the same id.", [self class]);
        return;
    }

    _clients[cId] = [UdpSocketClient socketClientWithConfig:self];
}

RCT_EXPORT_METHOD(bind:(double)idNum
                  port:(double)port
                  address:(NSString *)address
                  options:(NSDictionary *)options
                  callback:(RCTResponseSenderBlock)callback)
{
    NSNumber *cId = [NSNumber numberWithInt:idNum];
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

RCT_EXPORT_METHOD(send:(double)idNum
                  string:(NSString*)base64String
                  port:(double)port
                  address:(NSString*)address
                  callback:(RCTResponseSenderBlock)callback) {
    NSNumber *cId = [NSNumber numberWithInt:idNum];
    UdpSocketClient* client = [self findClient:cId callback:callback];
    if (!client) return;

    // iOS7+
    // TODO: use https://github.com/nicklockwood/Base64 for compatibility with earlier iOS versions
    NSData *data = [[NSData alloc] initWithBase64EncodedString:base64String options:0];
    [client send:data remotePort:(int)port remoteAddress:address callback:callback];
}

RCT_EXPORT_METHOD(close:(double)idNum
                  callback:(RCTResponseSenderBlock)callback) {
    NSNumber *cId = [NSNumber numberWithInt:idNum];
    [self closeClient:cId callback:callback];
}

RCT_EXPORT_METHOD(setBroadcast:(double)idNum
                  flag:(BOOL)flag
                  callback:(RCTResponseSenderBlock)callback) {
    NSNumber *cId = [NSNumber numberWithInt:idNum];
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

RCT_EXPORT_METHOD(addMembership:(double)idNum
                  multicastAddress:(NSString *)address) {
    NSNumber *cId = [NSNumber numberWithInt:idNum];
    UdpSocketClient *client = _clients[cId];
    
    if (!client) return;
    
    NSError *error = nil;
    [client joinMulticastGroup:address error:&error];
}

RCT_EXPORT_METHOD(dropMembership:(double)idNum
                  multicastAddress:(NSString *)address) {
    NSNumber *cId = [NSNumber numberWithInt:idNum];
    UdpSocketClient *client = _clients[cId];
    
    if (!client) return;
    
    NSError *error = nil;
    [client leaveMulticastGroup:address error:&error];
}

- (void) onData:(UdpSocketClient*) client data:(NSData *)data host:(NSString *)host port:(uint16_t)port
{
    if (!self.callableJSModules) return;
    long ts = (long)([[NSDate date] timeIntervalSince1970] * 1000);
    NSNumber *clientID = [[_clients allKeysForObject:client] objectAtIndex:0];
    NSString *base64String = [data base64EncodedStringWithOptions:0];
    [self sendEventWithName:@"UdpSocketMessage"
                       body:@{
                            @"id": clientID,
                            @"data": base64String,
                            @"address": host,
                            @"port": [NSNumber numberWithInt:port],
                            @"ts": [[NSNumber numberWithLong: ts] stringValue]
                            }
     ];
}

-(UdpSocketClient*)findClient:(NSNumber *)cId callback:(RCTResponseSenderBlock)callback
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

-(void) closeClient:(NSNumber *)cId
           callback:(RCTResponseSenderBlock)callback
{
    UdpSocketClient* client = [self findClient:cId callback:callback];
    if (!client) return;

    client.clientDelegate = nil;
    [client close];
    [_clients removeObjectForKey:cId];

    if (callback) callback(@[]);
}

#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeUdpSocketsSpecJSI>(params);
}
#endif

@end
