import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";

import { db } from "../firebase";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";

export default function EditSafeZone() {
  const router = useRouter();
  const { id, lat, lng } = useLocalSearchParams();

  const [safeZoneName, setSafeZoneName] = useState("");
  const [location, setLocation] = useState("");
  const [radius, setRadius] = useState("100");

  const availableItems = ["Item A", "Item B", "Item C"];

  const [items, setItems] = useState([
    { id: 1, name: "", showAdd: true, showPicker: false },
  ]);

  // ✅ 读取 Firestore
  useEffect(() => {
    const fetchData = async () => {
      try {
        const docRef = doc(db, "safezones", id);
        const snap = await getDoc(docRef);

        if (snap.exists()) {
          const data = snap.data();

          setSafeZoneName(data.name);
          setRadius(String(data.radius || 100));

          // 👉 经纬度显示
          if (data.latitude && data.longitude) {
            setLocation(`Lat: ${data.latitude}, Lng: ${data.longitude}`);
          }

          setItems(
            (data.items || []).map((name, index) => ({
              id: index + 1,
              name,
              showAdd: index === data.items.length - 1,
              showPicker: false,
            }))
          );
        }
      } catch (err) {
        console.log(err);
      }
    };

    if (id) fetchData();
  }, [id]);

  // ✅ 如果从地图返回（更新坐标）
  useEffect(() => {
    if (lat && lng) {
      setLocation(`Lat: ${lat}, Lng: ${lng}`);
    }
  }, [lat, lng]);

  // 👉 打开地图
  const handleLocationPress = () => {
    router.push({
      pathname: "/select-location",
      params: { id }, // 可选：带回 id
    });
  };

  const addItem = (id) => {
    setItems((prev) => {
      const newId = prev.length + 1;
      return prev
        .map((item) =>
          item.id === id ? { ...item, showAdd: false } : item
        )
        .concat({ id: newId, name: "", showAdd: true, showPicker: false });
    });
  };

  const togglePicker = (id) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, showPicker: !item.showPicker } : item
      )
    );
  };

  const selectItem = (id, value) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, name: value, showPicker: false } : item
      )
    );
  };

  // ✅ 更新 Firestore
  const handleSave = async () => {
    try {
      // 👉 从 location 拆回 lat/lng
      let latitude = null;
      let longitude = null;

      if (lat && lng) {
        latitude = Number(lat);
        longitude = Number(lng);
      } else if (location.includes("Lat")) {
        const parts = location.replace("Lat: ", "").replace("Lng: ", "").split(",");
        latitude = Number(parts[0]);
        longitude = Number(parts[1]);
      }

      await updateDoc(doc(db, "safezones", id), {
        name: safeZoneName,
        latitude,
        longitude,
        radius: Number(radius),
        items: items.map((i) => i.name),
      });

      Alert.alert("Updated!");
      router.back();
    } catch (err) {
      console.log(err);
    }
  };

  // ✅ 删除
  const handleDelete = () => {
    Alert.alert("Delete", "Confirm delete?", [
      { text: "Cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDoc(doc(db, "safezones", id));
            router.back();
          } catch (err) {
            console.log(err);
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit SafeZone</Text>

        <TouchableOpacity style={{ marginLeft: "auto" }} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={24} />
        </TouchableOpacity>
      </View>

      {/* Name */}
      <Text style={styles.label}>SafeZone Name</Text>
      <TextInput
        style={styles.input}
        value={safeZoneName}
        onChangeText={setSafeZoneName}
      />

      {/* Location */}
      <Text style={styles.label}>Location</Text>
      <View style={styles.locationContainer}>
        <TextInput
          style={[styles.input, { flex: 1, paddingLeft: 36 }]}
          value={location}
          editable={false}
        />
        <TouchableOpacity
          style={styles.locationIcon}
          onPress={handleLocationPress}
        >
          <Ionicons name="location-outline" size={20} />
        </TouchableOpacity>
      </View>

      {/* Radius */}
      <Text style={styles.label}>Radius (meters)</Text>
      <TextInput
        style={styles.input}
        value={radius}
        onChangeText={setRadius}
        keyboardType="numeric"
      />

      {/* Items */}
      <Text style={styles.label}>Items</Text>
      {items.map((item) => (
        <View key={item.id} style={styles.itemRow}>
          <TouchableOpacity
            style={styles.selectBox}
            onPress={() => togglePicker(item.id)}
          >
            <Text style={{ flex: 1, color: item.name ? "#000" : "#999" }}>
              {item.name || `Select Item ${item.id}`}
            </Text>
            <Ionicons name="chevron-down" size={20} />
          </TouchableOpacity>

          {item.showPicker && (
            <View style={styles.pickerList}>
              {availableItems.map((val) => (
                <TouchableOpacity
                  key={val}
                  style={styles.pickerItem}
                  onPress={() => selectItem(item.id, val)}
                >
                  <Text>{val}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {item.showAdd && (
            <TouchableOpacity onPress={() => addItem(item.id)}>
              <Ionicons name="add-circle-outline" size={28} />
            </TouchableOpacity>
          )}
        </View>
      ))}

      {/* Save */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveText}>Update</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 50 },
  header: { flexDirection: "row", alignItems: "center" },
  headerTitle: { fontSize: 20, marginLeft: 10 },
  label: { marginTop: 15, fontWeight: "bold" },
  input: { backgroundColor: "#fff", padding: 12, borderRadius: 10, marginTop: 5 },
  locationContainer: { position: "relative" },
  locationIcon: { position: "absolute", left: 10, top: 18 },
  itemRow: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  selectBox: { flex: 1, flexDirection: "row", backgroundColor: "#fff", padding: 12, borderRadius: 10 },
  pickerList: { position: "absolute", top: 50, left: 0, right: 40, backgroundColor: "#fff", borderRadius: 10 },
  pickerItem: { padding: 10 },
  saveButton: { backgroundColor: "#000", padding: 15, marginTop: 20, borderRadius: 10 },
  saveText: { color: "#fff", textAlign: "center" },
});