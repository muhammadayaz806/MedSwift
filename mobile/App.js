import React from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text, View, ActivityIndicator, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import UserHomeScreen from "./src/screens/UserHomeScreen";
import TrackScreen from "./src/screens/TrackScreen";
import SupportScreen from "./src/screens/SupportScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import DriverHomeScreen from "./src/screens/DriverHomeScreen";
import DriverTripScreen from "./src/screens/DriverTripScreen";

const AuthStack = createNativeStackNavigator();
const DriverStack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#fff7f7",
    card: "#7f1d1d",
    text: "#ffffff",
    border: "#991b1b",
    primary: "#dc2626",
  },
};

function UserTabs() {
  const tabIcons = {
    Home: "home-variant",
    Track: "map-marker-path",
    Support: "face-agent",
    Profile: "account-circle",
  };

  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: "#7f1d1d" },
        headerTintColor: "#fff",
        tabBarStyle: {
          backgroundColor: "#7f1d1d",
          borderTopColor: "#991b1b",
        },
        tabBarActiveTintColor: "#ffffff",
        tabBarInactiveTintColor: "#fecaca",
        tabBarIcon: ({ color, size, focused }) => {
          const iconName = tabIcons[route.name] || "circle";
          return (
            <MaterialCommunityIcons
              name={iconName}
              size={focused ? size + 2 : size}
              color={color}
            />
          );
        },
      })}
    >
      <Tabs.Screen
        name="Home"
        component={UserHomeScreen}
        options={{ title: "MedSwift", tabBarLabel: "Home" }}
      />
      <Tabs.Screen name="Track" component={TrackScreen} />
      <Tabs.Screen name="Support" component={SupportScreen} />
      <Tabs.Screen name="Profile" component={ProfileScreen} />
    </Tabs.Navigator>
  );
}

function DriverNavigator() {
  return (
    <DriverStack.Navigator>
      <DriverStack.Screen
        name="DriverHome"
        component={DriverHomeScreen}
        options={{ headerShown: false }}
      />
      <DriverStack.Screen
        name="DriverTrip"
        component={DriverTripScreen}
        options={{
          title: "Active trip",
          headerStyle: { backgroundColor: "#7f1d1d" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "800" },
        }}
      />
    </DriverStack.Navigator>
  );
}

function UnsupportedRole() {
  const { logout, profile } = useAuth();
  return (
    <View style={styles.center}>
      <Text style={styles.title}>Use the web dashboard</Text>
      <Text style={styles.body}>
        Signed in as {profile?.role}. Mobile apps support citizens and ambulance
        drivers only.
      </Text>
      <Text style={styles.link} onPress={() => logout()}>
        Sign out
      </Text>
    </View>
  );
}

function MissingProfile() {
  const { logout, user, profileError } = useAuth();
  return (
    <View style={styles.center}>
      <Text style={styles.title}>Finish onboarding</Text>
      <Text style={styles.body}>
        {profileError
          ? `Could not load profile (${profileError}). Check that the API is running and EXPO_PUBLIC_API_URL reaches your machine (use your PC LAN IP, not localhost, on a physical phone).`
          : `No profile exists for ${user?.email}. Drivers must be created by their organization; citizens should register via the mobile form.`}
      </Text>
      <Text style={styles.link} onPress={() => logout()}>
        Sign out
      </Text>
    </View>
  );
}

function RootNavigator() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#dc2626" />
        <Text style={styles.muted}>Loading MedSwift…</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <AuthStack.Navigator screenOptions={{ headerShown: false }}>
        <AuthStack.Screen name="Login" component={LoginScreen} />
        <AuthStack.Screen name="Register" component={RegisterScreen} />
      </AuthStack.Navigator>
    );
  }

  if (!profile) {
    return <MissingProfile />;
  }

  if (profile.role === "user") {
    return <UserTabs />;
  }

  if (profile.role === "driver") {
    return <DriverNavigator />;
  }

  return <UnsupportedRole />;
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer theme={navTheme}>
        <StatusBar style="light" />
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: "#0b1224",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    gap: 12,
  },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
  },
  body: { color: "#94a3b8", textAlign: "center", lineHeight: 22 },
  link: {
    marginTop: 12,
    color: "#93c5fd",
    fontWeight: "700",
  },
  muted: { color: "#64748b", marginTop: 12 },
});
