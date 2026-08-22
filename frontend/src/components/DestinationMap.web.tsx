import type { CSSProperties } from "react";
import { useEffect, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { buildMapHtml } from "../lib/mapHtml";

interface LatLng {
  latitude: number;
  longitude: number;
}

interface DestinationMapProps {
  markerPosition: LatLng | null;
  currentPosition: LatLng | null;
  onMapPress: (position: LatLng) => void;
}

const MAP_HTML = buildMapHtml();

export default function DestinationMap({
  markerPosition,
  currentPosition,
  onMapPress,
}: DestinationMapProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const isReadyRef = useRef(false);
  const pendingMarkerRef = useRef<LatLng | null>(null);
  const pendingCurrentPositionRef = useRef<LatLng | null>(null);

  const postToMap = (message: Record<string, unknown>) => {
    iframeRef.current?.contentWindow?.postMessage(JSON.stringify(message), "*");
  };

  const handleLocateMePress = () => {
    postToMap({ type: "recenterToCurrentLocation" });
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (typeof event.data !== "string") return;
      let message: { type: string; latitude?: number; longitude?: number };
      try {
        message = JSON.parse(event.data);
      } catch {
        return;
      }

      if (message.type === "ready") {
        isReadyRef.current = true;
        if (pendingMarkerRef.current) {
          postToMap({ type: "setMarker", ...pendingMarkerRef.current });
        }
        if (pendingCurrentPositionRef.current) {
          postToMap({
            type: "setCurrentLocation",
            ...pendingCurrentPositionRef.current,
          });
        }
        return;
      }

      if (
        message.type === "mapClick" &&
        typeof message.latitude === "number" &&
        typeof message.longitude === "number"
      ) {
        onMapPress({
          latitude: message.latitude,
          longitude: message.longitude,
        });
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onMapPress]);

  useEffect(() => {
    if (!markerPosition) return;
    if (isReadyRef.current) {
      postToMap({ type: "setMarker", ...markerPosition });
    } else {
      pendingMarkerRef.current = markerPosition;
    }
  }, [markerPosition]);

  useEffect(() => {
    if (!currentPosition) return;
    if (isReadyRef.current) {
      postToMap({ type: "setCurrentLocation", ...currentPosition });
    } else {
      pendingCurrentPositionRef.current = currentPosition;
    }
  }, [currentPosition]);

  return (
    <View style={styles.container}>
      <iframe
        ref={iframeRef}
        srcDoc={MAP_HTML}
        style={iframeStyle}
        title="destination-map"
      />
      <Pressable
        style={({ pressed }) => [
          styles.locateButton,
          !currentPosition && styles.locateButtonDisabled,
          pressed && styles.locateButtonPressed,
        ]}
        onPress={handleLocateMePress}
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
