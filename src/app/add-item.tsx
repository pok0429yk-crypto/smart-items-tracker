import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Image, Alert } from "react-native";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db, storage, auth } from "../firebase";



const uploadImageAsync = async (uri) => {
  if (!uri) return null;

  const response = await fetch(uri);
  const blob = await response.blob();

  const filename = uri.substring(uri.lastIndexOf("/") + 1);
  const storageRef = ref(storage, `images/${filename}`);

  await uploadBytes(storageRef, blob);
  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
};

export default function AddItem() {
  const router = useRouter();

  const [itemName, setItemName] = useState("");
  const [selectedDevice, setSelectedDevice] = useState("No Device");
  const [notificationEnabled, setNotificationEnabled] = useState("No");
  const [selectedDays, setSelectedDays] = useState(["Everyday"]);

  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const [image, setImage] = useState(null);

  const days = [
    "Everyday",
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
    "Sun",
  ];

  const formatTime = (date) => {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  // Day 多选逻辑
  const toggleDay = (day) => {
    if (day === "Everyday") {
      setSelectedDays(["Everyday"]);
      return;
    }

    let updatedDays = selectedDays.includes(day)
      ? selectedDays.filter((d) => d !== day)
      : [...selectedDays.filter((d) => d !== "Everyday"), day];

    if (updatedDays.length === 0) {
      updatedDays = ["Everyday"];
    }

    setSelectedDays(updatedDays);
  };

  // 选择照片
  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission denied", "Cannot access gallery");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };


const handleSave = async () => {
  if (!itemName) {
    Alert.alert("Error", "Please enter item name");
    return;
  }

  if (notificationEnabled === "Yes" && endTime <= startTime) {
    Alert.alert("Error", "End time must be later than start time");
    return;
  }

  if (!auth.currentUser) {
    Alert.alert("Error", "You must be logged in to save item");
    return;
  }

  try {
    // 上传图片
    const imageUrl = await uploadImageAsync(image);

    // 保存到 Firestore
    await addDoc(collection(db, "items"), {
      ownerId: auth.currentUser.uid,
      name: itemName,
      device: selectedDevice,
      notification: notificationEnabled,
      days: selectedDays,
      startTime: Timestamp.fromDate(startTime),
      endTime: Timestamp.fromDate(endTime),
      image: imageUrl || null,
      createdAt: Timestamp.now(),
    });

    Alert.alert("Success", "Item saved successfully!");
    router.back();
  } catch (error) {
    console.log("Error saving item:", error);
    Alert.alert("Error", "Failed to save item");
  }
};

  return (
    <ScrollView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Item</Text>
      </View>

      {/* ITEM NAME */}
      <Text style={styles.label}>Item Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter item name"
        value={itemName}
        onChangeText={setItemName}
      />

      {/* DEVICE */}
      <Text style={styles.label}>Select Device</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedDevice}
          onValueChange={(itemValue) => setSelectedDevice(itemValue)}
        >
          <Picker.Item label="No Device" value="No Device" />
        </Picker>
      </View>

      {/* NOTIFICATION */}
      <Text style={styles.label}>Notification</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={notificationEnabled}
          onValueChange={(itemValue) => setNotificationEnabled(itemValue)}
        >
          <Picker.Item label="No" value="No" />
          <Picker.Item label="Yes" value="Yes" />
        </Picker>
      </View>

      {/* DAY & TIME - 仅当 Notification = Yes */}
      {notificationEnabled === "Yes" && (
        <>
          {/* DAY 多选 */}
          <Text style={styles.label}>Select Days</Text>
          <View style={styles.daysContainer}>
            {days.map((day) => {
              const isSelected = selectedDays.includes(day);
              return (
                <TouchableOpacity
                  key={day}
                  style={[styles.dayButton, isSelected && styles.selectedDay]}
                  onPress={() => toggleDay(day)}
                >
                  <Text style={{ color: isSelected ? "#fff" : "#000" }}>
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* TIME RANGE */}
          <Text style={styles.label}>Time Range</Text>
          <View style={styles.timeRangeContainer}>
            <TouchableOpacity
              style={styles.timeBox}
              onPress={() => setShowStartPicker(true)}
            >
              <Text style={styles.timeText}>{formatTime(startTime)}</Text>
            </TouchableOpacity>

            <Text style={{ marginHorizontal: 10 }}>-</Text>

            <TouchableOpacity
              style={styles.timeBox}
              onPress={() => setShowEndPicker(true)}
            >
              <Text style={styles.timeText}>{formatTime(endTime)}</Text>
            </TouchableOpacity>
          </View>

          {showStartPicker && (
            <DateTimePicker
              value={startTime}
              mode="time"
              is24Hour={true}
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
              is24Hour={true}
              display="spinner"
              onChange={(event, selectedDate) => {
                setShowEndPicker(false);
                if (selectedDate) setEndTime(selectedDate);
              }}
            />
          )}
        </>
      )}

      {/* PHOTO */}
      <Text style={styles.label}>Photo</Text>
      <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
        <Text style={{ color: "#fff", fontWeight: "bold" }}>
          {image ? "Change Photo" : "Add Photo"}
        </Text>
      </TouchableOpacity>
      {image && (
        <Image source={{ uri: image }} style={styles.imagePreview} />
      )}

      {/* SAVE */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveText}>Save Item</Text>
      </TouchableOpacity>
    </ScrollView>
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
