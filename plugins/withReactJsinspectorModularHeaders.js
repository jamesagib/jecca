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
      const marker = "set_use_modular_headers_for_pod('React-jsinspector')";

      if (!contents.includes(marker)) {
        const snippet = `\npre_install do |installer|\n  installer.${marker}\nend\n`;
        contents += snippet;
        fs.writeFileSync(podfilePath, contents);
      }
      return config;
    },
  ]);
}; 