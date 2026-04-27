import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

interface DetailData {
  id: string;
  name: string;
  data?: {
    color?: string;
    capacity?: string;
    screen_size?: string;
    generation?: string;
    price?: string;
    [key: string]: any;
  };
}

export default function DetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [data, setData] = useState<DetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const colorScheme = useColorScheme();

  // Default to ID "7" if no ID is provided
  const objectId = id || "7";

  useEffect(() => {
    fetchDetailData();
  }, [objectId]);

  const fetchDetailData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `https://api.restful-api.dev/objects/${objectId}`,
      );
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      const json = await response.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const textColor = Colors[colorScheme ?? "light"]?.text || Colors.light.text;
  const backgroundColor =
    Colors[colorScheme ?? "light"]?.background || Colors.light.background;

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <ActivityIndicator
          size="large"
          color={Colors[colorScheme ?? "light"].tint}
        />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <Text style={[styles.errorText, { color: textColor }]}>
          Error: {error}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor }]}>
      {data && (
        <View style={styles.content}>
          <Text style={[styles.title, { color: textColor }]}>{data.name}</Text>

          <View style={styles.section}>
            <Text style={[styles.label, { color: textColor }]}>Object ID</Text>
            <Text style={[styles.value, { color: textColor }]}>{data.id}</Text>
          </View>

          {data.data && Object.keys(data.data).length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>
                Details
              </Text>
              {Object.entries(data.data).map(([key, value]) => (
                <View key={key} style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: textColor }]}>
                    {key}:
                  </Text>
                  <Text style={[styles.detailValue, { color: textColor }]}>
                    {String(value)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  content: {
    paddingVertical: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 24,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    opacity: 0.6,
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: "500",
  },
  detailRow: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
    textTransform: "capitalize",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "400",
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
  },
});
