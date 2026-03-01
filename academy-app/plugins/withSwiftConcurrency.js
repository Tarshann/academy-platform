/**
 * Expo config plugin to set SWIFT_STRICT_CONCURRENCY = minimal.
 *
 * Xcode 16 / Swift 6 enables strict concurrency checking by default,
 * which causes build failures in dependencies that haven't adopted
 * Sendable yet (e.g. expo-image's SDWebImage).
 *
 * This sets the project-wide build setting to "minimal" so those
 * warnings are not promoted to errors.
 */
const { withXcodeProject } = require("expo/config-plugins");

module.exports = function withSwiftConcurrency(config) {
  return withXcodeProject(config, (config) => {
    const project = config.modResults;
    const buildConfigurations = project.pbxXCBuildConfigurationSection();

    for (const key in buildConfigurations) {
      const buildConfig = buildConfigurations[key];
      if (typeof buildConfig === "object" && buildConfig.buildSettings) {
        buildConfig.buildSettings.SWIFT_STRICT_CONCURRENCY = "minimal";
      }
    }

    return config;
  });
};
