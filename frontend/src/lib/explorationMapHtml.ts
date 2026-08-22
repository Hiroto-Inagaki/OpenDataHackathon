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
    html, body, #map { height: 100%; margin: 0; padding: 0; background: #cbd5e1; }
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
    .hint-marker-discovered {
      background: #16a34a;
      color: #ffffff;
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
    // 衛星写真ベースのリアルな地図表示(Esri World Imagery)。
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community'
    }).addTo(map);
    // 衛星写真だけでは道路名・地名が読めないため、ラベルのみの参照レイヤーを重ねる。
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19
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

    // 雲のような質感を出すため、もこもこした塊(パフ)を並べたタイルパターンを1度だけ生成する。
    // 位置は決定論的な擬似乱数(シード固定)で作るため、再描画のたびに柄が変わってちらつくことがない。
    var CLOUD_TILE_SIZE = 260;
    function createCloudPuffPattern() {
      var seed = 42;
      function rand() {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        return seed / 4294967296;
      }
      var puffs = [];
      var count = 16;
      for (var i = 0; i < count; i++) {
        puffs.push({
          x: rand() * CLOUD_TILE_SIZE,
          y: rand() * CLOUD_TILE_SIZE,
          r: 45 + rand() * 75,
          shade: rand()
        });
      }
      return puffs;
    }
    var CLOUD_PUFFS = createCloudPuffPattern();

    function drawCloudPuff(cx, cy, r, shade) {
      // shadeが大きいほど白く明るいパフ、小さいほど陰の入ったグレーのパフにする。
      var rgb = shade > 0.5 ? '255,255,255' : '148,163,184';
      var alpha = 0.14 + shade * 0.16;
      var gradient = fogCtx.createRadialGradient(cx, cy, 0, cx, cy, r);
      gradient.addColorStop(0, 'rgba(' + rgb + ',' + alpha + ')');
      gradient.addColorStop(1, 'rgba(' + rgb + ',0)');
      fogCtx.fillStyle = gradient;
      fogCtx.beginPath();
      fogCtx.arc(cx, cy, r, 0, Math.PI * 2);
      fogCtx.fill();
    }

    function redrawFog() {
      var size = map.getSize();
      var topLeft = map.containerPointToLayerPoint([0, 0]);

      fogCanvas.width = size.x;
      fogCanvas.height = size.y;
      L.DomUtil.setPosition(fogCanvas, topLeft);

      fogCtx.clearRect(0, 0, size.x, size.y);

      // 1. 雲の下地(白〜薄いグレーのやわらかいグラデーション)。
      var baseGradient = fogCtx.createLinearGradient(0, 0, size.x, size.y);
      baseGradient.addColorStop(0, 'rgba(248, 250, 252, 0.92)');
      baseGradient.addColorStop(1, 'rgba(203, 213, 225, 0.92)');
      fogCtx.fillStyle = baseGradient;
      fogCtx.fillRect(0, 0, size.x, size.y);

      // 2. もこもこした雲のパフを、地図の座標に紐づく位相でタイル状に敷き詰める
      //    (パンしても模様が地図に対して固定されて見えるようにする)。
      var phaseX = ((topLeft.x % CLOUD_TILE_SIZE) + CLOUD_TILE_SIZE) % CLOUD_TILE_SIZE;
      var phaseY = ((topLeft.y % CLOUD_TILE_SIZE) + CLOUD_TILE_SIZE) % CLOUD_TILE_SIZE;
      for (var tx = -phaseX - CLOUD_TILE_SIZE; tx < size.x + CLOUD_TILE_SIZE; tx += CLOUD_TILE_SIZE) {
        for (var ty = -phaseY - CLOUD_TILE_SIZE; ty < size.y + CLOUD_TILE_SIZE; ty += CLOUD_TILE_SIZE) {
          for (var p = 0; p < CLOUD_PUFFS.length; p++) {
            var puff = CLOUD_PUFFS[p];
            drawCloudPuff(tx + puff.x, ty + puff.y, puff.r, puff.shade);
          }
        }
      }

      // 3. 踏破済みの地点は、雲が晴れるようにやわらかい縁で切り抜く(輪郭を出さない)。
      fogCtx.globalCompositeOperation = 'destination-out';
      exploredPoints.forEach(function (point) {
        var latlng = L.latLng(point.latitude, point.longitude);
        var layerPoint = map.latLngToLayerPoint(latlng);
        var canvasPoint = layerPoint.subtract(topLeft);
        var radius = metersToPixelRadius(latlng, EXPLORED_RADIUS_METERS);
        var clearGradient = fogCtx.createRadialGradient(
          canvasPoint.x, canvasPoint.y, 0,
          canvasPoint.x, canvasPoint.y, radius
        );
        clearGradient.addColorStop(0, 'rgba(0,0,0,1)');
        clearGradient.addColorStop(0.6, 'rgba(0,0,0,1)');
        clearGradient.addColorStop(1, 'rgba(0,0,0,0)');
        fogCtx.fillStyle = clearGradient;
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

    // 発見済みは白いチェックマーク、未発見は？で描き分ける(FR-LD-07: 発見しても地図から消さない)。
    function buildHintIcon(discovered) {
      var className = discovered ? 'hint-marker hint-marker-discovered' : 'hint-marker';
      // 絵文字の色付きチェック(✅)ではなく、CSSのcolorに従う単色の記号(✔)を使う。
      // バリエーションセレクタ(U+FE0F)を付けると絵文字表示(色固定)になりCSSのcolorが無視されるため、
      // 単体のU+2714(テキスト表示)のままにすること。
      var symbol = discovered ? '✔' : '？';
      return L.divIcon({
        className: '',
        html: '<div class="' + className + '">' + symbol + '</div>',
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });
    }

    function setHints(hints) {
      var nextIds = {};
      (Array.isArray(hints) ? hints : []).forEach(function (hint) {
        nextIds[hint.spotId] = true;
        var latLng = [hint.latitude, hint.longitude];
        var icon = buildHintIcon(!!hint.discovered);
        var altText = hint.discovered ? '発見済みの寄り道スポット' : '寄り道スポットの気配';
        if (hintMarkers[hint.spotId]) {
          hintMarkers[hint.spotId].setLatLng(latLng);
          hintMarkers[hint.spotId].setIcon(icon);
        } else {
          var marker = L.marker(latLng, {
            icon: icon,
            alt: altText,
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
