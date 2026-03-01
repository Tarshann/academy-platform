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
 *   2. Injects code into the Podfile's post_install hook — AFTER
 *      react_native_post_install() so our settings can't be overridden —
 *      to apply concurrency fixes on ALL CocoaPods targets.
 *
 * The Podfile injection uses THREE complementary strategies:
 *   a. SWIFT_STRICT_CONCURRENCY = minimal  (Xcode build setting)
 *   b. OTHER_SWIFT_FLAGS += -Xfrontend -strict-concurrency=minimal
 *      (direct Swift compiler flag — bypasses Xcode setting precedence)
 *   c. SWIFT_TREAT_WARNINGS_AS_ERRORS = NO  (safety net)
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
        buildConfig.buildSettings.SWIFT_TREAT_WARNINGS_AS_ERRORS = "NO";
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

      // Idempotency — skip if already injected
      if (podfile.includes("withSwiftConcurrency")) {
        return config;
      }

      const snippet = [
        "",
        "    # [withSwiftConcurrency] Fix Xcode 16 / Swift 6 strict concurrency errors in Pods",
        "    installer.pods_project.targets.each do |target|",
        "      target.build_configurations.each do |bc|",
        "        bc.build_settings['SWIFT_STRICT_CONCURRENCY'] = 'minimal'",
        "        bc.build_settings['SWIFT_TREAT_WARNINGS_AS_ERRORS'] = 'NO'",
        "        bc.build_settings['GCC_TREAT_WARNINGS_AS_ERRORS'] = 'NO'",
        "        current_flags = bc.build_settings['OTHER_SWIFT_FLAGS'] || '$(inherited)'",
        "        unless current_flags.include?('-strict-concurrency')",
        "          bc.build_settings['OTHER_SWIFT_FLAGS'] = \"#{current_flags} -Xfrontend -strict-concurrency=minimal\"",
        "        end",
        "      end",
        "    end",
      ].join("\n");

      // ──────────────────────────────────────────────────────────────────
      // INJECTION STRATEGY
      //
      // The Expo-generated Podfile looks like:
      //
      //   post_install do |installer|
      //     react_native_post_install(
      //       installer,
      //       config[:reactNativePath],
      //       :mac_catalyst_enabled => false,
      //       :ccache_enabled => ccache_enabled?(podfile_properties),
      //     )
      //   end
      //
      // Previous attempts injected BEFORE react_native_post_install(),
      // which allowed RN's post-install processing to override our
      // SWIFT_STRICT_CONCURRENCY setting.
      //
      // Now we find the closing ) of react_native_post_install(...) and
      // inject AFTER it, ensuring our settings are applied LAST.
      // ──────────────────────────────────────────────────────────────────

      const rnpiIndex = podfile.indexOf("react_native_post_install");

      if (rnpiIndex !== -1) {
        // Find the opening ( of react_native_post_install(...)
        const openParen = podfile.indexOf("(", rnpiIndex);
        if (openParen !== -1) {
          // Track parenthesis depth to locate matching )
          let depth = 0;
          let closeParen = -1;
          for (let i = openParen; i < podfile.length; i++) {
            if (podfile[i] === "(") depth++;
            if (podfile[i] === ")") {
              depth--;
              if (depth === 0) {
                closeParen = i;
                break;
              }
            }
          }

          if (closeParen !== -1) {
            // Find end-of-line after the closing )
            let eol = podfile.indexOf("\n", closeParen);
            if (eol === -1) eol = podfile.length;

            // Inject our snippet AFTER react_native_post_install(...)
            podfile =
              podfile.slice(0, eol) +
              "\n" +
              snippet +
              podfile.slice(eol);

            fs.writeFileSync(podfilePath, podfile);
            return config;
          }
        }
      }

      // ── Fallback paths (when react_native_post_install is not found) ──

      if (podfile.includes("post_install do |installer|")) {
        podfile = podfile.replace(
          "post_install do |installer|",
          "post_install do |installer|\n" + snippet
        );
      } else {
        podfile +=
          "\npost_install do |installer|\n" + snippet + "\nend\n";
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
