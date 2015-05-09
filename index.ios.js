/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 */
'use strict';

var React = require('react-native');
var {
  AppRegistry,
  StyleSheet,
  Text,
  View,
} = React;

function randomPort() {
  return Math.random() * 65536 | 0
}

var dgram = require('RCTUDP')
var a = dgram.createSocket('udp4')
var aPort = randomPort()
a.bind(bPort, function(err) {
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
          Welcome to React Native!
        </Text>
        <Text style={styles.instructions}>
          To get started, edit index.ios.js
        </Text>
        <Text style={styles.instructions}>
          Press Cmd+R to reload,{'\n'}
          Cmd+D or shake for dev menu
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


function toByteArray(obj) {
  if (typeof obj === 'object') {
    var i = 0
    var arr = []
    while (true) {
      if (!(i in obj)) break

      arr.push(+obj[i])
      i++
    }

    return new Uint8Array(arr)
  }
  else if (typeof obj !== 'string') {
    throw new Error('unsupported format')
  }

  var uint = new Uint8Array(obj.length);
  for (var i = 0, l = obj.length; i < l; i++){
    uint[i] = obj.charCodeAt(i);
  }

  return new Uint8Array(uint);
}

AppRegistry.registerComponent('react-native-udp', () => rctsockets);
