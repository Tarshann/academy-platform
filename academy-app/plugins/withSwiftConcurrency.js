/**
 * Expo config plugin to fix Xcode 16 / Swift 6 strict concurrency errors.
 *
 * The error "static property 'center' is not concurrency-safe because
 * non-'Sendable' type 'ContentPosition' may have shared mutable state"
 * comes from SDWebImage (pulled in by expo-image) which hasn't adopted
 * Swift 6 Sendable conformance yet.
 *
 * This plugin does TWO things:
 *   1. Sets SWIFT_STRICT_CONCURRENCY = minimal on the main Xcode project
 *   2. Injects a post_install hook into the Podfile to set the same
 *      setting on ALL CocoaPods targets (where the actual error lives)
 */
const {
  withXcodeProject,
  withDangerousMod,
} = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

function setXcodeProjectConcurrency(config) {
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
}

function setPodsConcurrency(config) {
  return withDangerousMod(config, [
    "ios",
    (config) => {
      const podfilePath = path.join(
        config.modRequest.platformProjectRoot,
        "Podfile"
      );

      if (!fs.existsSync(podfilePath)) {
        return config;
      }

      let podfile = fs.readFileSync(podfilePath, "utf-8");

      const snippet = [
        "",
        "    # [withSwiftConcurrency] Fix Xcode 16 strict concurrency errors in Pods",
        "    installer.pods_project.targets.each do |target|",
        "      target.build_configurations.each do |bc|",
        "        bc.build_settings['SWIFT_STRICT_CONCURRENCY'] = 'minimal'",
        "      end",
        "    end",
      ].join("\n");

      // Inject into existing post_install block
      if (podfile.includes("post_install do |installer|")) {
        podfile = podfile.replace(
          "post_install do |installer|",
          "post_install do |installer|" + snippet
        );
      } else {
        // No existing post_install — add one at the end
        podfile +=
          "\npost_install do |installer|" + snippet + "\nend\n";
      }

      fs.writeFileSync(podfilePath, podfile);
      return config;
    },
  ]);
}

module.exports = function withSwiftConcurrency(config) {
  config = setXcodeProjectConcurrency(config);
  config = setPodsConcurrency(config);
  return config;
};
