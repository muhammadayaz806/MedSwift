import Constants from "expo-constants";
import { initializeApp } from "firebase/app";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { getAuth, getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const extra = Constants.expoConfig?.extra || {};

const firebaseConfig = {
  apiKey: extra.firebaseApiKey,
  authDomain: extra.firebaseAuthDomain,
  projectId: extra.firebaseProjectId,
  storageBucket: extra.firebaseStorageBucket,
  messagingSenderId: extra.firebaseMessagingSenderId,
  appId: extra.firebaseAppId,
  databaseURL: extra.firebaseDatabaseURL,
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = (() => {
  try {
    return initializeAuth(firebaseApp, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage),
    });
  } catch {
    // If auth was already initialized, fall back to the existing instance.
    return getAuth(firebaseApp);
  }
})();
export const rtdb = getDatabase(firebaseApp);
