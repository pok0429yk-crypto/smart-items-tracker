import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function Home() {
  const router = useRouter();

  const MenuItem = ({ icon, title, route }) => (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={() => router.push(route)}
    >
      <View style={styles.leftSection}>
        <Ionicons name={icon} size={22} color="#333" />
        <Text style={styles.menuText}>{title}</Text>
      </View>

      <Ionicons name="chevron-forward" size={20} color="#999" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>

      {/* ✅ 只改这里：外层变成 TouchableOpacity */}
      <TouchableOpacity
        style={styles.userContainer}
        onPress={() => router.push("/profile")}
      >
        <Ionicons name="person-circle-outline" size={36} color="#333" />
        <Text style={styles.username}>User</Text>
      </TouchableOpacity>

      <MenuItem icon="cube-outline" title="Item Management" route="/item" />
      <MenuItem icon="shield-checkmark-outline" title="Safe Zone" route="/safezone" />
      <MenuItem icon="map-outline" title="Route History" route="/route" />
      <MenuItem icon="phone-portrait-outline" title="Device" route="/device" />
      <MenuItem icon="location-outline" title="Location" route="/location" />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f4f8",
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  userContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
  },
  username: {
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 12,
    color: "#333",
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 15,
    marginBottom: 50,
    elevation: 3,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuText: {
    fontSize: 16,
    marginLeft: 15,
  },
});