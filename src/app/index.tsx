import React, { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Image } from "react-native";
import Toast from 'react-native-toast-message';

// Firebase
import { auth } from "../firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithCredential } from "firebase/auth";

// Expo Google Auth
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secure, setSecure] = useState(true);
  const router = useRouter();

  // Google 登录
  const [request, response, promptAsync] = Google.useAuthRequest({
  clientId: "96186402960-15asloch2hgq8q867m5r1cb7b6lh97kl.apps.googleusercontent.com", //  Web client ID
});

  useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.authentication;

      const credential = GoogleAuthProvider.credential(id_token);

      signInWithCredential(auth, credential)
        .then(() => {
          Toast.show({ type: "success", text1: "Google Login successful!" });
          router.push("/home");
        })
        .catch((error: any) => {
          Toast.show({ type: "error", text1: error.message });
        });
    }
  }, [response]);

  // Email/Password 注册
  const handleRegister = async () => {
    if (!email || !password) {
      return Toast.show({ type: 'error', text1: 'Please enter email and password' });
    }

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      Toast.show({ type: 'success', text1: 'Registration successful!' });
    } catch (error: any) {
      Toast.show({ type: 'error', text1: error.message });
    }
  };

  // Email/Password 登录
  const handleSignIn = async () => {
    if (!email || !password) {
      return Toast.show({ type: 'error', text1: 'Please enter email and password' });
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      Toast.show({ type: 'success', text1: 'Login successful!' });
      router.push("/home");
    } catch (error: any) {
      Toast.show({ type: 'error', text1: error.message });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Sign In</Text>

        {/* Email */}
        <TextInput
          style={styles.inputContainer}
          placeholder="Email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />

        {/* Password */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Password"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={secure}
          />
          <TouchableOpacity onPress={() => setSecure(!secure)}>
            <Ionicons name={secure ? "eye-off" : "eye"} size={22} color="#555" />
          </TouchableOpacity>
        </View>

        {/* Register */}
        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.text}>Register</Text>
        </TouchableOpacity>

        {/* Sign In */}
        <TouchableOpacity style={styles.button} onPress={handleSignIn}>
          <Text style={styles.text}>Sign In</Text>
        </TouchableOpacity>

        {/* OR */}
        <View style={styles.dividerContainer}>
          <View style={styles.line} />
          <Text style={styles.orText}>OR</Text>
          <View style={styles.line} />
        </View>

        {/* Google 登录 */}
        <TouchableOpacity style={styles.googleButton} onPress={() => promptAsync()}>
          <Image source={require("@/assets/images/google.png")} style={styles.googleIcon} />
          <Text style={styles.googleText}>Continue with Google</Text>
        </TouchableOpacity>
      </View>

      {/* Toast */}
      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f2f4f8", justifyContent: "center", alignItems: "center" },
  card: { width: "90%", padding: 25, borderRadius: 20 },
  title: { fontSize: 50, fontWeight: "bold", textAlign: "center", marginBottom: 50 },
  inputContainer: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#000", borderRadius: 12, paddingHorizontal: 12, marginBottom: 30 },
  passwordInput: { flex: 1, paddingVertical: 14 },
  button: { backgroundColor: "#000", padding: 15, borderRadius: 30, alignItems: "center", marginBottom: 30 },
  text: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  dividerContainer: { flexDirection: "row", alignItems: "center", marginBottom: 25 },
  line: { flex: 1, height: 1, backgroundColor: "#000" },
  orText: { marginHorizontal: 10, color: "#000" },
  googleButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#ddd", padding: 12, borderRadius: 30 },
  googleIcon: { width: 22, height: 22, marginRight: 10 },
  googleText: { fontWeight: "600" },
});