import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

const STORAGE_KEY = "TODOS_STORAGE_KEY";

export default function HomeScreen() {
  const [taskCount, setTaskCount] = useState(0);

  // Load task count whenever the screen gains focus
  useFocusEffect(
    useCallback(() => {
      loadTaskCount();
    }, []),
  );

  const loadTaskCount = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setTaskCount(parsed.length);
      } else {
        setTaskCount(0);
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Your Productivity App</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Current Task Summary</Text>
        <Text style={styles.taskCount}>
          You currently have {taskCount} task
          {taskCount !== 1 ? "s" : ""}.
        </Text>
      </View>

      <Text style={styles.infoText}>
        Use the Todo tab to manage your tasks.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 25,
    justifyContent: "center",
  },

  title: {
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 30,
  },

  card: {
    backgroundColor: "#f2f2f2",
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    textAlign: "center",
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
    textAlign: "center",
  },

  taskCount: {
    fontSize: 16,
    textAlign: "center",
  },

  infoText: {
    textAlign: "center",
    fontSize: 14,
    color: "#555",
  },
});
