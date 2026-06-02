// Learn more: https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// react-native-maps (and react-native-maps-directions, which imports it) pull in
// native-only RN internals like `codegenNativeCommands` that don't exist on web.
// When Metro bundles the web target it crashes on these imports. We don't use
// maps on web, so resolve those modules to an empty stub when platform === 'web'.
const WEB_STUBBED = [
  'react-native-maps',
  'react-native-maps-directions',
  'react-native/Libraries/Utilities/codegenNativeCommands',
];

const defaultResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    platform === 'web' &&
    WEB_STUBBED.some(
      (m) => moduleName === m || moduleName.startsWith(`${m}/`)
    )
  ) {
    return { type: 'empty' };
  }
  // Fall back to Metro's default resolver for everything else.
  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
