//
//  RCTUDPClient.m
//  react-native-udp
//
//  Created by Mark Vayngrib on 5/9/15.
//  Copyright (c) 2015 Tradle, Inc. All rights reserved.
//

#import <netinet/in.h>
#import <arpa/inet.h>
#import "UdpSocketClient.h"
#import <React/RCTBridgeModule.h>
#import "GCDAsyncUdpSocket.h"

NSString *const RCTUDPErrorDomain = @"RCTUDPErrorDomain";

@interface UdpSocketClient()
{
@private
  uint16_t _port;
  NSString* _address;
  GCDAsyncUdpSocket *_udpSocket;
  NSMutableDictionary<NSNumber *, RCTResponseSenderBlock> *_pendingSends;
  NSLock *_lock;
  long tag;
}

- (id)initWithConfig:(id<SocketClientDelegate>) aDelegate;

@end

@implementation UdpSocketClient

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
    _lock = [[NSLock alloc] init];
  }

  return self;
}

- (void)setPendingSend:(RCTResponseSenderBlock)callback forKey:(NSNumber *)key
{
  [_lock lock];
  @try {
    [_pendingSends setObject:callback forKey:key];
  } @finally {
    [_lock unlock];
  }
}

- (RCTResponseSenderBlock)getPendingSend:(NSNumber *)key
{
  [_lock lock];
  @try {
    return [_pendingSends objectForKey:key];
  } @finally {
    [_lock unlock];
  }
}

- (void)dropPendingSend:(NSNumber *)key
{
  [_lock lock];
  @try {
    [_pendingSends removeObjectForKey:key];
  } @finally {
    [_lock unlock];
  }
}

- (BOOL)bind:(u_int16_t)port address:(NSString *)address options:(NSDictionary *)options error:(NSError **) error
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
  
  [_udpSocket setMaxReceiveIPv4BufferSize:UINT16_MAX];
  [_udpSocket setMaxReceiveIPv6BufferSize:UINT16_MAX];

  BOOL reusePort = options[@"reusePort"] ?: NO;
  [_udpSocket enableReusePort:reusePort error:error];
  
  BOOL result;
  if (address) {
    struct sockaddr_in ip;
    ip.sin_family = AF_INET;
    ip.sin_port = htons(_port);
    inet_pton(AF_INET, [address cStringUsingEncoding:NSASCIIStringEncoding], &ip.sin_addr);

    NSData * hostAndPort = [NSData dataWithBytes:&ip length:sizeof(ip)];
    result = [_udpSocket bindToAddress:hostAndPort error:error];
  }
  else {
    result = [_udpSocket bindToPort:_port error:error];
  }

  return result && [_udpSocket beginReceiving:error];
}

- (BOOL)joinMulticastGroup:(NSString *)address error:(NSError **) error
{
    if(![_udpSocket joinMulticastGroup:address error:&error]){
        NSLog(@"Error joining multicast group: %@", error);
        return false;
    }
    return true;
}

- (BOOL)leaveMulticastGroup:(NSString *)address error:(NSError **) error
{
    if(![_udpSocket leaveMulticastGroup:address error:&error]){
        NSLog(@"Error leaving multicast group: %@", error);
        return false;
    }
    return true;
}

- (void)udpSocket:(GCDAsyncUdpSocket *)sock didSendDataWithTag:(long)msgTag
{
  NSNumber* tagNum = [NSNumber numberWithLong:msgTag];
  RCTResponseSenderBlock callback = [self getPendingSend:tagNum];
  if (callback) {
    callback(@[]);
    [self dropPendingSend:tagNum];
  }
}

- (void)udpSocket:(GCDAsyncUdpSocket *)sock didNotSendDataWithTag:(long)msgTag dueToError:(NSError *)error
{
//  NSError* err = [self sendFailedError:[error description]];
  NSNumber* tagNum = [NSNumber numberWithLong:msgTag];
  RCTResponseSenderBlock callback = [self getPendingSend:tagNum];
  if (callback) {
    NSString *msg = error.localizedFailureReason ?: error.localizedDescription;
    callback(@[msg ?: @"unknown error"]);
    [self dropPendingSend:tagNum];
  }
}

- (void) send:(NSData *)data
   remotePort:(u_int16_t)port
remoteAddress:(NSString *)address
     callback:(RCTResponseSenderBlock)callback
{
  [_udpSocket sendData:data toHost:address port:port withTimeout:-1 tag:tag];
  if (callback) {
    [self setPendingSend:callback forKey:[NSNumber numberWithLong:tag]];
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

- (BOOL) setBroadcast:(BOOL)flag
                error:(NSError **)error
{
  return [_udpSocket enableBroadcast:flag error:error];
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
