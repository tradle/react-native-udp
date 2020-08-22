/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, {Component} from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';

import dgram from 'react-native-udp';

function randomPort() {
  return (Math.random() * 60536) | (0 + 5000); // 60536-65536
}

// only works for 8-bit chars
function toByteArray(obj) {
  var uint = new Uint8Array(obj.length);
  for (var i = 0, l = obj.length; i < l; i++) {
    uint[i] = obj.charCodeAt(i);
  }

  return new Uint8Array(uint);
}

class App extends Component {
  constructor(props) {
    super(props);

    this.updateChatter = this.updateChatter.bind(this);
    this.state = {chatter: []};
  }

  updateChatter(msg) {
    this.setState({
      chatter: this.state.chatter.concat([msg]),
    });
  }

  componentDidMount() {
    let self = this;

    let a = dgram.createSocket('udp4');
    let aPort = randomPort();
    a.bind(aPort, function(err) {
      if (err) throw err;
      self.updateChatter('a bound to ' + JSON.stringify(a.address()));
    });

    let b = dgram.createSocket('udp4');
    var bPort = randomPort();
    b.bind(bPort, function(err) {
      if (err) throw err;
      self.updateChatter('b bound to ' + JSON.stringify(b.address()));
    });

    a.on('message', function(data, rinfo) {
      var str = String.fromCharCode.apply(null, new Uint8Array(data));
      self.updateChatter(
        'a received echo ' + str + ' ' + JSON.stringify(rinfo),
      );
      a.close();
      b.close();
    });

    b.on('message', function(data, rinfo) {
      var str = String.fromCharCode.apply(null, new Uint8Array(data));
      self.updateChatter('b received ' + str + ' ' + JSON.stringify(rinfo));

      // echo back
      b.send(data, 0, data.length, aPort, '127.0.0.1', function(err) {
        if (err) throw err;
        self.updateChatter('b echoed data');
      });
    });

    b.once('listening', function() {
      var msg = toByteArray('hello');
      a.send(msg, 0, msg.length, bPort, '127.0.0.1', function(err) {
        if (err) throw err;
        self.updateChatter('a sent data');
      });
    });
  }

  render() {
    return (
      <View style={styles.container}>
        <ScrollView>
          {this.state.chatter.map((msg, index) => {
            return (
              <Text key={index} style={styles.welcome}>
                {msg}
              </Text>
            );
          })}
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
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

export default App;
