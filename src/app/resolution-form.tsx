import React from "react";
import { StyleSheet, Text, View, TouchableOpacity, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Icon } from "react-native-paper";

export default function ResolutionFormScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar barStyle="light-content" backgroundColor="#E05300" />
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/home"))}
          activeOpacity={0.85}
        >
          <Icon source="arrow-left" size={22} color="#E05300" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>संकल्प फॉर्म</Text>
        <View style={{ width: 38 }} />
      </View>

      <View style={styles.container}>
        <Icon source="file-document-edit-outline" size={54} color="#E05300" />
        <Text style={styles.title}>संकल्प फॉर्म (Resolution Form)</Text>
        <Text style={styles.subtitle}>
          या फॉर्मचे लॉजिक आणि फील्ड्स आपण पुरवल्यानुसार त्वरित अंमलात आणले जाईल.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8F7F4",
  },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFF7ED",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#1C1917",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1C1917",
    marginTop: 16,
  },
  subtitle: {
    fontSize: 13.5,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
});
