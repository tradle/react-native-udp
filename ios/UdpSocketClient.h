//
//  RCTUDPClient.h
//  react-native-udp
//
//  Created by Mark Vayngrib on 5/9/15.
//  Copyright (c) 2015 Tradle, Inc. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>

extern NSString *const RCTUDPErrorDomain;

enum RCTUDPError
{
  RCTUDPNoError = 0,           // Never used
  RCTUDPInvalidInvocationError,// Invalid method invocation
  RCTUDPBadConfigError,        // Invalid configuration
  RCTUDPBadParamError,         // Invalid parameter was passed
  RCTUDPSendTimeoutError,      // A send operation timed out
  RCTUDPSendFailedError,       // A send operation failed
  RCTUDPClosedError,           // The socket was closed
  RCTUDPOtherError,            // Description provided in userInfo
};

typedef enum RCTUDPError RCTUDPError;

@class UdpSocketClient;

@protocol SocketClientDelegate <NSObject>

- (void)onData:(UdpSocketClient*) client data:(NSData *)data host:(NSString*) host port:(uint16_t) port;

@end

@interface UdpSocketClient : NSObject

@property (nonatomic, retain) NSString* id;
@property (nonatomic, retain) NSString* host;
@property (nonatomic) u_int16_t port;
@property (nonatomic, weak) id<SocketClientDelegate> clientDelegate;

///---------------------------------------------------------------------------------------
/// @name Class Methods
///---------------------------------------------------------------------------------------
/**
 * Initializes a new RCTUDPClient
 *
 * @param delegate The object holding the callbacks, usually 'self'.
 *
 * @return New RCTUDPClient
 */

+ (id)socketClientWithConfig:(id<SocketClientDelegate>) delegate;

///---------------------------------------------------------------------------------------
/// @name Instance Methods
///---------------------------------------------------------------------------------------
/**
 * Binds to a host and port
 *
 * @param port
 * @param host ip address
 * @param options (such as 'reusePort')
 * @return true if bound, false if there was an error
 */
- (BOOL)bind:(u_int16_t) port address:(NSString*)address options:(NSDictionary *)options error:(NSError**)error;

/**
 * Join multicast groupt
 *
 * @param address
 * @return true if joined, false if there was an error
 */
- (BOOL)joinMulticastGroup:(NSString *)address error:(NSError **) error;

/**
 * leave multicast groupt
 *
 * @param address
 * @return true if joined, false if there was an error
 */
- (BOOL)leaveMulticastGroup:(NSString *)address error:(NSError **) error;

/**
 * send data to another host and port
 *
 * @param port
 * @param host ip address
 */
- (void)send:(NSData*) data remotePort:(u_int16_t) port remoteAddress:(NSString*) address callback:(RCTResponseSenderBlock) callback;

/**
 * @return { address: ip, port: port }
 */
- (NSDictionary *)address;

/**
 * close client
 */
- (void)close;

/**
 * Enable broadcast
 */
- (BOOL)setBroadcast:(BOOL) flag error:(NSError **) error;

@end
