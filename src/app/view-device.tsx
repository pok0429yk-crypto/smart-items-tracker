import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";

// Firestore
import { db } from "../firebase";
import { doc, getDoc, deleteDoc } from "firebase/firestore";

export default function ViewDevice() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [device, setDevice] = useState(null);
  const [loading, setLoading] = useState(true);

  const [ring, setRing] = useState("Default");
  const [selectedItem, setSelectedItem] = useState("Item A");

  const availableItems = ["Item A", "Item B", "Item C"];
  const availableRings = ["Default", "Ring 1", "Ring 2", "Ring 3"];

  // 获取设备数据
  const fetchDevice = async () => {
    try {
      const docRef = doc(db, "devices", id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setDevice(docSnap.data());
      } else {
        Alert.alert("Error", "Device not found");
        router.back();
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevice();
  }, []);

  // 删除设备
  const handleDelete = () => {
    Alert.alert(
      "Delete Device",
      "Are you sure you want to delete this device?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "devices", id));
              Alert.alert("Deleted", "Device removed successfully");
              router.back();
            } catch (error) {
              Alert.alert("Error", error.message);
            }
          },
        },
      ]
    );
  };

  // 播放声音（模拟）
  const handlePlaySound = () => {
    Alert.alert(
      "Play Sound",
      `Playing ${ring} sound for ${device?.name || "Device"}`
    );
  };

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 50 }} />;
  }

  if (!device) return null;

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#333" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>View Device</Text>

        <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
          <Ionicons name="trash-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Device Name */}
      <Text style={styles.label}>Device Name</Text>
      <View style={styles.inputBox}>
        <Text>{device.name}</Text>
      </View>

      {/* Device ID */}
      <Text style={styles.label}>Device ID</Text>
      <View style={styles.inputBox}>
        <Text>{device.deviceId}</Text>
      </View>

      {/* Ring */}
      <Text style={styles.label}>Ring</Text>
      <View style={styles.pickerContainer}>
        <Picker selectedValue={ring} onValueChange={(val) => setRing(val)}>
          {availableRings.map((r) => (
            <Picker.Item key={r} label={r} value={r} />
          ))}
        </Picker>
      </View>

      {/* Item */}
      <Text style={styles.label}>Item</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedItem}
          onValueChange={(val) => setSelectedItem(val)}
        >
          {availableItems.map((i) => (
            <Picker.Item key={i} label={i} value={i} />
          ))}
        </Picker>
      </View>

      {/* Play Sound */}
      <TouchableOpacity style={styles.playButton} onPress={handlePlaySound}>
        <Text style={styles.playText}>Play Sound</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// 样式
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
    flex: 1,
  },

  deleteButton: {
    marginLeft: "auto",
  },

  label: {
    fontWeight: "bold",
    marginTop: 15,
    marginBottom: 8,
  },

  inputBox: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
  },

  pickerContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 10,
  },

  playButton: {
    backgroundColor: "#000",
    padding: 15,
    borderRadius: 12,
    marginTop: 30,
    alignItems: "center",
  },

  playText: {
    color: "#fff",
    fontWeight: "bold",
  },
});