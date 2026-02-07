import React, { useState, useCallback, useMemo, memo } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Alert, StyleSheet } from "react-native";
import { useStore, useLocalRowIds, useRow, useDelRowCallback, useAddRowCallback } from "tinybase/ui-react";
import { Trash, Plus, ListChecks, CaretDown, CaretRight } from "phosphor-react-native";

// OffloadList is the most reused template - it powers ~10 different published lists
// (Party Wizard, Dinner Party, Away, Weekend Plans, Sweet Dreams, Hi DIY, Day Planner, etc.)
// It adapts based on list metadata (name, purpose, systemPrompt)

const OffloadItem = memo(({ id }: { id: string }) => {
  const itemData = useRow("todos", id);
  const store = useStore();
  const deleteItem = useDelRowCallback("todos", id);
  if (!itemData) return null;
  const isDone = Boolean(itemData.done);
  return (
    <View style={[styles.item, { opacity: isDone ? 0.6 : 1 }]}>
      <Pressable onPress={() => store?.setCell("todos", id, "done", !isDone)}>
        <View style={[styles.cbox, isDone && styles.cboxDone]}>{isDone ? <Text style={styles.chk}>✓</Text> : null}</View>
      </Pressable>
      <Text style={styles.emoji}>{String(itemData.emoji || "📋")}</Text>
      <View style={styles.itemContent}>
        <Text style={[styles.itemText, isDone && styles.strike]}>{String(itemData.text || "")}</Text>
        {itemData.notes ? <Text style={styles.notes} numberOfLines={2}>{String(itemData.notes)}</Text> : null}
      </View>
      <Pressable onPress={() => Alert.alert("Delete", "Remove?", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: deleteItem }])}><Trash size={16} color="#E53E3E" /></Pressable>
    </View>
  );
});

