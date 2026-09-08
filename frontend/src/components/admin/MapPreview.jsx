import {
  MapContainer,
  TileLayer,
  Marker,
  Circle,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";

// Fix default marker icon untuk Leaflet + React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Update center map saat koordinat berubah
function UpdateMapCenter({ latitude, longitude }) {
  const map = useMap();

  useEffect(() => {
    if (latitude && longitude) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);

      if (!isNaN(lat) && !isNaN(lng)) {
        // Fly to dengan animasi smooth
        map.flyTo([lat, lng], map.getZoom());
      }
    }
  }, [latitude, longitude, map]);

  return null;
}

// Komponen internal untuk handle klik peta
function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      onLocationSelect(lat, lng);
    },
  });
  return null;
}

const MapPreview = ({ latitude, longitude, radius, onLocationChange }) => {
  // Default: Bandara Sultan Thaha Jambi
  const defaultPosition = [-1.6323435, 103.6403186];

  const currentPosition =
    latitude && longitude
      ? [parseFloat(latitude), parseFloat(longitude)]
      : defaultPosition;

  // Validasi koordinat & radius
  const isValidCoord = (val) => !isNaN(parseFloat(val)) && val !== "";
  const isValidRadius = (val) => !isNaN(parseInt(val)) && parseInt(val) > 0;

  // Warna circle sesuai radius (visual feedback)
  const getCircleStyle = (radiusValue) => {
    const r = parseInt(radiusValue) || 100;

    // Radius kecil: hijau, sedang: biru, besar: oranye
    if (r <= 50) {
      return { color: "#2BA745", fillColor: "#2BA745", fillOpacity: 0.15 };
    } else if (r <= 150) {
      return { color: "#0984E3", fillColor: "#0984E3", fillOpacity: 0.12 };
    } else {
      return { color: "#FFC107", fillColor: "#FFC107", fillOpacity: 0.1 };
    }
  };

  return (
    <div className="border-2 border-gray-200 overflow-hidden h-64 relative">
      <MapContainer
        center={currentPosition}
        zoom={16}
        scrollWheelZoom={true}
        className="h-full w-full z-0"
      >
        {/* Layer Satelit: Esri World Imagery */}
        <TileLayer
          attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />

        {/* Komponen update center saat koordinat berubah */}
        {isValidCoord(latitude) && isValidCoord(longitude) && (
          <UpdateMapCenter latitude={latitude} longitude={longitude} />
        )}

        {/* Marker di lokasi yang dipilih */}
        {isValidCoord(latitude) && isValidCoord(longitude) && (
          <Marker position={[parseFloat(latitude), parseFloat(longitude)]} />
        )}

        {/* CIRCLE RADIUS - Visualisasi area geofencing */}
        {isValidCoord(latitude) &&
          isValidCoord(longitude) &&
          isValidRadius(radius) && (
            <Circle
              center={[parseFloat(latitude), parseFloat(longitude)]}
              radius={parseInt(radius)} // dalam meter
              pathOptions={getCircleStyle(radius)}
            />
          )}

        {/* Handle klik peta */}
        <MapClickHandler onLocationSelect={onLocationChange} />
      </MapContainer>

      {/* Overlay info radius */}
      {isValidRadius(radius) &&
        isValidCoord(latitude) &&
        isValidCoord(longitude) && (
          <div className="absolute top-2 right-2 bg-white/95 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 shadow-sm z-[400] border border-gray-200">
            Radius :{" "}
            <span className="text-[#0984E3] font-semibold">{radius} meter</span>
          </div>
        )}
    </div>
  );
};

export default MapPreview;
