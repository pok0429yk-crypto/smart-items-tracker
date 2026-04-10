import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ScrollView, Image, Alert
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";

import {
  collection, addDoc, getDocs,
  Timestamp, updateDoc, DocumentData
} from "firebase/firestore";

import {
  ref, uploadBytes, getDownloadURL
} from "firebase/storage";

import { db, storage, auth } from "../firebase";

/* ================= TYPES ================= */
type Device = {
  id: string;
  name?: string;
};

export default function AddItem() {
  const router = useRouter();

  const [itemName, setItemName] = useState<string>("");
  const [selectedDevice, setSelectedDevice] = useState<string>("No Device");
  const [devices, setDevices] = useState<Device[]>([]);

  const [notificationEnabled, setNotificationEnabled] = useState<string>("No");
  const [selectedDays, setSelectedDays] = useState<string[]>(["Everyday"]);

  const [startTime, setStartTime] = useState<Date>(new Date());
  const [endTime, setEndTime] = useState<Date>(new Date());

  const [showStartPicker, setShowStartPicker] = useState<boolean>(false);
  const [showEndPicker, setShowEndPicker] = useState<boolean>(false);

  const [image, setImage] = useState<string | null>(null);

  const days: string[] = [
    "Everyday", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"
  ];

  /* ================= IMAGE UPLOAD ================= */
  const uploadImageAsync = async (uri: string, itemId?: string): Promise<string | null> => {
    if (!uri) return null;

    const user = auth.currentUser;
    if (!user) return null;

    const response = await fetch(uri);
    const blob = await response.blob();

    const filename = uri.substring(uri.lastIndexOf("/") + 1);

    const storageRef = ref(
      storage,
      `users/${user.uid}/item/${itemId ?? filename}.jpg`
    );

    await uploadBytes(storageRef, blob);

    return await getDownloadURL(storageRef);
  };

  /* ================= FETCH DEVICES ================= */
  const fetchDevices = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const snapshot = await getDocs(
        collection(db, "user", user.uid, "device")
      );

      const list: Device[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as DocumentData),
      }));

      setDevices(list);
    } catch (err) {
      console.log("Device fetch error:", err);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  /* ================= HELPERS ================= */
  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

  const toggleDay = (day: string) => {
    if (day === "Everyday") {
      setSelectedDays(["Everyday"]);
      return;
    }

    let updated = selectedDays.includes(day)
      ? selectedDays.filter(d => d !== day)
      : [...selectedDays.filter(d => d !== "Everyday"), day];

    if (updated.length === 0) updated = ["Everyday"];
    setSelectedDays(updated);
  };

  /* ================= IMAGE PICK ================= */
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

  /* ================= SAVE ================= */
  const handleSave = async () => {
    if (!itemName) {
      Alert.alert("Error", "Enter item name");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Error", "Not logged in");
      return;
    }

    try {
      // 1️⃣ create item first
      const docRef = await addDoc(
        collection(db, "user", user.uid, "item"),
        {
          name: itemName,
          device: selectedDevice,
          notification: notificationEnabled,
          days: selectedDays,
          startTime: Timestamp.fromDate(startTime),
          endTime: Timestamp.fromDate(endTime),
          image: null,
          createdAt: Timestamp.now(),
        }
      );

      // 2️⃣ upload image
      if (image) {
        const imageUrl = await uploadImageAsync(image, docRef.id);

        await updateDoc(docRef, {
          image: imageUrl,
        });
      }

      Alert.alert("Success", "Item saved!");
      router.back();

    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Save failed");
    }
  };

  /* ================= UI ================= */
return (
    <ScrollView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Item</Text>
      </View>

      {/* NAME */}
      <Text style={styles.label}>Item Name</Text>
      <TextInput
        style={styles.input}
        value={itemName}
        onChangeText={setItemName}
        placeholder="Enter item name"
      />

      {/* DEVICE */}
      <Text style={styles.label}>Device</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedDevice}
          onValueChange={setSelectedDevice}
        >
          <Picker.Item label="No Device" value="No Device" />
          {devices.map(d => (
            <Picker.Item key={d.id} label={d.name} value={d.name} />
          ))}
        </Picker>
      </View>

      {/* NOTIFICATION */}
      <Text style={styles.label}>Notification</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={notificationEnabled}
          onValueChange={setNotificationEnabled}
        >
          <Picker.Item label="No" value="No" />
          <Picker.Item label="Yes" value="Yes" />
        </Picker>
      </View>

      {/* DAY + TIME */}
      {notificationEnabled === "Yes" && (
        <>
          <Text style={styles.label}>Days</Text>
          <View style={styles.daysContainer}>
            {days.map(day => {
              const selected = selectedDays.includes(day);
              return (
                <TouchableOpacity
                  key={day}
                  style={[styles.dayButton, selected && styles.selectedDay]}
                  onPress={() => toggleDay(day)}
                >
                  <Text style={{ color: selected ? "#fff" : "#000" }}>
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.label}>Time</Text>
          <View style={styles.timeRow}>
            <TouchableOpacity onPress={() => setShowStartPicker(true)}>
              <Text>{formatTime(startTime)}</Text>
            </TouchableOpacity>

            <Text> - </Text>

            <TouchableOpacity onPress={() => setShowEndPicker(true)}>
              <Text>{formatTime(endTime)}</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* TIME PICKERS */}
      {showStartPicker && (
        <DateTimePicker
          value={startTime}
          mode="time"
          is24Hour
          display="spinner"
          onChange={(e, d) => {
            setShowStartPicker(false);
            if (d) setStartTime(d);
          }}
        />
      )}

      {showEndPicker && (
        <DateTimePicker
          value={endTime}
          mode="time"
          is24Hour
          display="spinner"
          onChange={(e, d) => {
            setShowEndPicker(false);
            if (d) setEndTime(d);
          }}
        />
      )}

      {/* IMAGE */}
      <Text style={styles.label}>Photo</Text>
      <TouchableOpacity style={styles.photoBtn} onPress={pickImage}>
        <Text style={{ color: "#fff" }}>
          {image ? "Change Photo" : "Add Photo"}
        </Text>
      </TouchableOpacity>

      {image && <Image source={{ uri: image }} style={styles.image} />}

      {/* SAVE */}
      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={{ color: "#fff" }}>Save Item</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  headerTitle: { fontSize: 18, marginLeft: 10 },
  label: { marginTop: 10, fontWeight: "bold" },
  input: { backgroundColor: "#fff", padding: 10, borderRadius: 8 },
  pickerContainer: { backgroundColor: "#fff", borderRadius: 8 },
  daysContainer: { flexDirection: "row", flexWrap: "wrap" },
  dayButton: { padding: 8, margin: 5, backgroundColor: "#eee", borderRadius: 20 },
  selectedDay: { backgroundColor: "#000" },
  timeRow: { flexDirection: "row", marginTop: 10 },
  photoBtn: { backgroundColor: "#000", padding: 10, marginTop: 10, alignItems: "center" },
  image: { width: "100%", height: 200, marginTop: 10 },
  saveBtn: { backgroundColor: "#000", padding: 15, marginTop: 20, alignItems: "center" },
});