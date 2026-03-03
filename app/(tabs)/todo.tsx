import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";

import {
    Alert,
    FlatList,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const STORAGE_KEY = "TODOS_STORAGE_KEY";

export default function TodoScreen() {
  const [task, setTask] = useState("");
  const [tasks, setTasks] = useState<string[]>([]);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) setTasks(JSON.parse(saved));
    } catch (error) {
      console.log(error);
    }
  };

  const saveTasks = async (newTasks: string[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newTasks));
    } catch (error) {
      console.log(error);
    }
  };

  const addTask = () => {
    if (!task.trim()) return;

    const newTasks = [...tasks, task];
    setTasks(newTasks);
    saveTasks(newTasks);
    setTask("");
  };

  const deleteTask = (index: number) => {
    const newTasks = tasks.filter((_, i) => i !== index);
    setTasks(newTasks);
    saveTasks(newTasks);
  };

  const clearTasks = async () => {
    setTasks([]);
    await AsyncStorage.removeItem(STORAGE_KEY);
  };

  const confirmClearTasks = () => {
    if (Platform.OS === "web") {
      const confirmed = window.confirm(
        "Are you sure you want to delete all tasks?",
      );

      if (confirmed) clearTasks();

      return;
    }

    Alert.alert(
      "Delete All Tasks",
      "Are you sure you want to delete all tasks?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: clearTasks,
        },
      ],
    );
  };
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Todo List</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter task"
        value={task}
        onChangeText={setTask}
      />

      <TouchableOpacity style={styles.addButton} onPress={addTask}>
        <Text style={styles.addButtonText}>Add Task</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.clearButton} onPress={confirmClearTasks}>
        <Text style={styles.clearButtonText}>Clear All Tasks</Text>
      </TouchableOpacity>

      <FlatList
        data={tasks}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item, index }) => (
          <View style={styles.taskRow}>
            <Text style={styles.taskText}>• {item}</Text>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => deleteTask(index)}
            >
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    marginTop: 40,
  },

  title: {
    fontSize: 24,
    textAlign: "center",
    marginBottom: 20,
  },

  input: {
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
    borderRadius: 6,
  },

  addButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 15,
  },

  addButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },

  clearButton: {
    backgroundColor: "red",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 15,
  },

  clearButtonText: {
    color: "white",
    fontSize: 14,
  },

  deleteButton: {
    backgroundColor: "#6c757d",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 4,
  },

  deleteButtonText: {
    color: "white",
    fontSize: 12,
  },

  taskRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },

  taskText: {
    fontSize: 16,
    flex: 1,
  },
});
