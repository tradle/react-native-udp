'use strict';

var React = require('react-native');
var {
  AppRegistry,
  StyleSheet,
  Text,
  View,
} = React;

// require('./test/simple/test-dgram-address')
// require('./test/simple/test-dgram-bind-default-address')
// require('./test/simple/test-dgram-bind-shared-ports')

function randomPort() {
  return Math.random() * 60536 | 0 + 5000 // 60536-65536
}

var base64 = require('base64-js')
var dgram = require('dgram')
var a = dgram.createSocket('udp4')
var aPort = randomPort()
a.bind(aPort, function(err) {
  if (err) throw err

  console.log('address', a.address())
})

var b = dgram.createSocket('udp4')
var bPort = randomPort()
b.bind(bPort, function(err) {
  if (err) throw err

  console.log('address', b.address())
})

a.on('message', function(data, rinfo) {
  var str = String.fromCharCode.apply(null, new Uint8Array(data));
  console.log('a received', str, rinfo)
  a.close()
  b.close()
})

b.on('message', function(data, rinfo) {
  var str = String.fromCharCode.apply(null, new Uint8Array(data));
  console.log('b received', str, rinfo)

  // echo back
  b.send(data, 0, data.length, aPort, '127.0.0.1', function(err) {
    if (err) throw err

    console.log('sent')
  })
})

b.once('listening', function() {
  var msg = toByteArray('hello')
  a.send(msg, 0, msg.length, bPort, '127.0.0.1', function(err) {
    if (err) throw err

    console.log('sent')
  })
})

var rctsockets = React.createClass({
  render: function() {
    return (
      <View style={styles.container}>
        <Text style={styles.welcome}>
          Open Dev Tools to see socket chatter
        </Text>
      </View>
    );
  }
});

var styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});

// only works for 8-bit chars
function toByteArray(obj) {
  var uint = new Uint8Array(obj.length);
  for (var i = 0, l = obj.length; i < l; i++){
    uint[i] = obj.charCodeAt(i);
  }

  return new Uint8Array(uint);
}

AppRegistry.registerComponent('react-native-udp', () => rctsockets);
