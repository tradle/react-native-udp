# UDP in React Native

node's [dgram](https://nodejs.org/api/dgram.html) API in React Native

This module is used by [Tradle](https://github.com/tradle)

## Install

* Create a new react-native project. [Check react-native getting started](http://facebook.github.io/react-native/docs/getting-started.html#content)

* In your project dir:
```
npm install --save react-native-udp
```

### `iOS`

* Drag UdpSockets.xcodeproj from node_modules/react-native-udp/ios into your XCode project.

* Click on the project in XCode, go to Build Phases, then Link Binary With Libraries and add `libUdpSockets.a`

### `Android`

* `android/settings.gradle`

```gradle
...
include ':react-native-udp'
project(':react-native-udp').projectDir = new File(settingsDir, '../node_modules/react-native-udp/android')
```
* `android/app/build.gradle`

```gradle
dependencies {
	...
	compile project(':react-native-udp')
}
```

* register module (in MainActivity.java)

```java
...

import com.tradle.react.*; // <--- import

public class MainActivity extends Activity implements DefaultHardwareBackBtnHandler {
	...

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        mReactRootView = new ReactRootView(this);

        mReactInstanceManager = ReactInstanceManager.builder()
                .setApplication(getApplication())
                .setBundleAssetName("index.android.bundle")
                .setJSMainModuleName("index.android")
                .addPackage(new MainReactPackage())
                .addPackage(new UdpSocketsModule())           // <- add here
                .setUseDeveloperSupport(BuildConfig.DEBUG)
                .setInitialLifecycleState(LifecycleState.RESUMED)
                .build();

        mReactRootView.startReactApplication(mReactInstanceManager, "YourProject", null);

        setContentView(mReactRootView);
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
// var dgram = require('UdpSockets')
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
