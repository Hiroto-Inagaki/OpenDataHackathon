import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import type { LandmarkDiscoveryContent, LandmarkSource } from "../types";

interface LandmarkInfoModalProps {
  visible: boolean;
  content: LandmarkDiscoveryContent | null;
  source: LandmarkSource | null;
  onClose: () => void;
}

/**
 * FR-LD-07で発見後に表示するランドマーク情報。OQ-LD-01(表示する情報の種類と量)は
 * 未決事項のため、詳細表示自体を交換可能な単一コンポーネントに閉じ込めておく(14章)。
 * 11.5: 出典表記(データセット名・公開者・ライセンス)を必ず確認できるようにする。
 */
export default function LandmarkInfoModal({
  visible,
  content,
  source,
  onClose,
}: LandmarkInfoModalProps) {
  if (!content || !source) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <ScrollView>
            <Text style={styles.discoveredLabel}>発見しました</Text>
            <Text style={styles.name}>{content.name}</Text>

            {content.imageUrl && (
              <Image source={{ uri: content.imageUrl }} style={styles.image} />
            )}

            {content.summary && (
              <Text style={styles.summary}>{content.summary}</Text>
            )}

            {content.attributes &&
              Object.entries(content.attributes).map(([key, value]) => (
                <View key={key} style={styles.attributeRow}>
                  <Text style={styles.attributeKey}>{key}</Text>
                  <Text style={styles.attributeValue}>{value}</Text>
                </View>
              ))}

            <View style={styles.sourceSection}>
              <Text style={styles.sourceTitle}>出典</Text>
              <Text style={styles.sourceLine}>
                {source.datasetName}（{source.publisher}）
              </Text>
              <Text style={styles.sourceLine}>ライセンス: {source.license}</Text>
              {source.attribution && (
                <Text style={styles.sourceLine}>{source.attribution}</Text>
              )}
            </View>
          </ScrollView>

          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>閉じる</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
  },
  discoveredLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#c76e00",
    marginBottom: 4,
  },
  name: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1f2933",
    marginBottom: 12,
  },
  image: {
    width: "100%",
    height: 160,
    borderRadius: 10,
    marginBottom: 12,
    backgroundColor: "#e4e7eb",
  },
  summary: {
    fontSize: 15,
    color: "#323f4b",
    lineHeight: 22,
    marginBottom: 12,
  },
  attributeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: "#e4e7eb",
  },
  attributeKey: {
    fontSize: 13,
    color: "#52606d",
  },
  attributeValue: {
    fontSize: 13,
    color: "#1f2933",
    fontWeight: "600",
  },
  sourceSection: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e4e7eb",
  },
  sourceTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#52606d",
    marginBottom: 4,
  },
  sourceLine: {
    fontSize: 12,
    color: "#7b8794",
    lineHeight: 18,
  },
  closeButton: {
    marginTop: 16,
    backgroundColor: "#1f2933",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    minHeight: 48,
    justifyContent: "center",
  },
  closeButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});
