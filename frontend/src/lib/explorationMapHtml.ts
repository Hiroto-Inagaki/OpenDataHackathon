// FR-LD-02の探索マップ(霧のあるマップ)。DestinationMap(mapHtml.ts)と同じく、
// react-native-webview(ネイティブ)とiframe(Web)の両方から同じHTMLを読み込む。
//
// 親 -> 地図:
//   {"type":"setCurrentLocation","latitude":..,"longitude":..}
//   {"type":"setExploredPoints","points":[{"latitude":..,"longitude":..}, ...]}  踏破済み地点(全置換)
//   {"type":"setHints","hints":[{"spotId":..,"latitude":..,"longitude":..}, ...]}  気配マーカー(全置換)
//   {"type":"recenterToCurrentLocation"}
// 地図 -> 親:
//   {"type":"ready"}
//   {"type":"hintSelected","spotId":..}  「？」マーカー選択(FR-LD-04)
//
// 霧レイヤーは地図本体・現在地・気配表示から分離するため、専用のLeafletペイン(fogPane)に
// 描画するcanvasとして実装する(FR-LD-02: 霧レイヤーを他要素から分離)。

const DEFAULT_CENTER = { latitude: 35.681236, longitude: 139.767125 }; // 東京駅

export function buildExplorationMapHtml(exploredRadiusMeters: number): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; background: #0b1220; }
    .leaflet-control-attribution {
      font-size: 9px;
      background: rgba(255, 255, 255, 0.7);
    }
    .hint-marker {
      width: 34px;
      height: 34px;
      border-radius: 17px;
      background: #ffb703;
      border: 2px solid #ffffff;
      color: #1f2933;
      font-size: 18px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 1px 4px rgba(0,0,0,0.4);
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var EXPLORED_RADIUS_METERS = ${exploredRadiusMeters};

    var map = L.map('map', { zoomControl: false }).setView(
      [${DEFAULT_CENTER.latitude}, ${DEFAULT_CENTER.longitude}],
      17
    );
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
    }).addTo(map);

    // FR-LD-02: 霧レイヤーは専用ペインに分離し、タイル(z=200)より上・マーカー(z=600)より下に描く。
    map.createPane('fogPane');
    map.getPane('fogPane').style.zIndex = 350;
    map.getPane('fogPane').style.pointerEvents = 'none';
    var fogCanvas = L.DomUtil.create('canvas', '', map.getPane('fogPane'));
    var fogCtx = fogCanvas.getContext('2d');

    var exploredPoints = [];
    var hintMarkers = {};
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

    // メートル半径を、現在のズーム・緯度における画面上のピクセル半径に変換する。
    function metersToPixelRadius(latlng, meters) {
      var lat = latlng.lat;
      var metersPerDegreeLng = 111320 * Math.cos((lat * Math.PI) / 180);
      var dLng = metersPerDegreeLng > 0 ? meters / metersPerDegreeLng : 0;
      var centerPoint = map.latLngToLayerPoint(latlng);
      var edgePoint = map.latLngToLayerPoint([lat, latlng.lng + dLng]);
      return centerPoint.distanceTo(edgePoint);
    }

    function redrawFog() {
      var size = map.getSize();
      var topLeft = map.containerPointToLayerPoint([0, 0]);

      fogCanvas.width = size.x;
      fogCanvas.height = size.y;
      L.DomUtil.setPosition(fogCanvas, topLeft);

      fogCtx.clearRect(0, 0, size.x, size.y);
      fogCtx.fillStyle = 'rgba(15, 23, 42, 0.78)';
      fogCtx.fillRect(0, 0, size.x, size.y);

      fogCtx.globalCompositeOperation = 'destination-out';
      exploredPoints.forEach(function (point) {
        var latlng = L.latLng(point.latitude, point.longitude);
        var layerPoint = map.latLngToLayerPoint(latlng);
        var canvasPoint = layerPoint.subtract(topLeft);
        var radius = metersToPixelRadius(latlng, EXPLORED_RADIUS_METERS);
        fogCtx.beginPath();
        fogCtx.arc(canvasPoint.x, canvasPoint.y, radius, 0, Math.PI * 2);
        fogCtx.fill();
      });
      fogCtx.globalCompositeOperation = 'source-over';
    }

    function setExploredPoints(points) {
      exploredPoints = Array.isArray(points) ? points : [];
      redrawFog();
    }

    var hintDivIcon = L.divIcon({
      className: '',
      html: '<div class="hint-marker">？</div>',
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    });

    function setHints(hints) {
      var nextIds = {};
      (Array.isArray(hints) ? hints : []).forEach(function (hint) {
        nextIds[hint.spotId] = true;
        var latLng = [hint.latitude, hint.longitude];
        if (hintMarkers[hint.spotId]) {
          hintMarkers[hint.spotId].setLatLng(latLng);
        } else {
          var marker = L.marker(latLng, {
            icon: hintDivIcon,
            alt: '寄り道スポットの気配',
            keyboard: true,
          }).addTo(map);
          marker.on('click', function () {
            postToParent({ type: 'hintSelected', spotId: hint.spotId });
          });
          hintMarkers[hint.spotId] = marker;
        }
      });

      Object.keys(hintMarkers).forEach(function (spotId) {
        if (!nextIds[spotId]) {
          map.removeLayer(hintMarkers[spotId]);
          delete hintMarkers[spotId];
        }
      });
    }

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
      if (!hasCenteredOnCurrentLocation) {
        hasCenteredOnCurrentLocation = true;
        map.setView(latLng, 17);
      }
    }

    map.on('moveend zoomend', redrawFog);
    map.on('load', redrawFog);

    function handleMessage(event) {
      var data = event.data;
      if (typeof data !== 'string') return;
      var message;
      try {
        message = JSON.parse(data);
      } catch (e) {
        return;
      }
      if (message.type === 'setCurrentLocation') {
        setCurrentLocationMarker(message.latitude, message.longitude);
      }
      if (message.type === 'setExploredPoints') {
        setExploredPoints(message.points);
      }
      if (message.type === 'setHints') {
        setHints(message.hints);
      }
      if (message.type === 'recenterToCurrentLocation') {
        if (currentLocationMarker) {
          map.setView(currentLocationMarker.getLatLng(), 17);
        }
      }
    }

    document.addEventListener('message', handleMessage);
    window.addEventListener('message', handleMessage);

    redrawFog();
    postToParent({ type: 'ready' });
  </script>
</body>
</html>`;
}
