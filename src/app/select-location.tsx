import React, { useEffect, useState } from "react";
import { View, Button } from "react-native";
import MapView, { Marker, LatLng, Region } from "react-native-maps";
import * as Location from "expo-location";
import { useRouter } from "expo-router";

export default function SelectLocation() {
  const router = useRouter();

  const [region, setRegion] = useState<Region | null>(null);
  const [marker, setMarker] = useState<LatLng | null>(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      let loc = await Location.getCurrentPositionAsync({});
      setRegion({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    })();
  }, []);

  const confirmLocation = () => {
    if (!marker) return;

    router.push({
      pathname: "/add-safezone",
      params: {
        lat: marker.latitude,
        lng: marker.longitude,
      },
    });
  };

  if (!region) return null;

  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={{ flex: 1 }}
        initialRegion={region}
        onPress={(e) => setMarker(e.nativeEvent.coordinate)}
      >
        {marker && <Marker coordinate={marker} />}
      </MapView>

      <Button title="Confirm Location" onPress={confirmLocation} />
    </View>
  );
}