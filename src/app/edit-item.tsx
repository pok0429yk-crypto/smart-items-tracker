import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Image, Alert } from "react-native";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter, useLocalSearchParams } from "expo-router";
import { db, storage, auth } from "../firebase";
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function EditItem() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const itemId = params.id;

  const [loading, setLoading] = useState(true);

  const [itemName, setItemName] = useState("");
  const [selectedDevice, setSelectedDevice] = useState("No Device");
  const [notificationEnabled, setNotificationEnabled] = useState("No");
  const [selectedDays, setSelectedDays] = useState<string[]>(["Everyday"]);
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [image, setImage] = useState<string | null>(null);

  const days = ["Everyday", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // 从 Firestore 读取数据
  useEffect(() => {
    const fetchItem = async () => {
      if (!itemId) return;

      try {
        const docRef = doc(db, "items", itemId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();

          setItemName(data.name || "");
          setSelectedDevice(data.device || "No Device");
          setNotificationEnabled(data.notification || "No");
          setSelectedDays(data.days || ["Everyday"]);
          setStartTime(data.startTime ? data.startTime.toDate() : new Date());
          setEndTime(data.endTime ? data.endTime.toDate() : new Date());
          setImage(data.image || null);
        } else {
          Alert.alert("Error", "Item not found");
          router.back();
        }
      } catch (error) {
        console.error("Error fetching item:", error);
        Alert.alert("Error", "Failed to load item");
        router.back();
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [itemId]);

  // 上传图片
  const uploadImageAsync = async (uri: string) => {
    if (!uri) return null;
    const response = await fetch(uri);
    const blob = await response.blob();
    const filename = uri.substring(uri.lastIndexOf("/") + 1);
    const storageRef = ref(storage, `images/${filename}`);
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  };

  // 选择图片
  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission denied", "Cannot access gallery");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled && result.assets.length > 0) {
      setImage(result.assets[0].uri);
    }
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });

  const toggleDay = (day: string) => {
    if (day === "Everyday") {
      setSelectedDays(["Everyday"]);
      return;
    }
    let updatedDays = selectedDays.includes(day)
      ? selectedDays.filter((d) => d !== day)
      : [...selectedDays.filter((d) => d !== "Everyday"), day];
    if (updatedDays.length === 0) updatedDays = ["Everyday"];
    setSelectedDays(updatedDays);
  };

  // 保存更新
  const handleSave = async () => {
    if (!itemName) {
      Alert.alert("Error", "Please enter item name");
      return;
    }
    if (notificationEnabled === "Yes" && endTime <= startTime) {
      Alert.alert("Error", "End time must be later than start time");
      return;
    }

    try {
      const imageUrl = image ? await uploadImageAsync(image) : null;

      const itemRef = doc(db, "items", itemId!);
      await updateDoc(itemRef, {
        ownerId: auth.currentUser.uid,
        name: itemName,
        device: selectedDevice,
        notification: notificationEnabled,
        days: selectedDays,
        startTime: Timestamp.fromDate(startTime),
        endTime: Timestamp.fromDate(endTime),
        image: imageUrl,
      });

      Alert.alert("Success", "Item updated successfully!");
      router.back();
    } catch (error) {
      console.error("Error updating item:", error);
      Alert.alert("Error", "Failed to update item");
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Item</Text>
      </View>

      <Text style={styles.label}>Item Name</Text>
      <TextInput style={styles.input} placeholder="Enter item name" value={itemName} onChangeText={setItemName} />

      <Text style={styles.label}>Select Device</Text>
      <View style={styles.pickerContainer}>
        <Picker selectedValue={selectedDevice} onValueChange={setSelectedDevice}>
          <Picker.Item label="No Device" value="No Device" />
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
          <Text style={styles.label}>Select Days</Text>
          <View style={styles.daysContainer}>
            {days.map((day) => {
              const isSelected = selectedDays.includes(day);
              return (
                <TouchableOpacity key={day} style={[styles.dayButton, isSelected && styles.selectedDay]} onPress={() => toggleDay(day)}>
                  <Text style={{ color: isSelected ? "#fff" : "#000" }}>{day}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.label}>Time Range</Text>
          <View style={styles.timeRangeContainer}>
            <TouchableOpacity style={styles.timeBox} onPress={() => setShowStartPicker(true)}>
              <Text style={styles.timeText}>{formatTime(startTime)}</Text>
            </TouchableOpacity>
            <Text style={{ marginHorizontal: 10 }}>-</Text>
            <TouchableOpacity style={styles.timeBox} onPress={() => setShowEndPicker(true)}>
              <Text style={styles.timeText}>{formatTime(endTime)}</Text>
            </TouchableOpacity>
          </View>

          {showStartPicker && (
            <DateTimePicker
              value={startTime}
              mode="time"
              is24Hour
              display="spinner"
              onChange={(event, selectedDate) => {
                setShowStartPicker(false);
                if (selectedDate) setStartTime(selectedDate);
              }}
            />
          )}

          {showEndPicker && (
            <DateTimePicker
              value={endTime}
              mode="time"
              is24Hour
              display="spinner"
              onChange={(event, selectedDate) => {
                setShowEndPicker(false);
                if (selectedDate) setEndTime(selectedDate);
              }}
            />
          )}
        </>
      )}

      <Text style={styles.label}>Photo</Text>
      <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
        <Text style={{ color: "#fff", fontWeight: "bold" }}>{image ? "Change Photo" : "Add Photo"}</Text>
      </TouchableOpacity>
      {image && <Image source={{ uri: image }} style={styles.imagePreview} />}

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveText}>Update Item</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f2f4f8", paddingHorizontal: 20, paddingTop: 50 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  headerTitle: { fontSize: 20, fontWeight: "bold", marginLeft: 12 },
  label: { fontWeight: "bold", marginTop: 15, marginBottom: 8 },
  input: { backgroundColor: "#fff", padding: 12, borderRadius: 10 },
  pickerContainer: { backgroundColor: "#fff", borderRadius: 10, marginBottom: 10 },
  daysContainer: { flexDirection: "row", flexWrap: "wrap" },
  dayButton: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: "#fff", marginRight: 10, marginBottom: 10 },
  selectedDay: { backgroundColor: "#000" },
  timeRangeContainer: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginVertical: 10 },
  timeBox: { backgroundColor: "#fff", padding: 15, borderRadius: 12, minWidth: 100, alignItems: "center" },
  timeText: { fontSize: 18, fontWeight: "bold" },
  photoButton: { backgroundColor: "#000", padding: 12, borderRadius: 12, alignItems: "center", marginBottom: 10 },
  imagePreview: { width: "100%", height: 200, borderRadius: 12, marginBottom: 10 },
  saveButton: { backgroundColor: "#000", padding: 15, borderRadius: 12, marginTop: 20, alignItems: "center", marginBottom: 40 },
  saveText: { color: "#fff", fontWeight: "bold" },
});