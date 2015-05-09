//
//  RCTUDPClient.m
//  react-native-udp
//
//  Created by Mark Vayngrib on 5/9/15.
//  Copyright (c) 2015 Tradle, Inc. All rights reserved.
//

#import <netinet/in.h>
#import <arpa/inet.h>
#import "RCTUDPClient.h"
#import "RCTBridgeModule.h"
#import "GCDAsyncUdpSocket.h"

NSString *const RCTUDPErrorDomain = @"RCTUDPErrorDomain";

@interface RCTUDPClient()
{
@private
  uint16_t _port;
  NSString* _address;
  GCDAsyncUdpSocket *_udpSocket;
  id<SocketClientDelegate> _clientDelegate;
  NSMutableDictionary* _pendingSends;
  long tag;
}

- (id)initWithConfig:(id<SocketClientDelegate>) aDelegate;

@end

@implementation RCTUDPClient

+ (id)socketClientWithConfig:(id<SocketClientDelegate>)delegate
{
  return [[[self class] alloc] initWithConfig:delegate];
}

- (id)initWithConfig:(id<SocketClientDelegate>) aDelegate
{
  self = [super init];
  if (self) {
    _clientDelegate = aDelegate;
    _pendingSends = [NSMutableDictionary dictionary];
  }

  return self;
}

- (BOOL) bind:(u_int16_t)port address:(NSString *)address error:(NSError **) error
{

  if (_port) {
    if (error) {
      *error = [self badInvocationError:@"this client's socket is already bound"];
    }

    return false;
  }

  _port = port;
  _address = address;

  _udpSocket = [[GCDAsyncUdpSocket alloc] initWithDelegate:self delegateQueue:[self methodQueue]];
  BOOL result;
  if (address) {
    struct sockaddr_in ip;
    ip.sin_family = AF_INET;
    ip.sin_port = htons(6003);
    inet_pton(AF_INET, [address cStringUsingEncoding:NSASCIIStringEncoding], &ip.sin_addr);

    NSData * hostAndPort = [NSData dataWithBytes:&ip length:sizeof(ip)];
    result = [_udpSocket bindToAddress:hostAndPort error:error];
  }
  else {
    result = [_udpSocket bindToPort:port error:error];
  }

  return result && [_udpSocket beginReceiving:error];
}

- (void)udpSocket:(GCDAsyncUdpSocket *)sock didSendDataWithTag:(long)msgTag
{
  NSNumber* tagNum = [NSNumber numberWithLong:msgTag];
  RCTResponseSenderBlock callback = [_pendingSends objectForKey:tagNum];
  if (callback) {
    callback(@[]);
    [_pendingSends removeObjectForKey:tagNum];
  }
}

- (void)udpSocket:(GCDAsyncUdpSocket *)sock didNotSendDataWithTag:(long)msgTag dueToError:(NSError *)error
{
//  NSError* err = [self sendFailedError:[error description]];
  NSNumber* tagNum = [NSNumber numberWithLong:msgTag];
  RCTResponseSenderBlock callback = [_pendingSends objectForKey:tagNum];
  if (callback) {
    callback(@[error]);
    [_pendingSends removeObjectForKey:tagNum];
  }
}

- (void) send:(NSData *)data
   remotePort:(u_int16_t)port
remoteAddress:(NSString *)address
     callback:(RCTResponseSenderBlock)callback
{
  [_udpSocket sendData:data toHost:address port:port withTimeout:-1 tag:tag];
  if (callback) {
    [_pendingSends setObject:callback forKey:[NSNumber numberWithLong:tag]];
  }

  tag++;
}

- (NSDictionary* ) address
{
  return @{
    @"address": [_udpSocket localHost],
    @"port": [NSNumber numberWithInt:[_udpSocket localPort]]
  };
}

- (void) close
{
  [_udpSocket close];
}

- (void)udpSocket:(GCDAsyncUdpSocket *)sock didReceiveData:(NSData *)data
                  fromAddress:(NSData *)address
                  withFilterContext:(id)filterContext
{
  if (!_clientDelegate) return;

  NSString *host = nil;
  uint16_t port = 0;
  [GCDAsyncUdpSocket getHost:&host port:&port fromAddress:address];
  [_clientDelegate onData:self data:data host:host port:port];
}

- (NSError *)badParamError:(NSString *)errMsg
{
  NSDictionary *userInfo = [NSDictionary dictionaryWithObject:errMsg forKey:NSLocalizedDescriptionKey];

  return [NSError errorWithDomain:RCTUDPErrorDomain
                             code:RCTUDPBadParamError
                         userInfo:userInfo];
}

- (NSError *)badInvocationError:(NSString *)errMsg
{
  NSDictionary *userInfo = [NSDictionary dictionaryWithObject:errMsg forKey:NSLocalizedDescriptionKey];

  return [NSError errorWithDomain:RCTUDPErrorDomain
                             code:RCTUDPInvalidInvocationError
                         userInfo:userInfo];
}

- (NSError *)sendFailedError:(NSString *)errMsg
{
  NSDictionary *userInfo = [NSDictionary dictionaryWithObject:errMsg forKey:NSLocalizedDescriptionKey];

  return [NSError errorWithDomain:RCTUDPErrorDomain
                             code:RCTUDPSendFailedError
                         userInfo:userInfo];
}

- (dispatch_queue_t)methodQueue
{
//  return dispatch_queue_create("com.facebook.React.UDPSocketsQueue", DISPATCH_QUEUE_SERIAL);
  return dispatch_get_main_queue();
}

@end
