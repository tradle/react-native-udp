## [4.1.7](https://github.com/tradle/react-native-udp/compare/v4.1.6...v4.1.7) (2023-01-26)


### Bug Fixes

* **Android:** Remove incorrect Override signature ([#241](https://github.com/tradle/react-native-udp/issues/241)) ([2578857](https://github.com/tradle/react-native-udp/commit/25788578e59a1704ea65f9d00bc6c41faaae3f3d))

## [4.1.6](https://github.com/tradle/react-native-udp/compare/v4.1.5...v4.1.6) (2022-12-05)


### Bug Fixes

* **Android:** Update Android code ([#220](https://github.com/tradle/react-native-udp/issues/220)) ([e5cb016](https://github.com/tradle/react-native-udp/commit/e5cb016e55133a2683b695b4dfed68cb72252948))

## [4.1.5](https://github.com/tradle/react-native-udp/compare/v4.1.4...v4.1.5) (2022-03-22)


### Bug Fixes

* Fix Gradle configuration ([#205](https://github.com/tradle/react-native-udp/issues/205)) ([c5c7831](https://github.com/tradle/react-native-udp/commit/c5c783188563e9eb04370001e702993b650d6c13))
* **Android:** Catch all exceptions and redirect them to JS ([#202](https://github.com/tradle/react-native-udp/issues/202)) ([0a512ee](https://github.com/tradle/react-native-udp/commit/0a512ee84f7370af1842907c08d79ace29fc2019))

## [4.1.4](https://github.com/tradle/react-native-udp/compare/v4.1.3...v4.1.4) (2022-02-22)


### Bug Fixes

* Remove AsyncTask in the send function (it's deprecated) ([#197](https://github.com/tradle/react-native-udp/issues/197)) ([179a948](https://github.com/tradle/react-native-udp/commit/179a9480004ce15c83fbcaa4ec3d9cd9fa9f950a))

## [4.1.3](https://github.com/tradle/react-native-udp/compare/v4.1.2...v4.1.3) (2021-09-08)


### Bug Fixes

* Fix podspec to be compliant with latest Cocoapods ([#191](https://github.com/tradle/react-native-udp/issues/191)) ([006361b](https://github.com/tradle/react-native-udp/commit/006361b95b1e6c836225cdb95fe733f41bdf2afb))

## [4.1.2](https://github.com/tradle/react-native-udp/compare/v4.1.1...v4.1.2) (2021-01-19)


### Bug Fixes

* **Android:** Fix null MulticastSocket creation ([#148](https://github.com/tradle/react-native-udp/issues/148)) ([3d52791](https://github.com/tradle/react-native-udp/commit/3d527916a24e3837c2eca194f2474af22a737cef))

## [4.1.1](https://github.com/tradle/react-native-udp/compare/v4.1.0...v4.1.1) (2020-12-24)


### Bug Fixes

* Fix TypeScript declaration inheritance ([#153](https://github.com/tradle/react-native-udp/issues/153)) ([3e5b4f7](https://github.com/tradle/react-native-udp/commit/3e5b4f71d021f19d7720b7ccf05a343f93591d15))

# [4.1.0](https://github.com/tradle/react-native-udp/compare/v4.0.4...v4.1.0) (2020-12-05)


### Features

* Add rx timestamp to rinfo payload ([#146](https://github.com/tradle/react-native-udp/issues/146)) ([c468a39](https://github.com/tradle/react-native-udp/commit/c468a3942b7637302b33cf9946f2e89818ea70fb))

## [4.0.4](https://github.com/tradle/react-native-udp/compare/v4.0.3...v4.0.4) (2020-11-28)


### Bug Fixes

* **Android:** Switch to Java Standard concurrent API ([#145](https://github.com/tradle/react-native-udp/issues/145)) ([373edf0](https://github.com/tradle/react-native-udp/commit/373edf03bd274fa8d00609211177bee813978dd1))

## [4.0.3](https://github.com/tradle/react-native-udp/compare/v4.0.2...v4.0.3) (2020-10-01)


### Bug Fixes

* Fix Xcode 12 compatibility ([#138](https://github.com/tradle/react-native-udp/issues/138)) ([750960b](https://github.com/tradle/react-native-udp/commit/750960b8dd7768bd20ea709292e9a4656c9206f4)), closes [facebook/react-native#29633](https://github.com/facebook/react-native/issues/29633)

## [4.0.2](https://github.com/tradle/react-native-udp/compare/v4.0.1...v4.0.2) (2020-09-06)


### Bug Fixes

* Add backwards compatiblity with CommonJS require() ([#137](https://github.com/tradle/react-native-udp/issues/137)) ([af36905](https://github.com/tradle/react-native-udp/commit/af36905bd92dbf78194f2d2d38aa531e9e2b4553))

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
