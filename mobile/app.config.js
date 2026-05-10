/**
 * Public Firebase web config is safe to ship in the client.
 * Still load from env so keys stay out of git — copy .env.example → .env
 */
export default ({ config }) => ({
  ...config,
  name: "MedSwift",
  slug: "medswift",
  scheme: "medswift",
  version: "1.0.0",
  orientation: "portrait",
  userInterfaceStyle: "light",
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.medswift.app",
    config: {
      googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_IOS_KEY || "",
    },
  },
  android: {
    package: "com.medswift.app",
    config: {
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY || "",
      },
    },
  },
  plugins: [
    "expo-asset",
    [
      "expo-location",
      {
        locationAlwaysAndWhenInUsePermission:
          "MedSwift needs your location for emergency dispatch and ambulance tracking.",
      },
    ],
    [
      "expo-notifications",
      {
        sounds: [],
      },
    ],
  ],
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000",
    firebaseApiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    firebaseAuthDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    firebaseProjectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    firebaseStorageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    firebaseMessagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    firebaseAppId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    firebaseDatabaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
  },
});
