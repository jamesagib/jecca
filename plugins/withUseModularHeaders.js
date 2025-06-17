const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withUseModularHeaders = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const podfilePath = path.join(projectRoot, 'ios', 'Podfile');
      let podfileContent = fs.readFileSync(podfilePath, 'utf8');
      
      const search = /use_react_native!\(([\s\S]*?)\)/;
      const match = podfileContent.match(search);

      if (match) {
        let options = match[1];
        if (!options.includes(':modular_headers')) {
          let newOptions = options.trim();
          if (newOptions === '') {
            newOptions = ':modular_headers => true';
          } else if (newOptions.endsWith(',')) {
            newOptions = `${newOptions}\n  :modular_headers => true`;
          } else {
            newOptions = `${newOptions},\n  :modular_headers => true`;
          }
          const replacement = `use_react_native!(\n  ${newOptions}\n)`;
          podfileContent = podfileContent.replace(search, replacement);
        }
      }

      fs.writeFileSync(podfilePath, podfileContent);
      
      return config;
    },
  ]);
};

module.exports = withUseModularHeaders; 