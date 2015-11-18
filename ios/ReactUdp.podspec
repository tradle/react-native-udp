Pod::Spec.new do |s|
  s.name                = 'ReactUdp'
  s.version             = '1.1.1'
  s.summary             = 'node\'s dgram API in React Native.'
  s.description         = <<-DESC
                            Enables accessing udp sockets in React Native.
                         DESC
  s.homepage            = 'https://github.com/tradle/react-native-udp'
  s.license             = { :type => 'MIT' }
  s.authors             = { 'Mark Vayngrib' => 'mark.vayngrib@lablz.com' }
  s.source              = { :git => 'https://github.com/tradle/react-native-udp.git' }
  s.default_subspec     = 'Core'
  s.requires_arc        = true
  s.platform            = :ios, '7.0'
  s.prepare_command     = 'npm install --production'
  s.preserve_paths      = 'node_modules', '**/*.js', 'package.json'
  s.header_mappings_dir = '.'
  s.dependency 'React'

  s.subspec 'Core' do |ss|
    ss.source_files     = '*.{c,h,m}', 'CocoaAsyncSocket/*.{h,m}'
    ss.preserve_paths   = '*.js'
  end
end
