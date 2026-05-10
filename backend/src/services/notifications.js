import { Expo } from "expo-server-sdk";
import { getMessaging } from "../config/firebase.js";

const expoClient = new Expo();

function isExpoToken(token) {
  return typeof token === "string" && Expo.isExpoPushToken(token);
}

async function sendExpo(tokens, title, body, data) {
  const messages = tokens.filter(isExpoToken).map((to) => ({
    to,
    sound: "default",
    title,
    body,
    data: data || {},
    priority: "high",
    channelId: "default",
  }));
  const chunks = expoClient.chunkPushNotifications(messages);
  for (const chunk of chunks) {
    try {
      await expoClient.sendPushNotificationsAsync(chunk);
    } catch (e) {
      console.warn("Expo push error:", e.message);
    }
  }
}

export async function sendPushToTokens(tokens, title, body, data = {}) {
  const unique = [...new Set(tokens.filter(Boolean))];
  if (!unique.length) return;

  const expoTokens = unique.filter(isExpoToken);
  const fcmTokens = unique.filter((t) => !isExpoToken(t));

  if (expoTokens.length) {
    await sendExpo(expoTokens, title, body, data);
  }

  if (!fcmTokens.length) return;

  try {
    await getMessaging().sendEachForMulticast({
      tokens: fcmTokens,
      notification: { title, body },
      data: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)])
      ),
      android: { priority: "high" },
      apns: {
        payload: { aps: { sound: "default", badge: 1 } },
      },
    });
  } catch (e) {
    console.warn("FCM multicast failed:", e.message);
  }
}
