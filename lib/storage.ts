import AsyncStorage from "@react-native-async-storage/async-storage";

export async function saveJSON<T>(key: string, value: T | null) {
  try {
    if (value === null) {
      await AsyncStorage.removeItem(key);
      return;
    }
    const s = JSON.stringify(value);
    await AsyncStorage.setItem(key, s);
  } catch (err) {
    console.warn("AsyncStorage save error", err);
    throw err;
  }
}

export async function loadJSON<T>(key: string): Promise<T | null> {
  try {
    const s = await AsyncStorage.getItem(key);
    if (!s) return null;
    return JSON.parse(s) as T;
  } catch (err) {
    console.warn("AsyncStorage load error", err);
    throw err;
  }
}
