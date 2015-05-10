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

RCT_EXPORT_METHOD(createSocket:(NSString*)cId withOptions:(NSDictionary*)options)
{
    if (!_clients) _clients = [[NSMutableDictionary alloc] init];
    
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

RCT_EXPORT_METHOD(bind:(NSString*)cId
                  port:(int)port
                  address:(NSString *)address
                  callback:(RCTResponseSenderBlock)callback)
{
    UdpSocketClient* client = [self findClient:cId callback:callback];
    if (!client) return;
    
    NSError *error = nil;
    if (![client bind:port address:address error:&error])
    {
        callback(@[error]);
        return;
    }
    
    callback(@[[NSNull null], [client address]]);
}

RCT_EXPORT_METHOD(send:(NSString*)cId
                  data:(NSData*)data
                  port:(int)port
                  address:(NSString*)address
                  callback:(RCTResponseSenderBlock)callback) {
    UdpSocketClient* client = [self findClient:cId callback:callback];
    if (!client) return;
    
    [client send:data remotePort:port remoteAddress:address callback:callback];
    if (callback) callback(@[]);
}

RCT_EXPORT_METHOD(close:(NSString*)cId
                  callback:(RCTResponseSenderBlock)callback) {
    UdpSocketClient* client = [self findClient:cId callback:callback];
    if (!client) return;
    
    [client close];
    [_clients removeObjectForKey:cId];
    
    if (callback) callback(@[]);
}

- (void) onData:(UdpSocketClient*) client data:(NSData *)data host:(NSString *)host port:(uint16_t)port
{
    NSString *clientID = [[_clients allKeysForObject:client] objectAtIndex:0];
    NSPropertyListFormat format;
    NSArray* arr = [NSPropertyListSerialization propertyListFromData:data
                                                    mutabilityOption:NSPropertyListMutableContainers
                                                              format:&format
                                                    errorDescription:NULL];
    
    [self.bridge.eventDispatcher sendDeviceEventWithName:[NSString stringWithFormat:@"udp-%@-data", clientID]
                                                    body:@{
                                                           @"data": arr,
                                                           @"address": host,
                                                           @"port": [NSNumber numberWithInt:port]
                                                           }
     ];
}

-(UdpSocketClient*)findClient:(NSString*)cId callback:(RCTResponseSenderBlock)callback
{
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

@end
