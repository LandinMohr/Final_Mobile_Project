import { SQLiteDatabase } from "expo-sqlite";
import { Task } from "../types/task";

export function createTaskRepo(db: SQLiteDatabase) {
  return {
    // CREATE
    async create(title: string): Promise<Task> {
      const createdAt = new Date().toISOString();

      const result = await db.runAsync(
        "INSERT INTO tasks (title, completed, createdAt) VALUES (?, 0, ?)",
        [title, createdAt],
      );

      return {
        id: result.lastInsertRowId,
        title,
        completed: 0,
        createdAt,
      };
    },

    // READ ALL
    async all(): Promise<Task[]> {
      return db.getAllAsync<Task>(
        "SELECT * FROM tasks ORDER BY createdAt DESC",
      );
    },

    // READ BY ID
    async getById(id: number): Promise<Task | null> {
      return db.getFirstAsync<Task>("SELECT * FROM tasks WHERE id = ?", [id]);
    },

    // UPDATE TITLE
    async updateTitle(id: number, title: string): Promise<void> {
      await db.runAsync("UPDATE tasks SET title = ? WHERE id = ?", [title, id]);
    },

    // UPDATE COMPLETED
    async updateCompleted(id: number, value: 0 | 1): Promise<void> {
      await db.runAsync("UPDATE tasks SET completed = ? WHERE id = ?", [
        value,
        id,
      ]);
    },

    // DELETE
    async delete(id: number): Promise<void> {
      await db.runAsync("DELETE FROM tasks WHERE id = ?", [id]);
    },
  };
}
