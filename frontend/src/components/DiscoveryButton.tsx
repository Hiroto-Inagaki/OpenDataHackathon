import { Pressable, StyleSheet, Text } from "react-native";

interface DiscoveryButtonProps {
  available: boolean;
  onPress: () => void;
}

/**
 * FR-LD-06の「？」ボタン。OQ-LD-06(非表示か無効表示か)は未決事項のため、
 * 暫定方針(状態としては利用不可を保持する)に従い、常に表示した上で無効表示にする。
 * 11.4: 色だけで状態を表現しないよう、ラベル文言自体を切り替える。
 */
export default function DiscoveryButton({
  available,
  onPress,
}: DiscoveryButtonProps) {
  return (
    <Pressable
      style={[styles.button, !available && styles.buttonDisabled]}
      onPress={onPress}
      disabled={!available}
      accessibilityRole="button"
      accessibilityLabel={
        available
          ? "寄り道スポットを発見する"
          : "寄り道スポットに近づくと発見できます"
      }
      accessibilityState={{ disabled: !available }}
    >
      <Text style={styles.mark}>？</Text>
      <Text style={styles.label}>
        {available ? "発見する" : "近づくと発見できます"}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 56,
    borderRadius: 14,
    backgroundColor: "#ffb703",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    gap: 2,
  },
  buttonDisabled: {
    backgroundColor: "#e4e7eb",
  },
  mark: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1f2933",
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1f2933",
  },
});
