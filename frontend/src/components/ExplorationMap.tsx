import { useEffect, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import WebView from "react-native-webview";

import { buildExplorationMapHtml } from "../lib/explorationMapHtml";
import type { ExploredPoint } from "../lib/landmark/fog";
import type { LandmarkHint } from "../types";

interface LatLng {
  latitude: number;
  longitude: number;
}

interface ExplorationMapProps {
  currentPosition: LatLng | null;
  exploredPoints: ExploredPoint[];
  hints: LandmarkHint[];
  exploredRadiusMeters: number;
  onSelectHint: (spotId: string) => void;
}

export default function ExplorationMap({
  currentPosition,
  exploredPoints,
  hints,
  exploredRadiusMeters,
  onSelectHint,
}: ExplorationMapProps) {
  const webViewRef = useRef<WebView>(null);
  const isReadyRef = useRef(false);
  const mapHtmlRef = useRef(buildExplorationMapHtml(exploredRadiusMeters));

  const postToMap = (message: Record<string, unknown>) => {
    webViewRef.current?.postMessage(JSON.stringify(message));
  };

  useEffect(() => {
    if (!currentPosition || !isReadyRef.current) return;
    postToMap({ type: "setCurrentLocation", ...currentPosition });
  }, [currentPosition]);

  useEffect(() => {
    if (!isReadyRef.current) return;
    postToMap({ type: "setExploredPoints", points: exploredPoints });
  }, [exploredPoints]);

  useEffect(() => {
    if (!isReadyRef.current) return;
    postToMap({
      type: "setHints",
      hints: hints.map((hint) => ({
        spotId: hint.spotId,
        latitude: hint.displayLocation?.latitude,
        longitude: hint.displayLocation?.longitude,
      })),
    });
  }, [hints]);

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={["*"]}
        source={{ html: mapHtmlRef.current }}
        style={styles.webview}
        onMessage={(event) => {
          let message: { type: string; spotId?: string };
          try {
            message = JSON.parse(event.nativeEvent.data);
          } catch {
            return;
          }

          if (message.type === "ready") {
            isReadyRef.current = true;
            if (currentPosition) {
              postToMap({ type: "setCurrentLocation", ...currentPosition });
            }
            postToMap({ type: "setExploredPoints", points: exploredPoints });
            postToMap({
              type: "setHints",
              hints: hints.map((hint) => ({
                spotId: hint.spotId,
                latitude: hint.displayLocation?.latitude,
                longitude: hint.displayLocation?.longitude,
              })),
            });
            return;
          }

          if (message.type === "hintSelected" && message.spotId) {
            onSelectHint(message.spotId);
          }
        }}
      />
      <Pressable
        style={({ pressed }) => [
          styles.locateButton,
          !currentPosition && styles.locateButtonDisabled,
          pressed && styles.locateButtonPressed,
        ]}
        onPress={() => postToMap({ type: "recenterToCurrentLocation" })}
        disabled={!currentPosition}
        accessibilityLabel="現在地に移動"
      >
        <View style={styles.locateButtonRing}>
          <View style={styles.locateButtonDot} />
        </View>
        <Text style={styles.locateLabel}>現在地</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
  },
  webview: {
    flex: 1,
  },
  locateButton: {
    position: "absolute",
    left: 12,
    bottom: 12,
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 16,
    backgroundColor: "#ffffff",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  locateButtonPressed: {
    backgroundColor: "#f0f0f0",
  },
  locateButtonDisabled: {
    opacity: 0.5,
  },
  locateLabel: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  locateButtonRing: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#1a73e8",
    alignItems: "center",
    justifyContent: "center",
  },
  locateButtonDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#1a73e8",
  },
});
