import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Image, Alert } from "react-native";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter, useLocalSearchParams } from "expo-router";
import { doc, getDoc, updateDoc, Timestamp, collection, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage, auth } from "../firebase";
import * as FileSystem from "expo-file-system/legacy";

/* ================= TYPE ================= */
type Device = {
  id: string;
  name?: string;
};

export default function EditItem() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const itemId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [loading, setLoading] = useState(true);

  const [itemName, setItemName] = useState("");
  const [selectedDevice, setSelectedDevice] = useState("No Device");
  const [devices, setDevices] = useState<Device[]>([]);

  const [notificationEnabled, setNotificationEnabled] = useState("No");
  const [selectedDays, setSelectedDays] = useState<string[]>(["Everyday"]);

  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const [image, setImage] = useState<string | null>(null);

  const days = ["Everyday","Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
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

  /* ================= IMAGE UPLOAD ================= */
  const uploadImageAsync = async (uri: string) => {
    try {
      const user = auth.currentUser;
      if (!user) return null;

      const base64 = await FileSystem.readAsStringAsync(uri, {
              encoding: "base64",
            });

      const blob = await fetch(`data:image/jpeg;base64,${base64}`)
        .then(res => res.blob());

      const storageRef = ref(
        storage,
        `users/${user.uid}/items/${itemId}.jpg`
      );

      await uploadBytes(storageRef, blob);

      return await getDownloadURL(storageRef);

    } catch (err) {
      console.log("UPLOAD ERROR:", err);
      return null;
    }
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

  /* ================= SAVE ================= */
  const handleSave = async () => {
    const user = auth.currentUser;

    if (!user) return Alert.alert("Error", "Not logged in");
    if (!itemName) return Alert.alert("Error", "Enter item name");

    if (notificationEnabled === "Yes" && endTime <= startTime) {
      return Alert.alert("Error", "End time must be after start time");
    }

    try {
      let imageUrl = image;

      if (image && !image.startsWith("https")) {
        imageUrl = await uploadImageAsync(image);
      }

      const itemRef = doc(db, "users", user.uid, "item", itemId);

      await updateDoc(itemRef, {
        name: itemName,
        device: selectedDevice,
        notification: notificationEnabled,
        days: notificationEnabled === "Yes" ? selectedDays : [],
        startTime: notificationEnabled === "Yes"
          ? Timestamp.fromDate(startTime)
          : null,
        endTime: notificationEnabled === "Yes"
          ? Timestamp.fromDate(endTime)
          : null,
        image: imageUrl || null,
      });

      Alert.alert("Success", "Updated!");
      router.back();

    } catch (err) {
      console.log(err);
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

  /* ================= UI ================= */
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Item</Text>
      </View>

      <Text style={styles.label}>Item Name</Text>
      <TextInput
        style={styles.input}
        value={itemName}
        onChangeText={setItemName}
      />

      <Text style={styles.label}>Device</Text>
      <View style={styles.pickerContainer}>
        <Picker selectedValue={selectedDevice} onValueChange={setSelectedDevice}>
          <Picker.Item label="No Device" value="No Device" color="#000"/>
          {devices.map(d => (
            <Picker.Item
              key={d.id}
              label={d.name || "Unnamed Device"}
              value={d.name || "Unnamed Device"}
              color="#000"
            />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>Notification</Text>
      <View style={styles.pickerContainer}>
        <Picker selectedValue={notificationEnabled} onValueChange={setNotificationEnabled}>
          <Picker.Item label="No" value="No" color="#000"/>
          <Picker.Item label="Yes" value="Yes" color="#000"/>
        </Picker>
      </View>

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

      {/* TIME PICKER */}
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

      <Text style={styles.label}>Photo</Text>
      <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
        <Text style={{ color: "#fff" }}>
          {image ? "Change Photo" : "Add Photo"}
        </Text>
      </TouchableOpacity>

      {image && <Image source={{ uri: image }} style={styles.imagePreview} />}

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={{ color: "#fff" }}>Update</Text>
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
  containerCenter: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center" 
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
