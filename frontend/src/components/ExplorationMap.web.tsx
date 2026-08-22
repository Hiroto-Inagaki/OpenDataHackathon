import type { CSSProperties } from "react";
import { useEffect, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

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
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const isReadyRef = useRef(false);
  const mapHtmlRef = useRef(buildExplorationMapHtml(exploredRadiusMeters));

  const postToMap = (message: Record<string, unknown>) => {
    iframeRef.current?.contentWindow?.postMessage(JSON.stringify(message), "*");
  };

  const hintsPayload = () => ({
    type: "setHints",
    hints: hints.map((hint) => ({
      spotId: hint.spotId,
      latitude: hint.displayLocation?.latitude,
      longitude: hint.displayLocation?.longitude,
      discovered: hint.discovered,
    })),
  });

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (typeof event.data !== "string") return;
      let message: { type: string; spotId?: string };
      try {
        message = JSON.parse(event.data);
      } catch {
        return;
      }

      if (message.type === "ready") {
        isReadyRef.current = true;
        if (currentPosition) {
          postToMap({ type: "setCurrentLocation", ...currentPosition });
        }
        postToMap({ type: "setExploredPoints", points: exploredPoints });
        postToMap(hintsPayload());
        return;
      }

      if (message.type === "hintSelected" && message.spotId) {
        onSelectHint(message.spotId);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onSelectHint]);

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
    postToMap(hintsPayload());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hints]);

  return (
    <View style={styles.container}>
      <iframe
        ref={iframeRef}
        srcDoc={mapHtmlRef.current}
        style={iframeStyle}
        title="exploration-map"
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

const iframeStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  border: "none",
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
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
