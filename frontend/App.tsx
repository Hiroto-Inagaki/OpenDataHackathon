import { useCallback, useEffect, useState } from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";

import { useCurrentLocation } from "./src/hooks/useCurrentLocation";
import { useHeading } from "./src/hooks/useHeading";
import DestinationScreen from "./src/screens/DestinationScreen";
import PermissionErrorScreen from "./src/screens/PermissionErrorScreen";
import PermissionRationaleScreen from "./src/screens/PermissionRationaleScreen";
import WalkScreen from "./src/screens/WalkScreen";
import type { Destination } from "./src/types";

// 画面状態は6章の画面遷移要件に対応し、散歩状態(7.2 status: 未開始/実行中/終了)は
// destination/permission-* <-> guidance の遷移によって表現する。
type Screen =
  | "destination"
  | "permission-rationale"
  | "permission-error"
  | "guidance";

export default function App() {
  const [screen, setScreen] = useState<Screen>("destination");
  const [destination, setDestination] = useState<Destination | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  // 寄り道の発見記録(9.3)に紐づける散歩セッションID。散歩の開始・終了と寿命を合わせる。
  const [walkSessionId, setWalkSessionId] = useState<string | null>(null);

  const location = useCurrentLocation();
  const heading = useHeading();

  // 目的地選択画面で現在地を地図上に表示するため、起動時に位置情報取得を開始する。
  // 権限が拒否された場合は location.error に反映されるのみで、画面遷移はブロックしない。
  useEffect(() => {
    location.requestAndStart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChangeDestination = useCallback((next: Destination) => {
    // FR-01-04: 新しい目的地を設定した場合、以前の目的地を上書きする(1件のみ保持)。
    setDestination(next);
  }, []);

  const handleRequestStart = useCallback(() => {
    if (!destination) return; // FR-01-05
    setScreen("permission-rationale");
  }, [destination]);

  const handleRationaleContinue = useCallback(async () => {
    // FR-02-01: 権限確認 -> 現在地取得 -> 状態を実行中に -> 開始日時取得 -> 案内画面へ遷移。
    const granted = await location.requestAndStart();
    if (!granted) {
      setScreen("permission-error");
      return;
    }
    heading.start();
    setStartedAt(Date.now());
    setWalkSessionId(`walk-${Date.now()}`);
    setScreen("guidance");
  }, [location, heading]);

  const handleEndWalk = useCallback(() => {
    // FR-02-04: 散歩状態を終了に変更し、案内画面を終了する。
    location.stop();
    heading.stop();
    setStartedAt(null);
    setWalkSessionId(null);
    setScreen("destination");
  }, [location, heading]);

  return (
    <SafeAreaView style={styles.root}>
      {screen === "destination" && (
        <DestinationScreen
          destination={destination}
          currentPosition={location.position}
          onChangeDestination={handleChangeDestination}
          onStartWalk={handleRequestStart}
        />
      )}

      {screen === "permission-rationale" && (
        <PermissionRationaleScreen
          onContinue={handleRationaleContinue}
          onCancel={() => setScreen("destination")}
        />
      )}

      {screen === "permission-error" && (
        <PermissionErrorScreen
          onRetry={handleRationaleContinue}
          onBack={() => setScreen("destination")}
        />
      )}

      {screen === "guidance" && destination && startedAt && walkSessionId && (
        <WalkScreen
          destination={destination}
          startedAt={startedAt}
          walkSessionId={walkSessionId}
          position={location.position}
          lastFixAt={location.lastFixAt}
          isWaitingForFix={location.isWaitingForFix}
          locationError={location.error}
          headingDegrees={heading.headingDegrees}
          onEndWalk={handleEndWalk}
        />
      )}

      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
});
