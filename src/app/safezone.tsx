import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";

// Firestore
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

export default function SafeZonePage() {
  const router = useRouter();
  const [zones, setZones] = useState([]);

  // 获取 Firestore 数据
  const fetchZones = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "safezones"));
      const zoneList = querySnapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      }));
      setZones(zoneList);
    } catch (error) {
      console.log("Error fetching zones:", error);
    }
  };

  // 页面每次进入刷新
  useFocusEffect(
    useCallback(() => {
      fetchZones();
    }, [])
  );

  // 渲染每个 SafeZone
  const renderZone = ({ item }) => (
    <View style={styles.zoneCard}>
      <Text style={styles.zoneText}>{item.name}</Text>

      <View style={styles.zoneButtons}>
        {/* Edit */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() =>
            router.push({
              pathname: "/view-safezone",
              params: { id: item.id },
            })
          }
        >
          <Ionicons name="create-outline" size={22} color="#000" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SafeZone Management</Text>
      </View>

      {/* Add SafeZone */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push("/add-safezone")}
      >
        <Ionicons name="add-circle-outline" size={22} color="#fff" />
        <Text style={styles.addText}>Add SafeZone</Text>
      </TouchableOpacity>

      {/* List */}
      <FlatList
        data={zones}
        keyExtractor={(item) => item.id}
        renderItem={renderZone}
        contentContainerStyle={{ paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

// 🎨 UI
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
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#000",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 15,
    marginBottom: 20,
    alignSelf: "flex-start",
  },
  addText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 8,
  },
  zoneCard: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    elevation: 2,
  },
  zoneText: {
    fontSize: 16,
  },
  zoneButtons: {
    flexDirection: "row",
  },
  iconButton: {
    marginLeft: 12,
    padding: 6,
  },
});