import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { db } from "../firebase"; // <-- 引入 Firestore
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";

export default function ItemManagement() {
  const router = useRouter();
  const [items, setItems] = useState([]);

  // 获取 Firestore 数据
  const fetchItems = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "items"));
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setItems(data);
    } catch (error) {
      console.error("Error fetching items: ", error);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // 删除 item
  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "items", id));
      Toast.show({ type: "success", text1: "Item deleted", visibilityTime: 1500 });
      fetchItems(); // 重新刷新列表
    } catch (error) {
      console.error("Error deleting item: ", error);
      Toast.show({ type: "error", text1: "Failed to delete", visibilityTime: 1500 });
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemCard}>
      <Text style={styles.itemText}>{item.name}</Text>
      <View style={styles.itemButtons}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.push({pathname: "/edit-item", params:{id:item.id}})}
        >
          <Ionicons name="create-outline" size={22} color="#000000" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconButton} onPress={() => handleDelete(item.id)}>
          <Ionicons name="trash-outline" size={22} color="#000000" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Item Management</Text>
      </View>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push("/add-item")}
      >
        <Ionicons name="add-circle-outline" size={22} color="#fff" />
        <Text style={styles.addText}>Add Item</Text>
      </TouchableOpacity>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      />

      <Toast />
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
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 12,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#000000",
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
  itemCard: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    elevation: 2,
  },
  itemText: {
    fontSize: 16,
  },
  itemButtons: {
    flexDirection: "row",
  },
  iconButton: {
    marginLeft: 12,
    padding: 6,
  },
});
