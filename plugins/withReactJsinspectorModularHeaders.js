const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

// Ensures the Podfile contains a `pre_install` block that converts the
// React-jsinspector pod to modular headers only (required by ExpoModulesCore
// when building as static libraries).
module.exports = function withReactJsinspectorModularHeaders(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const podfilePath = path.join(projectRoot, 'ios', 'Podfile');
      if (!fs.existsSync(podfilePath)) return config;

      let contents = fs.readFileSync(podfilePath, 'utf8');

      // CocoaPods ≥1.16 removed `set_use_modular_headers_for_pod`, so instead
      // we safely add the global `use_modular_headers!` directive, just once.
      const directive = 'use_modular_headers!';

      if (!contents.includes(directive)) {
        // Insert `use_modular_headers!` right before the first `target` or at
        // the end of the file if a target is not found (unlikely).
        const targetMatch = contents.match(/^[ \t]*target\s+'[\w-]+'/m);
        if (targetMatch) {
          const index = targetMatch.index;
          contents = `${contents.slice(0, index)}${directive}\n\n${contents.slice(index)}`;
        } else {
          contents += `\n${directive}\n`;
        }

        fs.writeFileSync(podfilePath, contents);
      }
      return config;
    },
  ]);
}; 