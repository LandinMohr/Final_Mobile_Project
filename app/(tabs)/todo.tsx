import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";

import {
  Alert,
  FlatList,
  Modal,
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

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingText, setEditingText] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

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
    const trimmed = task.trim();
    if (!trimmed) return;

    const newTasks = [...tasks, trimmed];
    setTasks(newTasks);
    saveTasks(newTasks);
    setTask("");
  };

  const deleteTask = (index: number) => {
    const newTasks = tasks.filter((_, i) => i !== index);
    setTasks(newTasks);
    saveTasks(newTasks);
  };

  const editTask = (index: number) => {
    setEditingIndex(index);
    setEditingText(tasks[index]);
    setEditModalVisible(true);
  };

  const saveEditedTask = () => {
    if (!editingText.trim() || editingIndex === null) return;

    const updatedTasks = [...tasks];
    updatedTasks[editingIndex] = editingText.trim();

    setTasks(updatedTasks);
    saveTasks(updatedTasks);

    setEditModalVisible(false);
    setEditingIndex(null);
  };

  const clearTasks = async () => {
    setTasks([]);
    await AsyncStorage.removeItem(STORAGE_KEY);
  };

  const confirmClearTasks = () => {
    if (Platform.OS === "web") {
      if (window.confirm("Are you sure you want to delete all tasks?")) {
        clearTasks();
      }
      return;
    }

    Alert.alert(
      "Delete All Tasks",
      "Are you sure you want to delete all tasks?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: clearTasks },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Todo List</Text>

      <Text style={styles.countText}>Total Tasks: {tasks.length}</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter task"
        value={task}
        onChangeText={setTask}
        onSubmitEditing={addTask}
        returnKeyType="done"
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

            <View style={{ flexDirection: "row" }}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => editTask(index)}
              >
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => deleteTask(index)}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Edit Task</Text>

            <TextInput
              style={styles.modalInput}
              value={editingText}
              onChangeText={setEditingText}
              placeholder="Edit task"
            />

            <View style={{ flexDirection: "row", marginTop: 15 }}>
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={saveEditedTask}
              >
                <Text style={{ color: "white" }}>Save</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={{ color: "white" }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    marginBottom: 10,
  },

  countText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 15,
    fontWeight: "500",
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

  editButton: {
    backgroundColor: "#FFA500",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginRight: 6,
  },

  editButtonText: {
    color: "white",
    fontSize: 12,
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

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalContainer: {
    width: "80%",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
    textAlign: "center",
  },

  modalInput: {
    borderWidth: 1,
    padding: 10,
    borderRadius: 6,
  },

  modalSaveButton: {
    flex: 1,
    backgroundColor: "#007AFF",
    padding: 10,
    marginRight: 5,
    borderRadius: 6,
    alignItems: "center",
  },

  modalCancelButton: {
    flex: 1,
    backgroundColor: "red",
    padding: 10,
    marginLeft: 5,
    borderRadius: 6,
    alignItems: "center",
  },
});
