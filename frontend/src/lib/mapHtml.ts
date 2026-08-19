// 目的地設定画面(4.1)の地図。react-native-webview(ネイティブ)とiframe(Web)の両方から
// 同じHTMLを読み込むことで、地図実装をプラットフォーム間で共通化する。
//
// 親 -> 地図: {"type":"setMarker","latitude":..,"longitude":..} でマーカーを設置・中心移動。
// 親 -> 地図: {"type":"setCurrentLocation","latitude":..,"longitude":..} で現在地マーカーを更新
//   (目的地未選択時に限り、初回のみ地図の中心を現在地に移動)。
// 親 -> 地図: {"type":"recenterToCurrentLocation"} で地図の中心を現在地マーカーの位置に移動。
// 地図 -> 親: {"type":"mapClick","latitude":..,"longitude":..} でタップ地点を通知。

const DEFAULT_CENTER = { latitude: 35.681236, longitude: 139.767125 }; // 東京駅

export function buildMapHtml(): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; }
    /* 地図をシンプルに保つため、帰属表示を小さく控えめにする。 */
    .leaflet-control-attribution {
      font-size: 9px;
      background: rgba(255, 255, 255, 0.7);
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var map = L.map('map', { zoomControl: false }).setView(
      [${DEFAULT_CENTER.latitude}, ${DEFAULT_CENTER.longitude}],
      14
    );
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    // 道路名・POIラベルが少なく見やすいシンプルな地図(CARTO Positron)を使用する。
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
    }).addTo(map);

    var marker = null;
    var currentLocationMarker = null;
    var hasCenteredOnCurrentLocation = false;

    function postToParent(message) {
      var payload = JSON.stringify(message);
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(payload);
      } else if (window.parent) {
        window.parent.postMessage(payload, '*');
      }
    }

    function setMarker(lat, lng, recenter) {
      var latLng = [lat, lng];
      if (marker) {
        marker.setLatLng(latLng);
      } else {
        marker = L.marker(latLng).addTo(map);
      }
      if (recenter) {
        map.setView(latLng, 16);
      }
    }

    // 現在地は目的地ピンと区別できるよう、シンプルな青い点で表示する。
    function setCurrentLocationMarker(lat, lng) {
      var latLng = [lat, lng];
      if (currentLocationMarker) {
        currentLocationMarker.setLatLng(latLng);
      } else {
        currentLocationMarker = L.circleMarker(latLng, {
          radius: 8,
          color: '#ffffff',
          weight: 2,
          fillColor: '#1a73e8',
          fillOpacity: 1
        }).addTo(map);
      }
      // 目的地がまだ選択されていない場合のみ、初回取得時に現在地へ地図を寄せる。
      if (!hasCenteredOnCurrentLocation && !marker) {
        hasCenteredOnCurrentLocation = true;
        map.setView(latLng, 16);
      }
    }

    map.on('click', function (event) {
      var lat = event.latlng.lat;
      var lng = event.latlng.lng;
      setMarker(lat, lng, false);
      postToParent({ type: 'mapClick', latitude: lat, longitude: lng });
    });

    function handleMessage(event) {
      var data = event.data;
      if (typeof data !== 'string') return;
      var message;
      try {
        message = JSON.parse(data);
      } catch (e) {
        return;
      }
      if (message.type === 'setMarker') {
        setMarker(message.latitude, message.longitude, true);
      }
      if (message.type === 'setCurrentLocation') {
        setCurrentLocationMarker(message.latitude, message.longitude);
      }
      if (message.type === 'recenterToCurrentLocation') {
        if (currentLocationMarker) {
          map.setView(currentLocationMarker.getLatLng(), 16);
        }
      }
    }

    document.addEventListener('message', handleMessage);
    window.addEventListener('message', handleMessage);

    postToParent({ type: 'ready' });
  </script>
</body>
</html>`;
}
