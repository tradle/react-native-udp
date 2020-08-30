# react-native-udp

React Native UDP socket API for Android & iOS. It allows you to create UDP sockets, imitating Node's [dgram](https://nodejs.org/api/dgram.html) API functionalities (check each method documentation for more information).

_This module is used by [Tradle](https://github.com/tradle)._

## Table of Contents

- [Getting started](#getting-started)
- [Compatibility](#react-native-compatibility)
- [Usage](#usage)
- [Maintainers](#maintainers)
- [License](#license)

## Getting started

Install the library using either Yarn:

```
yarn add react-native-udp
```

or npm:

```
npm install --save react-native-udp
```

#### Using React Native >= 0.60

Linking the package manually is not required anymore with [Autolinking](https://github.com/react-native-community/cli/blob/master/docs/autolinking.md).

- **iOS Platform:**

  `$ cd ios && pod install && cd ..` # CocoaPods on iOS needs this extra step

#### Using React Native < 0.60

You then need to link the native parts of the library for the platforms you are using. The easiest way to link the library is using the CLI tool by running this command from the root of your project:

`$ react-native link react-native-udp`

If you can't or don't want to use the CLI tool, you can also manually link the library using the instructions below (click on the arrow to show them):

<details>
<summary>Manually link the library on iOS</summary>

1. In XCode, in the project navigator, right click `Libraries` ➜ `Add Files to [your project's name]`
2. Go to `node_modules` ➜ `react-native-udp` and add `UdpSockets.xcodeproj`
3. In XCode, in the project navigator, select your project. Add `libUdpSockets.a` to your project's `Build Phases` ➜ `Link Binary With Libraries`
4. Run your project (`Cmd+R`)<
   </details>

<details>
<summary>Manually link the library on Android</summary>

1. Open up `android/app/src/main/java/[...]/MainApplication.java`

- Add `import com.tradle.react.UdpSocketsModule;` to the imports at the top of the file
- Add `new UdpSocketsModule()` to the list returned by the `getPackages()` method

2. Append the following lines to `android/settings.gradle`:
   ```
   include ':react-native-udp'
   project(':react-native-udp').projectDir = new File(rootProject.projectDir, 	'../node_modules/react-native-udp/android')
   ```
3. Insert the following lines inside the dependencies block in `android/app/build.gradle`:
   `compile project(':react-native-udp')`
   </details>

## React Native Compatibility

| React Native Version | Use Version |
| -------------------- | ----------- |
| <=0.59.10            | <=2.7.0     |
| >=0.60.0             | >=3.0.0     |

## Usage

_see/run [index.js](examples/udpsockets) for a complete example, but the interface is like dgram's_

```js
import dgram from 'react-native-udp'

const socket = dgram.createSocket('udp4')
socket.bind(12345)
socket.once('listening', function() {
  socket.send('Hello World!', undefined, undefined, remotePort, remoteHost, function(err) {
    if (err) throw err

    console.log('Message sent!')
  })
})

socket.on('message', function(msg, rinfo) {
  console.log('Message received', msg)
})
```

### Debugging

To log all info emitted from the socket, add `debug` option when creating the socket:

```js
const socket = dgram.createSocket({
  type: 'udp4',
  debug: true,
})
```

## Maintainers

- [Rapsssito](https://github.com/rapsssito) [[Support me :heart:](https://github.com/sponsors/Rapsssito)]
- [Mark Vayngrib](https://github.com/mvayngrib)

## License

The library is released under the MIT license. For more information see [`LICENSE`](/LICENSE).
