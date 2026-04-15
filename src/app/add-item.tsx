import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Image, Alert } from "react-native";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { collection, addDoc, getDocs, Timestamp, updateDoc, DocumentData } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage, auth } from "../firebase";
import * as FileSystem from "expo-file-system/legacy";

/* ================= TYPES ================= */
type Device = {
  id: string;
  name?: string;
};

/* ================= COMPONENT ================= */
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

  const days = ["Everyday","Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

  /* ================= IMAGE UPLOAD  ================= */
  const uploadImageAsync = async (uri: string, itemId: string) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No user logged in");

      console.log("📸 Uploading:", uri);

      // 1️⃣ read local file as base64
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: "base64",
      });

      // 2️⃣ convert to blob
      const blob = await fetch(`data:image/jpeg;base64,${base64}`)
        .then(res => res.blob());

      // 3️⃣ storage path
      const storageRef = ref(
        storage,
        `users/${user.uid}/items/${itemId}.jpg`
      );

      // 4️⃣ upload
      await uploadBytes(storageRef, blob);

      // 5️⃣ get url
      const url = await getDownloadURL(storageRef);

      console.log("✅ Upload success:", url);

      return url;

    } catch (err) {
      console.log("❌ UPLOAD ERROR:", err);
      return null;
    }
  };

  /* ================= FETCH DEVICES ================= */
  const fetchDevices = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const snapshot = await getDocs(
        collection(db, "user", user.uid, "device")
      );

      const list: Device[] = snapshot.docs.map(doc => ({
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
    if (!user) return;

    try {
      // 1️⃣ create firestore doc
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

      let imageUrl = null;

      // 2️⃣ upload image
      if (image) {
        imageUrl = await uploadImageAsync(image, docRef.id);
      }

      // 3️⃣ update firestore
      if (imageUrl) {
        await updateDoc(docRef, {
          image: imageUrl,
        });
      }

      Alert.alert("Success", "Item saved!");
      router.back();

    } catch (err) {
      console.log("SAVE ERROR:", err);
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
          <Picker.Item label="No Device" value="No Device" color="#000"/>
          {devices.map(d => (
            <Picker.Item key={d.id} label={d.name} value={d.name} color="#000"/>
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
          <Picker.Item label="No" value="No" color="#000"/>
          <Picker.Item label="Yes" value="Yes" color="#000"/>
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
      <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
        <Text style={{ color: "#fff" }}>
          {image ? "Change Photo" : "Add Photo"}
        </Text>
      </TouchableOpacity>

      {image && <Image source={{ uri: image }} style={styles.imagePreview} />}

      {/* SAVE */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={{ color: "#fff" }}>Save Item</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

/* ================= STYLES ================= */
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
  label: {
    fontWeight: "bold",
    marginTop: 15,
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
  },
  pickerContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 10,
  },
  daysContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#fff",
    marginRight: 10,
    marginBottom: 10,
  },
  selectedDay: {
    backgroundColor: "#000",
  },
  timeRangeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
  },
  timeBox: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    minWidth: 100,
    alignItems: "center",
  },
  timeText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  timeRow: { 
    flexDirection: "row", 
    marginTop: 10 
  },
  photoButton: {
    backgroundColor: "#000",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  imagePreview: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginBottom: 10,
  },
  saveButton: {
    backgroundColor: "#000",
    padding: 15,
    borderRadius: 12,
    marginTop: 20,
    alignItems: "center",
    marginBottom: 40,
  },
  saveText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
