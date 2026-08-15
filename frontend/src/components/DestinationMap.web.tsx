import type { CSSProperties } from "react";
import { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";

import { buildMapHtml } from "../lib/mapHtml";

interface LatLng {
  latitude: number;
  longitude: number;
}

interface DestinationMapProps {
  markerPosition: LatLng | null;
  onMapPress: (position: LatLng) => void;
}

const MAP_HTML = buildMapHtml();

export default function DestinationMap({
  markerPosition,
  onMapPress,
}: DestinationMapProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const isReadyRef = useRef(false);
  const pendingMarkerRef = useRef<LatLng | null>(null);

  const postToMap = (message: Record<string, unknown>) => {
    iframeRef.current?.contentWindow?.postMessage(JSON.stringify(message), "*");
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

  return (
    <View style={styles.container}>
      <iframe
        ref={iframeRef}
        srcDoc={MAP_HTML}
        style={iframeStyle}
        title="destination-map"
      />
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
});
