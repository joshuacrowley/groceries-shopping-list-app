import React, { useState, useCallback, useMemo, memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
} from "react-native";
import {
  useLocalRowIds,
  useRow,
  useDelRowCallback,
  useAddRowCallback,
  useStore,
} from "tinybase/ui-react";
import { Trash, Thermometer, Clock } from "phosphor-react-native";

const TemperatureReading = memo(({ id }: { id: string }) => {
  const readingData = useRow("todos", id);
  const store = useStore();
  const deleteReading = useDelRowCallback("todos", id);

  if (!readingData) return null;

  const handleTempChange = (text: string) => {
    const val = parseFloat(text);
    store?.setCell("todos", id, "number", isNaN(val) ? 37.0 : val);
  };

  const handleDateTimeChange = (text: string) => {
    store?.setCell("todos", id, "text", text);
  };

  const handleDelete = () => {
    Alert.alert("Delete", "Remove this reading?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: deleteReading },
    ]);
  };

  const temp = Number(readingData.number || 37);
  const isHigh = temp >= 38;
  const isVeryHigh = temp >= 39;

  return (
    <View
      style={[
        styles.readingCard,
        isVeryHigh
          ? styles.readingVeryHigh
          : isHigh
            ? styles.readingHigh
            : styles.readingNormal,
      ]}
    >
      <View style={styles.readingRow}>
        <View style={styles.tempSection}>
          <Thermometer
            size={22}
            color={isVeryHigh ? "#C53030" : isHigh ? "#DD6B20" : "#E53E3E"}
            weight="fill"
          />
          <TextInput
            style={[
              styles.tempInput,
              { color: isVeryHigh ? "#C53030" : isHigh ? "#DD6B20" : "#C53030" },
            ]}
            value={String(temp.toFixed(1))}
            onChangeText={handleTempChange}
            keyboardType="decimal-pad"
          />
          <Text style={styles.degreeText}>°C</Text>
        </View>
        <View style={styles.dateSection}>
          <Clock size={18} color="#E53E3E" />
          <TextInput
            style={styles.dateInput}
            value={String(readingData.text || "")}
            onChangeText={handleDateTimeChange}
            placeholder="Date & time"
            placeholderTextColor="#A0AEC0"
          />
        </View>
        <Pressable onPress={handleDelete} style={styles.iconBtn}>
          <Trash size={18} color="#E53E3E" weight="bold" />
        </Pressable>
      </View>
    </View>
  );
});
TemperatureReading.displayName = "TemperatureReading";

export default function ChildTemperatureTracker({
  listId,
}: {
  listId: string;
}) {
  const [newTemp, setNewTemp] = useState("37.0");
  const [newDateTime, setNewDateTime] = useState("");

  const readingIds = useLocalRowIds("todoList", listId) || [];
  const store = useStore();
  const listData = useRow("lists", listId);

  const addReading = useAddRowCallback(
    "todos",
    () => ({
      number: parseFloat(newTemp) || 37.0,
      text: newDateTime,
      list: listId,
      done: false,
    }),
    [listId, newTemp, newDateTime],
    undefined,
    (rowId) => {
      if (rowId) {
        setNewTemp("37.0");
        setNewDateTime("");
      }
    }
  );

  const handleAddClick = useCallback(() => {
    if (newDateTime.trim() !== "") {
      addReading();
    }
  }, [addReading, newDateTime]);

  const averageTemp = useMemo(() => {
    if (readingIds.length === 0) return 0;
    const sum = readingIds.reduce((acc, id) => {
      return acc + Number(store?.getCell("todos", id, "number") || 0);
    }, 0);
    return sum / readingIds.length;
  }, [readingIds, store]);

  const progressLabel = useMemo(() => {
    const count = readingIds.length;
    if (count === 0) return "Ready to track temps 🌡️";
    if (count <= 3) return "Monitoring... 📊";
    return "Good tracking! 👍";
  }, [readingIds.length]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Thermometer size={28} color="#C53030" weight="fill" />
            <View>
              <Text style={styles.listTitle}>
                {String(listData?.name || "Temperature Tracker")}
              </Text>
              <Text style={styles.progressLabel}>{progressLabel}</Text>
            </View>
          </View>
          <View style={styles.avgBadge}>
            <Text style={styles.avgBadgeText}>
              Avg: {averageTemp.toFixed(1)}°C
            </Text>
          </View>
        </View>

        {/* Add Reading */}
        <View style={styles.addRow}>
          <View style={styles.tempAddSection}>
            <Thermometer size={18} color="#C53030" />
            <TextInput
              style={styles.tempAddInput}
              value={newTemp}
              onChangeText={setNewTemp}
              keyboardType="decimal-pad"
              placeholder="37.0"
              placeholderTextColor="#A0AEC0"
            />
            <Text style={styles.degreeLabel}>°C</Text>
          </View>
          <TextInput
            style={styles.dateAddInput}
            value={newDateTime}
            onChangeText={setNewDateTime}
            placeholder="Date & time"
            placeholderTextColor="#A0AEC0"
          />
          <Pressable onPress={handleAddClick} style={styles.addButton}>
            <Text style={styles.addButtonText}>Add</Text>
          </Pressable>
        </View>

        {/* Readings */}
        {readingIds.map((id) => (
          <TemperatureReading key={id} id={id} />
        ))}

        {/* Empty State */}
        {readingIds.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🌡️</Text>
            <Text style={styles.emptyTitle}>No temperature readings yet</Text>
            <Text style={styles.emptySubtitle}>
              Add readings to monitor temperature over time
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF5F5" },
  content: { padding: 16 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  listTitle: { fontSize: 22, fontWeight: "bold", color: "#C53030" },
  progressLabel: {
    fontSize: 12,
    color: "#E53E3E",
    fontStyle: "italic",
    marginTop: 2,
  },
  avgBadge: {
    backgroundColor: "#FED7D7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  avgBadgeText: { fontSize: 14, fontWeight: "600", color: "#C53030" },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  tempAddSection: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FED7D7",
    paddingHorizontal: 8,
    gap: 4,
  },
  tempAddInput: {
    width: 50,
    paddingVertical: 8,
    fontSize: 15,
    color: "#C53030",
    fontWeight: "600",
  },
  degreeLabel: { fontSize: 14, color: "#C53030" },
  dateAddInput: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#2D3748",
    borderWidth: 1,
    borderColor: "#FED7D7",
  },
  addButton: {
    backgroundColor: "#E53E3E",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  addButtonText: { color: "#FFFFFF", fontWeight: "600", fontSize: 15 },
  readingCard: {
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  readingNormal: {
    backgroundColor: "#FFFFFF",
    borderColor: "#FED7D7",
  },
  readingHigh: {
    backgroundColor: "#FFFAF0",
    borderColor: "#FEEBC8",
  },
  readingVeryHigh: {
    backgroundColor: "#FFF5F5",
    borderColor: "#FED7D7",
  },
  readingRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
  },
  tempSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  tempInput: {
    width: 50,
    fontSize: 16,
    fontWeight: "bold",
  },
  degreeText: { fontSize: 14, color: "#C53030" },
  dateSection: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dateInput: {
    flex: 1,
    fontSize: 14,
    color: "#4A5568",
  },
  iconBtn: { padding: 6 },
  emptyState: { alignItems: "center", paddingVertical: 40, gap: 8 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#C53030" },
  emptySubtitle: {
    fontSize: 14,
    color: "#E53E3E",
    textAlign: "center",
    maxWidth: 280,
  },
});
