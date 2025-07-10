import { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "Enlingo",
  description: "The free, fun, and effective way to learn a language.",
  slug: "enlingo",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "myapp",
  userInterfaceStyle: "automatic",
  splash: {
    image: "./assets/images/splash.png",
    resizeMode: "contain",
    backgroundColor: "#DFEBF7",
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#DFEBF7",
    },
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: ["expo-router"],
  experiments: {
    typedRoutes: true,
  },
  owner: "weiran233",
  extra: {
    eas: {
      projectId: "89824204-c339-43c3-9dda-8f9752c479a2"
    }
  }
};

export default (): ExpoConfig => config;
