// 目的地設定画面(4.1)の地図。react-native-webview(ネイティブ)とiframe(Web)の両方から
// 同じHTMLを読み込むことで、地図実装をプラットフォーム間で共通化する。
//
// 親 -> 地図: {"type":"setMarker","latitude":..,"longitude":..} でマーカーを設置・中心移動。
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
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var map = L.map('map').setView([${DEFAULT_CENTER.latitude}, ${DEFAULT_CENTER.longitude}], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    var marker = null;

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
    }

    document.addEventListener('message', handleMessage);
    window.addEventListener('message', handleMessage);

    postToParent({ type: 'ready' });
  </script>
</body>
</html>`;
}
