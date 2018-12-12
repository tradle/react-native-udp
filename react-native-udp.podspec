require 'json'

package = JSON.parse(File.read(File.join(__dir__, './package.json')))

Pod::Spec.new do |s|
  s.name                = package['name']
  s.version             = package['version']
  s.summary             = package['description']
  s.description         = <<-DESC
                           package['description']
                             DESC
  s.homepage            = package['homepage']
  s.license             = package['license']
  s.author              = {package['author']['name']=>package['author']['email']}
  s.source              = { :git => package["repository"]["url"].gsub(/(http.*)/).first, :tag => "v#{s.version}" }
  s.platform            = :ios, "7.0"
  s.source_files        = "ios", "ios/**/*.{h,m}"
  s.exclude_files       = "Classes/Exclude"
  s.dependency 'React'

end
