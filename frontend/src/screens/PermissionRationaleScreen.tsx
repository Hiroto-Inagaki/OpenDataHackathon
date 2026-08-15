import { Pressable, StyleSheet, Text, View } from "react-native";

interface PermissionRationaleScreenProps {
  onContinue: () => void;
  onCancel: () => void;
}

// 9.1: OSの位置情報権限要求の前に、利用目的を表示する。
export default function PermissionRationaleScreen({
  onContinue,
  onCancel,
}: PermissionRationaleScreenProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>位置情報の利用について</Text>
      <Text style={styles.body}>
        散歩中、現在地から目的地までの直線距離と方角を表示するために位置情報を利用します。
      </Text>
      <Text style={styles.body}>
        位置情報は距離・方角の計算にのみ使用し、サーバーへ送信したり保存したりすることはありません。
      </Text>

      <View style={styles.buttonGroup}>
        <Pressable style={styles.primaryButton} onPress={onContinue}>
          <Text style={styles.primaryButtonText}>位置情報を許可して続ける</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={onCancel}>
          <Text style={styles.secondaryButtonText}>戻る</Text>
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
