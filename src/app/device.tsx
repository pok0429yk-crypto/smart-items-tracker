import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { BleManager } from "react-native-ble-plx";

import { db } from "../firebase";
import { collection, addDoc, Timestamp, query, where, getDocs } from "firebase/firestore";

export default function AddDevicePage() {
  const router = useRouter();
  const manager = new BleManager();

  const [devices, setDevices] = useState([]);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    return () => {
      manager.stopDeviceScan();
      manager.destroy();
    };
  }, []);

  const startScan = () => {
    setDevices([]);
    setScanning(true);

    manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        Alert.alert("Error", error.message);
        setScanning(false);
        return;
      }

      if (!device) return;

      // 避免重复添加设备
      setDevices((prev) => {
        if (!prev.find((d) => d.id === device.id)) {
          return [...prev, { id: device.id, name: device.name || "Unknown" }];
        }
        return prev;
      });
    });

    // 10秒后停止扫描
    setTimeout(() => {
      manager.stopDeviceScan();
      setScanning(false);
    }, 10000);
  };

  const connectDevice = async (deviceId, deviceName) => {
    try {
      const device = await manager.connectToDevice(deviceId);
      await device.discoverAllServicesAndCharacteristics();

      // 检查 Firestore 是否已存在
      const q = query(
        collection(db, "devices"),
        where("deviceId", "==", device.id)
      );
      const snapshot = await getDocs(q);

      let docId;
      if (!snapshot.empty) {
        // 已存在，直接拿 id
        docId = snapshot.docs[0].id;
      } else {
        // 不存在，新增
        const docRef = await addDoc(collection(db, "devices"), {
          deviceId: device.id,
          name: deviceName || device.name || "Unknown",
          createdAt: Timestamp.now(),
        });
        docId = docRef.id;
      }

      Alert.alert("Success", `Connected to ${device.name || "Device"}`);

      // 跳转详情页
      router.push({
        pathname: "/view-device",
        params: { id: docId },
      });
    } catch (error) {
      Alert.alert("Connection Failed", error.message);
    }
  };

  const renderDevice = ({ item }) => (
    <View style={styles.deviceCard}>
      <Text style={styles.deviceText}>{item.name}</Text>
      <TouchableOpacity
        style={styles.iconButton}
        onPress={() => connectDevice(item.id, item.name)}
      >
        <Ionicons name="bluetooth-outline" size={22} color="#000000" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.headerLeft}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#000" />
          <Text style={styles.headerTitle}>Add Device</Text>
        </TouchableOpacity>
      </View>

      {/* Scan Button */}
      <TouchableOpacity style={styles.scanButton} onPress={startScan}>
        <Ionicons name="add-outline" size={22} color="#fff" />
        <Text style={styles.scanText}>
          {scanning ? "Scanning..." : "Add Bluetooth Devices"}
        </Text>
        {scanning && (
          <ActivityIndicator color="#fff" style={{ marginLeft: 10 }} />
        )}
      </TouchableOpacity>

      {/* Device List */}
      <FlatList
        data={devices}
        keyExtractor={(item) => item.id}
        renderItem={renderDevice}
        contentContainerStyle={{ paddingBottom: 30 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 50,
    backgroundColor: "#f2f4f8",
  },

  /* Header */
  headerRow: {
    marginBottom: 20,
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 6,
  },

  /* Scan Button */
  scanButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#000",
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    justifyContent: "center",
  },

  scanText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 8,
  },

  /* Device Card */
  deviceCard: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    elevation: 2,
  },

  deviceText: {
    fontSize: 16,
  },

  iconButton: {
    padding: 6,
  },
});