import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Image, Alert
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter, useLocalSearchParams } from "expo-router";

import {
  doc, getDoc, updateDoc,
  Timestamp, collection, getDocs
} from "firebase/firestore";

import {
  ref, uploadBytes, getDownloadURL
} from "firebase/storage";

import { db, storage, auth } from "../firebase";

export default function EditItem() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const itemId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [loading, setLoading] = useState(true);

  const [itemName, setItemName] = useState("");
  const [selectedDevice, setSelectedDevice] = useState("No Device");
  const [devices, setDevices] = useState([]);
  const [notificationEnabled, setNotificationEnabled] = useState("No");
  const [selectedDays, setSelectedDays] = useState(["Everyday"]);
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [image, setImage] = useState(null);

  const days = ["Everyday", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // 读取数据
  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user || !itemId) return;

      try {
        const itemRef = doc(db, "user", user.uid, "item", itemId);
        const docSnap = await getDoc(itemRef);

        if (docSnap.exists()) {
          const data = docSnap.data();

          setItemName(data.name || "");
          setSelectedDevice(data.device || "No Device");
          setNotificationEnabled(data.notification || "No");
          setSelectedDays(data.days || ["Everyday"]);
          setStartTime(data.startTime ? data.startTime.toDate() : new Date());
          setEndTime(data.endTime ? data.endTime.toDate() : new Date());
          setImage(data.image || null);
        }

        const deviceSnap = await getDocs(
          collection(db, "user", user.uid, "device")
        );

        const deviceList = deviceSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setDevices(deviceList);

      } catch (error) {
        console.error(error);
        Alert.alert("Error", "Load failed");
        router.back();
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [itemId]);

  // 上传图片（固定路径 = 不会堆垃圾）
  const uploadImageAsync = async (uri) => {
    if (!uri) return null;

    const user = auth.currentUser;
    if (!user) return null;

    const response = await fetch(uri);
    const blob = await response.blob();

    const storageRef = ref(
      storage,
      `users/${user.uid}/items/${itemId}.jpg`
    );

    await uploadBytes(storageRef, blob);

    return await getDownloadURL(storageRef);
  };

  // 选图
  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission denied");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const formatTime = (date) =>
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });

  const toggleDay = (day) => {
    if (day === "Everyday") return setSelectedDays(["Everyday"]);

    let updated = selectedDays.includes(day)
      ? selectedDays.filter((d) => d !== day)
      : [...selectedDays.filter((d) => d !== "Everyday"), day];

    if (updated.length === 0) updated = ["Everyday"];
    setSelectedDays(updated);
  };

  // 更新
  const handleSave = async () => {
    const user = auth.currentUser;

    if (!user) {
      Alert.alert("Error", "Not logged in");
      return;
    }

    if (!itemName) {
      Alert.alert("Error", "Enter item name");
      return;
    }

    if (notificationEnabled === "Yes" && endTime <= startTime) {
      Alert.alert("Error", "Invalid time");
      return;
    }

    try {
      let imageUrl = image;

      //如果是新选的图片（本地 uri 才上传）
      if (image && !image.startsWith("https")) {
        imageUrl = await uploadImageAsync(image);
      }

      const itemRef = doc(db, "user", user.uid, "item", itemId);

      await updateDoc(itemRef, {
        name: itemName,
        device: selectedDevice,
        notification: notificationEnabled,
        days: selectedDays,
        startTime: Timestamp.fromDate(startTime),
        endTime: Timestamp.fromDate(endTime),
        image: imageUrl || null,
      });

      Alert.alert("Success", "Updated!");
      router.back();

    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Update failed");
    }
  };

  if (loading) {
    return (
      <View style={styles.containerCenter}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Item</Text>
      </View>

      <Text style={styles.label}>Item Name</Text>
      <TextInput style={styles.input} value={itemName} onChangeText={setItemName} />

      <Text style={styles.label}>Device</Text>
      <View style={styles.pickerContainer}>
        <Picker selectedValue={selectedDevice} onValueChange={setSelectedDevice}>
          <Picker.Item label="No Device" value="No Device" />
          {devices.map((d) => (
            <Picker.Item key={d.id} label={d.name} value={d.name} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>Notification</Text>
      <View style={styles.pickerContainer}>
        <Picker selectedValue={notificationEnabled} onValueChange={setNotificationEnabled}>
          <Picker.Item label="No" value="No" />
          <Picker.Item label="Yes" value="Yes" />
        </Picker>
      </View>

      {notificationEnabled === "Yes" && (
        <>
          <Text style={styles.label}>Days</Text>
          <View style={styles.daysContainer}>
            {days.map((day) => {
              const selected = selectedDays.includes(day);
              return (
                <TouchableOpacity
                  key={day}
                  style={[styles.dayButton, selected && styles.selectedDay]}
                  onPress={() => toggleDay(day)}
                >
                  <Text style={{ color: selected ? "#fff" : "#000" }}>{day}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.label}>Time</Text>
          <View style={styles.timeRow}>
            <Text>{formatTime(startTime)}</Text>
            <Text> - </Text>
            <Text>{formatTime(endTime)}</Text>
          </View>
        </>
      )}

      <Text style={styles.label}>Photo</Text>
      <TouchableOpacity style={styles.photoBtn} onPress={pickImage}>
        <Text style={{ color: "#fff" }}>Select Photo</Text>
      </TouchableOpacity>

      {image && <Image source={{ uri: image }} style={styles.image} />}

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={{ color: "#fff" }}>Update</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// styles
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  containerCenter: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  headerTitle: { fontSize: 18, marginLeft: 10 },
  label: { marginTop: 10, fontWeight: "bold" },
  input: { backgroundColor: "#fff", padding: 10, borderRadius: 8 },
  pickerContainer: { backgroundColor: "#fff", borderRadius: 8 },
  daysContainer: { flexDirection: "row", flexWrap: "wrap" },
  dayButton: { padding: 8, margin: 5, backgroundColor: "#eee", borderRadius: 20 },
  selectedDay: { backgroundColor: "#000" },
  timeRow: { flexDirection: "row", marginTop: 10 },
  photoBtn: { backgroundColor: "#000", padding: 10, marginTop: 10 },
  image: { width: "100%", height: 200, marginTop: 10 },
  saveBtn: { backgroundColor: "#000", padding: 15, marginTop: 20, alignItems: "center" },
});