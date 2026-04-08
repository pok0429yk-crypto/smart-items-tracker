import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import { Audio } from "expo-av";

export default function RingManagement() {
  const router = useRouter();

  const [rings, setRings] = useState([
    { id: "1", name: "Default Ring", uri: null },
  ]);

  const [selectedRing, setSelectedRing] = useState(null);
  const [sound, setSound] = useState(null);

  // 播放铃声
  const playSound = async (uri) => {
    if (!uri) return;
    const { sound } = await Audio.Sound.createAsync({ uri });
    setSound(sound);
    await sound.playAsync();
  };

  useEffect(() => {
    return sound ? () => sound.unloadAsync() : undefined;
  }, [sound]);

  // 添加铃声
  const handleAddRing = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "audio/*",
    });
    if (!result.canceled) {
      const newRing = {
        id: Date.now().toString(),
        name: result.assets[0].name,
        uri: result.assets[0].uri,
      };
      setRings([...rings, newRing]);
    }
  };

  // 删除选中铃声
  const handleDeleteSelected = () => {
    if (!selectedRing) return;
    if (selectedRing === "1") {
      Alert.alert("Default ring cannot be deleted");
      return;
    }
    Alert.alert("Delete Ring", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          setRings(rings.filter((r) => r.id !== selectedRing));
          setSelectedRing(null); // 删除后取消选中
        },
      },
    ]);
  };

  const renderRing = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.ringCard,
        selectedRing === item.id && styles.selectedCard,
      ]}
      onPress={() => setSelectedRing(item.id)}
      onLongPress={() => setSelectedRing(item.id)}
    >
      <Text style={styles.ringText}>{item.name}</Text>

      <View style={styles.ringButtons}>
        {item.uri && (
          <TouchableOpacity onPress={() => playSound(item.uri)}>
            <Ionicons name="play-circle-outline" size={22} color="#000" />
          </TouchableOpacity>
        )}
        {selectedRing === item.id && (
          <Ionicons
            name="checkmark-circle"
            size={22}
            color="green"
            style={{ marginLeft: 12 }}
          />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ring</Text>
        <View style={{ width: 24 }} /> {/* 占位 */}
      </View>

      {/* Add Ring */}
      <TouchableOpacity style={styles.addButton} onPress={handleAddRing}>
        <Ionicons name="add-circle-outline" size={22} color="#fff" />
        <Text style={styles.addText}>Add Ring</Text>
      </TouchableOpacity>

      {/* Ring List */}
      <FlatList
        data={rings}
        keyExtractor={(item) => item.id}
        renderItem={renderRing}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      />

      {/* Delete Button（长按选择后显示） */}
      {selectedRing && selectedRing !== "1" && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDeleteSelected}
        >
          <Ionicons name="trash-outline" size={22} color="#fff" />
          <Text style={styles.deleteText}>Delete Selected Ring</Text>
        </TouchableOpacity>
      )}
    </View>
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
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
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
  ringCard: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    elevation: 2,
  },
  selectedCard: {
    borderColor: "#000",
    borderWidth: 2,
  },
  ringText: {
    fontSize: 16,
  },
  ringButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  deleteButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "red",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderRadius: 12,
  },
  deleteText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 8,
  },
});