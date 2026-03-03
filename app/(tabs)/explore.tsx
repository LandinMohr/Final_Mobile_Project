import React, { useEffect, useState } from "react";
import { FlatList, Text, View } from "react-native";

export default function ExploreScreen() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    fetch("https://api.restful-api.dev/objects")
      .then((res) => res.json())
      .then((json) => setData(json.slice(0, 10)))
      .catch(console.error);
  }, []);

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 20, marginBottom: 10 }}>Sample API Data</Text>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <Text>• {item.name}</Text>}
      />
    </View>
  );
}
