Pod::Spec.new do |s|
  s.name = 'RemoteDiscovery'
  s.version = '1.0.0'
  s.summary = 'Identity-filtered desktop location discovery'
  s.description = 'System Bonjour discovery for paired The Boss desktop apps.'
  s.author = 'Cherry Studio'
  s.homepage = 'https://github.com/Prometheus-AGS/the-boss-mobile'
  s.platforms = { :ios => '17.0' }
  s.source = { git: '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.frameworks = 'Network'
  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES' }
  s.source_files = '**/*.swift'
end
