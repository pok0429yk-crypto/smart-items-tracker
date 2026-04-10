import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { db, auth } from "../firebase";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";

export default function ItemManagement() {
  const router = useRouter();
  const [item, setItem] = useState([]);

  // 获取数据
  const fetchItem = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const itemRef = collection(db, "user", user.uid, "item");
      const querySnapshot = await getDocs(itemRef);

      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setItem(data);
    } catch (error) {
      console.error("Error fetching item: ", error);
    }
  };

  useEffect(() => {
    fetchItem();
  }, []);

  // 删除
  const handleDelete = async (id) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      await deleteDoc(doc(db, "user", user.uid, "item", id));

      Toast.show({ type: "success", text1: "Item deleted", visibilityTime: 1500 });

      fetchItem();
    } catch (error) {
      console.error("Error deleting item: ", error);
      Toast.show({ type: "error", text1: "Failed to delete", visibilityTime: 1500 });
    }
  };

  // 时间格式化
  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate();
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemCard}>

      {/* 左边：图片 */}
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.image} />
      ) : (
        <View style={styles.noImage}>
          <Ionicons name="image-outline" size={30} color="#aaa" />
        </View>
      )}

      {/* 中间：内容 */}
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>

        {/* device */}
        <Text style={styles.itemSub}>
          Device: {item.device || "No Device"}
        </Text>

        {/* notification */}
        {item.notification === "Yes" && (
          <>
            <Text style={styles.itemSub}>
              Days: {item.days?.join(", ")}
            </Text>

            <Text style={styles.itemSub}>
              Time: {formatTime(item.startTime)} - {formatTime(item.endTime)}
            </Text>
          </>
        )}
      </View>

      {/* 右边按钮 */}
      <View style={styles.itemButtons}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() =>
            router.push({ pathname: "/edit-item", params: { id: item.id } })
          }
        >
          <Ionicons name="create-outline" size={22} color="#000" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => handleDelete(item.id)}
        >
          <Ionicons name="trash-outline" size={22} color="#000" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Item Management</Text>
      </View>

      {/* ADD BUTTON */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push("/add-item")}
      >
        <Ionicons name="add-circle-outline" size={22} color="#fff" />
        <Text style={styles.addText}>Add Item</Text>
      </TouchableOpacity>

      {/* LIST */}
      <FlatList
        data={item}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      />

      <Toast />
    </View>
  );
}

// ---------------- STYLE ----------------
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

  // 卡片
  itemCard: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    elevation: 2,
  },

  image: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 10,
  },

  noImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  itemInfo: {
    flex: 1,
  },

  itemName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },

  itemSub: {
    fontSize: 12,
    color: "#666",
  },

  itemButtons: {
    flexDirection: "row",
  },

  iconButton: {
    marginLeft: 10,
    padding: 6,
  },
});