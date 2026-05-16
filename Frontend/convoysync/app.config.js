import 'dotenv/config';

export default ({ config }) => {
  const iosMapsApiKey = process.env.IOS_MAPS_API_KEY || process.env.MAPS_API_KEY;
  const androidMapsApiKey =
    process.env.ANDROID_MAPS_API_KEY || process.env.MAPS_API_KEY;

  return {
    ...config,
    ios: {
      ...(config.ios || {}),
      bundleIdentifier:
        process.env.IOS_BUNDLE_IDENTIFIER || config.ios?.bundleIdentifier,
      config: {
        ...config.ios?.config,
        googleMapsApiKey: iosMapsApiKey,
      },
    },
    android: {
      ...(config.android || {}),
      package: process.env.ANDROID_PACKAGE || config.android?.package,
      config: {
        ...config.android?.config,
        googleMaps: {
          ...config.android?.config?.googleMaps,
          apiKey: androidMapsApiKey,
        },
      },
    },
  };
};
