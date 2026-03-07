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

import { MaterialIcons } from "@expo/vector-icons";
import ConfettiCannon from "react-native-confetti-cannon";

const STORAGE_KEY = "TODOS_STORAGE_KEY";

type Task = {
  text: string;
  completed: boolean;
};

export default function TodoScreen() {
  const [task, setTask] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingText, setEditingText] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

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

  const saveTasks = async (newTasks: Task[]) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newTasks));
  };

  const addTask = () => {
    const trimmed = task.trim();
    if (!trimmed) return;

    const newTasks = [...tasks, { text: trimmed, completed: false }];
    setTasks(newTasks);
    saveTasks(newTasks);
    setTask("");
  };

  const toggleComplete = (index: number) => {
    const updated = [...tasks];
    updated[index].completed = !updated[index].completed;

    setTasks(updated);
    saveTasks(updated);
  };

  const completeTask = (index: number) => {
    const newTasks = tasks.filter((_, i) => i !== index);

    setTasks(newTasks);
    saveTasks(newTasks);

    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2500);
  };

  const deleteTask = (index: number) => {
    const remove = () => {
      const newTasks = tasks.filter((_, i) => i !== index);
      setTasks(newTasks);
      saveTasks(newTasks);
    };

    if (Platform.OS === "web") {
      const confirmed = window.confirm("Delete this task?");
      if (confirmed) remove();
      return;
    }

    Alert.alert("Delete Task", "Are you sure you want to delete this task?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: remove },
    ]);
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

  const editTask = (index: number) => {
    setEditingIndex(index);
    setEditingText(tasks[index].text);
    setEditModalVisible(true);
  };

  const saveEditedTask = () => {
    if (!editingText.trim() || editingIndex === null) return;

    const updated = [...tasks];
    updated[editingIndex].text = editingText.trim();

    setTasks(updated);
    saveTasks(updated);

    setEditModalVisible(false);
    setEditingIndex(null);
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
      />

      <TouchableOpacity style={styles.addButton} onPress={addTask}>
        <Text style={styles.addButtonText}>Add Task</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.clearButton} onPress={confirmClearTasks}>
        <Text style={styles.clearButtonText}>Clear All Tasks</Text>
      </TouchableOpacity>

      {showConfetti && (
        <ConfettiCannon count={100} origin={{ x: 150, y: 0 }} fadeOut />
      )}

      <FlatList
        data={tasks}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item, index }) => (
          <View style={styles.taskRow}>
            <TouchableOpacity
              style={[
                styles.checkBox,
                item.completed && styles.checkBoxCompleted,
              ]}
              onPress={() => toggleComplete(index)}
            >
              {item.completed && <Text style={styles.checkMark}>✓</Text>}
            </TouchableOpacity>

            <Text
              style={[styles.taskText, item.completed && styles.completedText]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.text}
            </Text>

            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={styles.completeButton}
                onPress={() => completeTask(index)}
              >
                <Text style={styles.completeButtonText}>Complete</Text>
              </TouchableOpacity>

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
                <MaterialIcons name="delete" size={16} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

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

/* Styles */

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, marginTop: 40 },

  title: { fontSize: 24, textAlign: "center", marginBottom: 10 },

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

  addButtonText: { color: "white", fontSize: 14, fontWeight: "600" },

  clearButton: {
    backgroundColor: "red",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 15,
  },

  clearButtonText: { color: "white", fontSize: 14 },

  checkBox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: "#007AFF",
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  checkBoxCompleted: { backgroundColor: "#007AFF" },

  checkMark: { color: "white", fontWeight: "bold" },

  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    paddingVertical: 6,
  },

  taskText: { flexShrink: 1, fontSize: 16, paddingRight: 6 },

  completedText: { textDecorationLine: "line-through", color: "gray" },

  buttonGroup: { flexDirection: "row", alignItems: "center" },

  completeButton: {
    backgroundColor: "#28a745",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginLeft: 6,
  },

  completeButtonText: { color: "white", fontSize: 12 },

  editButton: {
    backgroundColor: "#FFA500",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginLeft: 6,
  },

  editButtonText: { color: "white", fontSize: 12 },

  deleteButton: {
    backgroundColor: "#6c757d",
    padding: 4,
    borderRadius: 4,
    marginLeft: 6,
    justifyContent: "center",
    alignItems: "center",
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

  modalInput: { borderWidth: 1, padding: 10, borderRadius: 6 },

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
