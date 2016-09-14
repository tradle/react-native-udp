# UDP in React Native

node's [dgram](https://nodejs.org/api/dgram.html) API in React Native

This module is used by [Tradle](https://github.com/tradle)

## Install

* Create a new react-native project. [Check react-native getting started](http://facebook.github.io/react-native/docs/getting-started.html#content)

* In your project dir:
```
npm install --save react-native-udp
```

## Link in the native dependency

```
react-native link react-native-udp
# OR, if you're using react-native older than 0.31:
rnpm link react-native-udp
```

### `Android`

* Register and load the Native Module in your Main application
([import](examples/rctsockets/android/app/src/main/java/com/rctsockets/MainApplication.java#L11), [getPackages](examples/rctsockets/android/app/src/main/java/com/rctsockets/MainApplication.java#L28))
  * __Note:__ prior to react-native 0.29.2, this should happen in your Main Activity

```java
...

import com.tradle.react.UdpSocketsModule;			// <--- import //

public class MainApplication extends Application implements ReactApplication {
	...
	@Override
	protected List<ReactPackage> getPackages() {
		return Arrays.<ReactPackage>asList(
			new MainReactPackage(),
			new UdpSocketsModule()				// <- add here //
		);
	}
}
```

Buckle up, Dorothy

## Usage

### package.json

_only if you want to write require('dgram') in your javascript_

```json
{
  "browser": {
    "dgram": "react-native-udp"
  }
}
```

### JS

_see/run [index.js](examples/rctsockets) for a complete example, but basically it's just like dgram_

```js
var dgram = require('dgram')
// OR, if not shimming via package.json "browser" field:
// var dgram = require('react-native-udp')
var socket = dgram.createSocket('udp4')
socket.bind(12345)
socket.once('listening', function() {
  var buf = toByteArray('excellent!')
  socket.send(buf, 0, buf.length, remotePort, remoteHost, function(err) {
    if (err) throw err

    console.log('message was sent')
  })
})

socket.on('message', function(msg, rinfo) {
  console.log('message was received', msg)
})
```

### Note

If you want to send and receive node Buffer objects, you'll have to "npm install buffer" and set it as a global for UdpSockets to pick it up:

```js
global.Buffer = global.Buffer || require('buffer').Buffer
```

### TODO

add select tests from node's tests for dgram

## Contributors

[Mark Vayngrib](https://github.com/mvayngrib)  
[Ellen Katsnelson](https://github.com/pgmemk)  
[Tradle, Inc.](https://github.com/tradle/about/wiki)

[Andy Prock](https://github.com/aprock)  

PR's welcome!
