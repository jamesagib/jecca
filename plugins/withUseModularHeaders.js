const { withDangerousMod, AndroidConfig } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

function getAppName(projectRoot) {
  try {
    const { exp } = require(path.join(projectRoot, 'app.json'));
    return exp.name;
  } catch (e) {
    return 'jecca'; // fallback name
  }
}

const withUseModularHeaders = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const podfilePath = path.join(projectRoot, 'ios', 'Podfile');
      const appName = getAppName(projectRoot);
      let podfileContent = fs.readFileSync(podfilePath, 'utf8');
      
      const targetRegex = new RegExp(`(target\\s+'${appName}'\\s+do)`);
      const modularHeadersLine = `  use_modular_headers!`;

      if (!podfileContent.includes(modularHeadersLine)) {
        podfileContent = podfileContent.replace(
          targetRegex,
          `$1\n${modularHeadersLine}`
        );
        fs.writeFileSync(podfilePath, podfileContent);
      }
      
      return config;
    },
  ]);
};

module.exports = withUseModularHeaders; 