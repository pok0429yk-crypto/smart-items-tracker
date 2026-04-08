import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function ViewRoute() {
  const router = useRouter();

  // 模拟数据
  const routeTime = "2026/01/01 13:00 - 15:00";
  const routeHistory = "Home to Home";

  return (
    <ScrollView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#333" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>View Route</Text>
      </View>

      {/* DATE TIME */}
      <Text style={styles.label}>Date & Time</Text>
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>{routeTime}</Text>
      </View>

      {/* ROUTE HISTORY */}
      <Text style={styles.label}>Route History</Text>
      <View style={styles.routeBox}>
        <Ionicons name="home-outline" size={22} color="#000" />

        <Text style={styles.routeText}>{routeHistory}</Text>

        <Ionicons name="home-outline" size={22} color="#000" />
      </View>

      {/* MAP PLACEHOLDER */}
      <Text style={styles.label}>Route Map</Text>
      <View style={styles.mapPlaceholder}>
        <Ionicons name="map-outline" size={40} color="#999" />
        <Text style={{ color: "#999", marginTop: 8 }}>
          Map Preview Here
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f4f8",
    padding: 20,
    paddingTop: 50,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 12,
  },

  label: {
    fontWeight: "bold",
    marginTop: 15,
    marginBottom: 8,
  },

  infoBox: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
  },

  infoText: {
    fontSize: 16,
  },

  routeBox: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  routeText: {
    fontSize: 16,
    fontWeight: "500",
  },

  mapPlaceholder: {
    backgroundColor: "#fff",
    height: 220,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 5,
  },
});
