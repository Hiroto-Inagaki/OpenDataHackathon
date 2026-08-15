import { Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";

interface PermissionErrorScreenProps {
  onRetry: () => void;
  onBack: () => void;
}

// 14.1: 位置情報権限拒否時の表示。
export default function PermissionErrorScreen({
  onRetry,
  onBack,
}: PermissionErrorScreenProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>位置情報の利用が許可されていません</Text>
      <Text style={styles.body}>
        このアプリは現在地から目的地までの距離と方角を表示するために、位置情報の利用許可が必要です。
      </Text>
      <Text style={styles.body}>
        {Platform.OS === "web"
          ? "ブラウザの設定からこのサイトの位置情報アクセスを許可してから、再試行してください。"
          : "端末の設定からこのアプリの位置情報アクセスを許可してから、再試行してください。"}
      </Text>

      <View style={styles.buttonGroup}>
        <Pressable style={styles.primaryButton} onPress={onRetry}>
          <Text style={styles.primaryButtonText}>再試行</Text>
        </Pressable>

        {Platform.OS !== "web" && (
          <Pressable
            style={styles.secondaryButton}
            onPress={() => Linking.openSettings()}
          >
            <Text style={styles.secondaryButtonText}>設定を開く</Text>
          </Pressable>
        )}

        <Pressable style={styles.secondaryButton} onPress={onBack}>
          <Text style={styles.secondaryButtonText}>目的地設定に戻る</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    padding: 24,
    justifyContent: "center",
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  body: {
    fontSize: 14,
    color: "#323f4b",
    lineHeight: 20,
  },
  buttonGroup: {
    marginTop: 20,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: "#1f2933",
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
    minHeight: 48,
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#c1c9d2",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    minHeight: 48,
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: "#1f2933",
    fontSize: 15,
    fontWeight: "600",
  },
});
