import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function Profile() {
  const router = useRouter();

  const handleLogout = () => {
    // 以后可以放真正的 logout 逻辑
    console.log("Logout pressed");
    router.replace("/"); // 回到登录页
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#333" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>User</Text>
      </View>

      {/* Account */}
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push("/account")}
      >
        <Text style={styles.cardText}>Account</Text>
        <Ionicons name="chevron-forward" size={22} color="#333" />
      </TouchableOpacity>

      {/* Ring */}
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push("/ring")}
      >
        <Text style={styles.cardText}>Ring</Text>
        <Ionicons name="chevron-forward" size={22} color="#333" />
      </TouchableOpacity>

      {/* Logout Button */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Ionicons name="log-out-outline" size={20} color="#fff" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
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
    marginBottom: 25,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 12,
  },

  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    elevation: 2,
  },

  cardText: {
    fontSize: 16,
  },

  logoutButton: {
  backgroundColor: "#000",
  padding: 15,
  borderRadius: 12,
  marginTop: 40,
  alignItems: "center",
},

logoutText: {
  color: "#fff",
  fontWeight: "bold",
},

});