export default function OffloadList({ listId }: { listId: string }) {
  const [newItem, setNewItem] = useState("");
  const [selectedCat, setSelectedCat] = useState("");
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({});
  const store = useStore();
  const todoIds = useLocalRowIds("todoList", listId) || [];
  const listData = useRow("lists", listId);

  // Dynamically discover categories from the data
  const { categorized, categoryNames } = useMemo(() => {
    const g: Record<string, string[]> = {};
    todoIds.forEach((id) => {
      const c = String(store?.getCell("todos", id, "category") || "General");
      if (!g[c]) g[c] = [];
      g[c].push(id);
    });
    return { categorized: g, categoryNames: Object.keys(g).sort() };
  }, [todoIds, store]);

  const doneCount = useMemo(() => { let c = 0; todoIds.forEach((id) => { if (store?.getCell("todos", id, "done")) c++; }); return c; }, [todoIds, store]);
  const progressPct = todoIds.length > 0 ? Math.round((doneCount / todoIds.length) * 100) : 0;

  const addItem = useAddRowCallback("todos", (text: string) => ({ text: text.trim(), category: selectedCat || "General", done: false, list: listId, notes: "", emoji: "📋" }), [listId, selectedCat]);
  const handleAdd = useCallback(() => { if (newItem.trim()) { addItem(newItem); setNewItem(""); } }, [addItem, newItem]);

  return (
    <ScrollView style={styles.container}><View style={styles.content}>
      <View style={styles.header}>
        <ListChecks size={32} color="#3182CE" weight="fill" />
        <View style={styles.headerInfo}>
          <Text style={styles.title}>{String(listData?.name || "Offload List")}</Text>
          {listData?.purpose ? <Text style={styles.subtitle} numberOfLines={2}>{String(listData.purpose)}</Text> : null}
        </View>
        {todoIds.length > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{doneCount}/{todoIds.length}</Text></View>}
      </View>

      {todoIds.length > 0 && <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${progressPct}%` }]} /></View>}

      <View style={styles.addSection}>
        {categoryNames.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.catRow}>
              {categoryNames.map((name) => (
                <Pressable key={name} onPress={() => setSelectedCat(name)} style={[styles.catChip, selectedCat === name && styles.catChipSel]}>
                  <Text style={[styles.catChipText, selectedCat === name && styles.catChipTextSel]}>{name}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        )}
        <TextInput style={styles.catInput} placeholder="Category (optional)" value={selectedCat} onChangeText={setSelectedCat} placeholderTextColor="#A0AEC0" />
        <View style={styles.addRow}>
          <TextInput style={styles.addInput} placeholder="Add item..." value={newItem} onChangeText={setNewItem} onSubmitEditing={handleAdd} placeholderTextColor="#A0AEC0" returnKeyType="done" />
          <Pressable onPress={handleAdd} style={styles.addBtn}><Plus size={18} color="#FFF" weight="bold" /></Pressable>
        </View>
      </View>

      {categoryNames.map((cat) => {
        const items = categorized[cat] || [];
        if (!items.length) return null;
        const isOpen = openCats[cat] !== false;
        return (
          <View key={cat} style={styles.section}>
            <Pressable onPress={() => setOpenCats((p) => ({ ...p, [cat]: !isOpen }))} style={styles.secH}>
              <Text style={styles.secN}>{cat}</Text>
              <View style={styles.secM}><Text style={styles.secC}>{items.length}</Text>{isOpen ? <CaretDown size={14} color="#718096" /> : <CaretRight size={14} color="#718096" />}</View>
            </Pressable>
            {isOpen && <View style={styles.secI}>{items.map((id) => <OffloadItem key={id} id={id} />)}</View>}
          </View>
        );
      })}

      {todoIds.length === 0 && <View style={styles.empty}><Text style={styles.emptyE}>📋</Text><Text style={styles.emptyT}>Ready to plan</Text><Text style={styles.emptyS}>{String(listData?.purpose || "Add items to get started")}</Text></View>}
    </View></ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EBF8FF" }, content: { padding: 16 },
  header: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 12 }, headerInfo: { flex: 1 }, title: { fontSize: 22, fontWeight: "bold", color: "#2B6CB0" }, subtitle: { fontSize: 12, color: "#4299E1", marginTop: 2 },
  badge: { backgroundColor: "#BEE3F8", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }, badgeText: { fontSize: 13, fontWeight: "600", color: "#2B6CB0" },
  progressTrack: { height: 6, backgroundColor: "#EDF2F7", borderRadius: 3, marginBottom: 16, overflow: "hidden" }, progressFill: { height: "100%", backgroundColor: "#4299E1", borderRadius: 3 },
  addSection: { backgroundColor: "#FFF", borderRadius: 12, padding: 12, marginBottom: 16, gap: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  catRow: { flexDirection: "row", gap: 6 }, catChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: "#EDF2F7", borderWidth: 1, borderColor: "#E2E8F0" }, catChipSel: { backgroundColor: "#BEE3F8", borderColor: "#4299E1" }, catChipText: { fontSize: 12, color: "#4A5568" }, catChipTextSel: { color: "#2B6CB0", fontWeight: "600" },
  catInput: { borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, color: "#2D3748" },
  addRow: { flexDirection: "row", gap: 8 }, addInput: { flex: 1, borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#2D3748" }, addBtn: { backgroundColor: "#4299E1", width: 40, height: 40, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  section: { marginBottom: 8 }, secH: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 10, borderRadius: 8, backgroundColor: "#EBF8FF" }, secN: { fontSize: 15, fontWeight: "bold", color: "#2B6CB0" }, secM: { flexDirection: "row", alignItems: "center", gap: 6 }, secC: { fontSize: 12, fontWeight: "600", color: "#4299E1" }, secI: { gap: 4, marginTop: 4 },
  item: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", borderRadius: 8, padding: 10, gap: 8 },
  cbox: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: "#4299E1", alignItems: "center", justifyContent: "center" }, cboxDone: { backgroundColor: "#4299E1" }, chk: { color: "#FFF", fontSize: 14, fontWeight: "bold" },
  emoji: { fontSize: 16 }, itemContent: { flex: 1 }, itemText: { fontSize: 14, fontWeight: "500", color: "#2D3748" }, strike: { textDecorationLine: "line-through", color: "#A0AEC0" }, notes: { fontSize: 11, color: "#718096", marginTop: 2, fontStyle: "italic" },
  empty: { alignItems: "center", paddingVertical: 40, gap: 8 }, emptyE: { fontSize: 48 }, emptyT: { fontSize: 18, fontWeight: "600", color: "#2B6CB0" }, emptyS: { fontSize: 14, color: "#718096", textAlign: "center", maxWidth: 280 },
});
