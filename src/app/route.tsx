import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function RouteHistory() {
  const router = useRouter();

  // 模拟 Route History 数据
  const [routes] = useState([
    {
      id: "1",
      datetime: "2026/01/01 13:00 - 15:00",
    },
    {
      id: "2",
      datetime: "2026/01/02 09:30 - 11:00",
    },
    {
      id: "3",
      datetime: "2026/01/03 18:10 - 20:45",
    },
  ]);

  // 渲染 Route
  const renderRoute = ({ item }) => (
    <TouchableOpacity
      style={styles.routeCard}
      onPress={() => router.push("/view-route")}
    >
      <Text style={styles.routeText}>{item.datetime}</Text>

      {/* View Icon */}
      <Ionicons name="chevron-forward" size={22} color="#333" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#333" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Route History</Text>
      </View>

      {/* Route List */}
      <FlatList
        data={routes}
        keyExtractor={(item) => item.id}
        renderItem={renderRoute}
        contentContainerStyle={{ paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f4f8",
    paddingHorizontal: 20,
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

  routeCard: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    elevation: 2,
  },

  routeText: {
    fontSize: 16,
  },
});
