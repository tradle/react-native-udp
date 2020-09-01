## [4.0.1](https://github.com/tradle/react-native-udp/compare/v4.0.0...v4.0.1) (2020-09-01)


### Bug Fixes

* Add missing attribute "homepage" to package.json ([#135](https://github.com/tradle/react-native-udp/issues/135)) ([74d75c1](https://github.com/tradle/react-native-udp/commit/74d75c139dbca0049b5c201d5d3144a5c22c09f6))

# [4.0.0](https://github.com/tradle/react-native-udp/compare/v3.2.0...v4.0.0) (2020-08-30)


### Features

* Match NodeJS dgram API ([#133](https://github.com/tradle/react-native-udp/issues/133)) ([2f8dc35](https://github.com/tradle/react-native-udp/commit/2f8dc35d18a7875616bd18d4e6dd5f1d74b6230a)), closes [#132](https://github.com/tradle/react-native-udp/issues/132) [#128](https://github.com/tradle/react-native-udp/issues/128)


### BREAKING CHANGES

* All methods no longer check parameter types. socket.send() now throws 'ERR_SOCKET_BAD_PORT' when sending on unbound sockets. socket.send() no longer checks if ddress is a valid IP or hostname.

# [3.2.0](https://github.com/tradle/react-native-udp/compare/v3.1.0...v3.2.0) (2020-08-15)


### Bug Fixes

* **Android:** createSocket is now a blocking method ([#108](https://github.com/tradle/react-native-udp/issues/108)) ([6796a7f](https://github.com/tradle/react-native-udp/commit/6796a7f12762850262e111a40f84b841ed67c401))


### Features

* Add Typescript types and the option to enable debugging ([#114](https://github.com/tradle/react-native-udp/issues/114)) ([11e6e49](https://github.com/tradle/react-native-udp/commit/11e6e49a417b2a54227977691cd3c5b84a5d5d36))


### Performance Improvements

* Dependency reduction & JS update ([#105](https://github.com/tradle/react-native-udp/issues/105)) ([aac2bfa](https://github.com/tradle/react-native-udp/commit/aac2bfa30591864b18fe8e4190f141f97798e058))
