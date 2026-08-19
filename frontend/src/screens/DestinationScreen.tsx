import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import DestinationMap from "../components/DestinationMap";
import { GeocodeSearchError, searchDestinations } from "../lib/api";
import type { GeocodeResult } from "../lib/api";
import type { CurrentPosition, Destination } from "../types";

interface DestinationScreenProps {
  destination: Destination | null;
  currentPosition: CurrentPosition | null;
  onChangeDestination: (destination: Destination) => void;
  onStartWalk: () => void;
}

export default function DestinationScreen({
  destination,
  currentPosition,
  onChangeDestination,
  onStartWalk,
}: DestinationScreenProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const runSearch = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setIsSearching(true);
    setSearchError(null);
    try {
      const found = await searchDestinations(trimmed);
      setResults(found);
      setHasSearched(true);
    } catch (error) {
      setResults([]);
      setHasSearched(true);
      setSearchError(
        error instanceof GeocodeSearchError
          ? error.message
          : "検索中に不明なエラーが発生しました。",
      );
    } finally {
      setIsSearching(false);
    }
  }, [query]);

  const handleSelectResult = (result: GeocodeResult) => {
    onChangeDestination({
      destinationId: result.id,
      name: result.name,
      address: result.address,
      latitude: result.latitude,
      longitude: result.longitude,
    });
  };

  const handleMapPress = (position: { latitude: number; longitude: number }) => {
    onChangeDestination({
      destinationId: `map-${position.latitude.toFixed(6)}-${position.longitude.toFixed(6)}`,
      name: "地図で選択した地点",
      latitude: position.latitude,
      longitude: position.longitude,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchSection}>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.input}
            placeholder="地点名・住所で検索"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={runSearch}
            returnKeyType="search"
          />
          <Pressable
            style={styles.searchButton}
            onPress={runSearch}
            disabled={isSearching}
          >
            {isSearching ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.searchButtonText}>検索</Text>
            )}
          </Pressable>
        </View>

        {searchError && <Text style={styles.errorText}>{searchError}</Text>}

        {hasSearched && !searchError && results.length === 0 && (
          <Text style={styles.hintText}>検索結果が見つかりませんでした。</Text>
        )}

        {results.length > 0 && (
          <FlatList
            style={styles.resultList}
            data={results}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable
                style={styles.resultItem}
                onPress={() => handleSelectResult(item)}
              >
                <Text style={styles.resultName}>{item.name}</Text>
                <Text style={styles.resultAddress}>{item.address}</Text>
              </Pressable>
            )}
          />
        )}
      </View>

      <View style={styles.mapSection}>
        <DestinationMap
          markerPosition={
            destination
              ? { latitude: destination.latitude, longitude: destination.longitude }
              : null
          }
          currentPosition={
            currentPosition
              ? {
                  latitude: currentPosition.latitude,
                  longitude: currentPosition.longitude,
                }
              : null
          }
          onMapPress={handleMapPress}
        />
      </View>

      <View style={styles.destinationSection}>
        {destination ? (
          <>
            <Text style={styles.destinationLabel}>目的地</Text>
            <Text style={styles.destinationName}>{destination.name}</Text>
            {destination.address && (
              <Text style={styles.destinationAddress}>
                {destination.address}
              </Text>
            )}
          </>
        ) : (
          <Text style={styles.hintText}>
            目的地が未設定です。検索するか地図をタップして選択してください。
          </Text>
        )}

        <Pressable
          style={[styles.startButton, !destination && styles.startButtonDisabled]}
          onPress={onStartWalk}
          disabled={!destination}
        >
          <Text style={styles.startButtonText}>散歩を開始</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  searchSection: {
    padding: 16,
    gap: 8,
  },
  searchRow: {
    flexDirection: "row",
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#c1c9d2",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: "#1f2933",
    borderRadius: 8,
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 72,
  },
  searchButtonText: {
    color: "#ffffff",
    fontWeight: "700",
  },
  resultList: {
    maxHeight: 180,
    borderWidth: 1,
    borderColor: "#e4e7eb",
    borderRadius: 8,
  },
  resultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e4e7eb",
  },
  resultName: {
    fontSize: 16,
    fontWeight: "600",
  },
  resultAddress: {
    fontSize: 13,
    color: "#52606d",
    marginTop: 2,
  },
  hintText: {
    fontSize: 14,
    color: "#52606d",
  },
  errorText: {
    fontSize: 14,
    color: "#b00020",
  },
  mapSection: {
    flex: 1,
    minHeight: 220,
  },
  destinationSection: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e4e7eb",
    gap: 4,
  },
  destinationLabel: {
    fontSize: 12,
    color: "#52606d",
  },
  destinationName: {
    fontSize: 18,
    fontWeight: "700",
  },
  destinationAddress: {
    fontSize: 13,
    color: "#52606d",
  },
  startButton: {
    marginTop: 12,
    backgroundColor: "#2e7d32",
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
    minHeight: 48,
    justifyContent: "center",
  },
  startButtonDisabled: {
    backgroundColor: "#a7c9ab",
  },
  startButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});
