import { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import WebView from "react-native-webview";

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
  const webViewRef = useRef<WebView>(null);
  const isReadyRef = useRef(false);
  const pendingMarkerRef = useRef<LatLng | null>(null);

  const postToMap = (message: Record<string, unknown>) => {
    webViewRef.current?.postMessage(JSON.stringify(message));
  };

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
      <WebView
        ref={webViewRef}
        originWhitelist={["*"]}
        source={{ html: MAP_HTML }}
        style={styles.webview}
        onMessage={(event) => {
          let message: {
            type: string;
            latitude?: number;
            longitude?: number;
          };
          try {
            message = JSON.parse(event.nativeEvent.data);
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
        }}
      />
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
});
