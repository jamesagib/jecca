#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Applying React Runtime fixes for EAS build...');

const podfilePath = path.join(__dirname, '..', 'ios', 'Podfile');

if (!fs.existsSync(podfilePath)) {
  console.log('❌ Podfile not found, skipping React Runtime fixes');
  process.exit(0);
}

let podfileContent = fs.readFileSync(podfilePath, 'utf8');

// Add React-RCTRuntime to the exclusion list
podfileContent = podfileContent.replace(
  /if target\.name == 'React-RuntimeHermes' \|\| target\.name == 'React-RuntimeCore'/g,
  "if target.name == 'React-RuntimeHermes' || target.name == 'React-RuntimeCore' || target.name == 'React-RuntimeApple' || target.name == 'React-RCTRuntime'"
);

// Add additional fixes for all React Runtime related targets
const additionalFixes = `
    # Additional fixes for React Native 0.79.x module conflicts
    installer.pods_project.targets.each do |target|
      if target.name.include?('React-Runtime') || target.name.include?('React-RCTRuntime')
        target.build_configurations.each do |config|
          # Disable module redefinition warnings
          config.build_settings['CLANG_WARN_DUPLICATE_METHOD_MATCH'] = 'NO'
          config.build_settings['CLANG_WARN_OBJC_IMPLICIT_RETAIN_SELF'] = 'NO'
          config.build_settings['CLANG_WARN_QUOTED_INCLUDE_IN_FRAMEWORK_HEADER'] = 'NO'
          
          # Fix for React Runtime conflicts
          config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] ||= ['$(inherited)']
          config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] << 'DISABLE_REACT_RUNTIME=1'
          config.build_settings['OTHER_CFLAGS'] = '$(inherited) -DDISABLE_REACT_RUNTIME=1'
          
          # Additional compiler flags to prevent module conflicts
          config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
          config.build_settings['DEFINES_MODULE'] = 'NO'
          
          # Specific fixes for React-RCTRuntime
          if target.name == 'React-RCTRuntime'
            config.build_settings['CLANG_WARN_DUPLICATE_METHOD_MATCH'] = 'NO'
            config.build_settings['CLANG_WARN_OBJC_IMPLICIT_RETAIN_SELF'] = 'NO'
            config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] << 'RCT_NEW_ARCH_ENABLED=0'
            config.build_settings['OTHER_CFLAGS'] = '$(inherited) -DRCT_NEW_ARCH_ENABLED=0'
          end
        end
      end
    end`;

// Insert the additional fixes before the end of post_install block
if (podfileContent.includes('post_install do |installer|')) {
  const postInstallEnd = podfileContent.lastIndexOf('end');
  if (postInstallEnd !== -1) {
    podfileContent = podfileContent.slice(0, postInstallEnd) + additionalFixes + '\n  ' + podfileContent.slice(postInstallEnd);
  }
}

fs.writeFileSync(podfilePath, podfileContent);

// Also create a script to fix module map conflicts
const moduleMapFixScript = `#!/bin/bash
# Fix module map conflicts
echo "🔧 Fixing module map conflicts..."

# Remove problematic module maps
find ios/Pods -name "*.modulemap" -path "*/ReactCommon/*" -delete 2>/dev/null || true
find ios/Pods -name "*.modulemap" -path "*/react_runtime/*" -delete 2>/dev/null || true

# Create empty module maps to prevent conflicts
mkdir -p ios/Pods/Headers/Public/ReactCommon
mkdir -p ios/Pods/Headers/Public/react_runtime

echo "module ReactCommon {}" > ios/Pods/Headers/Public/ReactCommon/ReactCommon.modulemap
echo "module react_runtime {}" > ios/Pods/Headers/Public/react_runtime/React-jsitooling.modulemap

echo "✅ Module map conflicts fixed"
`;

const scriptPath = path.join(__dirname, 'fix-module-maps.sh');
fs.writeFileSync(scriptPath, moduleMapFixScript);
fs.chmodSync(scriptPath, '755');

console.log('✅ React Runtime fixes applied to Podfile');
console.log('✅ Module map fix script created');
console.log('📝 Applied fixes:');
console.log('   - Added React-RCTRuntime to exclusion list');
console.log('   - Added comprehensive module conflict prevention');
console.log('   - Disabled problematic compiler warnings');
console.log('   - Added preprocessor definitions to disable React Runtime conflicts');
console.log('   - Created module map conflict resolution script'); 