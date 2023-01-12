require 'json'
package_json = JSON.parse(File.read('package.json'))

Pod::Spec.new do |s|

  s.name           = package_json["name"]
  s.version        = package_json["version"]
  s.summary        = package_json["description"]
  s.homepage       = package_json["homepage"]
  s.license        = package_json["license"]
  s.author         = { package_json["author"] => package_json["author"] }
  s.platform       = :ios, "7.0"
  s.source         = { :git => package_json["repository"]["url"], :tag => "v#{s.version}" }
  s.source_files   = 'ios/**/*.{h,m}'
  s.dependency 'React-Core'
  s.dependency 'CocoaAsyncSocket'

  if ENV['RCT_NEW_ARCH_ENABLED'] == '1' then
    s.dependency "ReactCommon/turbomodule/core"

    use_react_native_codegen!(s, {
      :library_name => "UdpSocketsSpec",
      :js_srcs_dir => "./src",
      :library_type => "modules",
    })
  end
end
