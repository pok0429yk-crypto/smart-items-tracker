import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function Account() {
  const router = useRouter();

  const [name, setName] = useState("user");
  const [email, setEmail] = useState("user@gmail.com");
  const [password, setPassword] = useState("123456789");
  const [editingPassword, setEditingPassword] = useState(false);

  const handleSave = () => {
    Alert.alert("Saved", "Account information updated successfully");
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#333" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Account</Text>
      </View>

      {/* Name */}
      <Text style={styles.label}>Name</Text>
      <View style={styles.inputBox}>
        <TextInput
          value={name}
          onChangeText={setName}
          style={styles.input}
        />
      </View>

      {/* Email */}
      <Text style={styles.label}>Email</Text>
      <View style={styles.inputBox}>
        <TextInput
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          style={styles.input}
        />
      </View>

      {/* Password */}
      <Text style={styles.label}>Password</Text>
      <View style={styles.inputBox}>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!editingPassword}
          editable={editingPassword}
          style={styles.input}
        />
      </View>

      {/* Change Password */}
      <TouchableOpacity
        onPress={() => setEditingPassword(true)}
        style={{ marginTop: 5 }}
      >
        <Text style={{ color: "#000", fontWeight: "bold" }}>
          Change Password
        </Text>
      </TouchableOpacity>

      {/* Save Button */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveText}>Save</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f4f8",
    padding: 20,
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

  inputBox: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
  },

  input: {
    fontSize: 16,
  },

  saveButton: {
    backgroundColor: "#000",
    padding: 15,
    borderRadius: 12,
    marginTop: 30,
    alignItems: "center",
  },

  saveText: {
    color: "#fff",
    fontWeight: "bold",
  },
});