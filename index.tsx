import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, FeatureGroup, Polygon } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import Slider from 'rc-slider';
import 'leaflet/dist/leaflet.css';
import 'rc-slider/assets/index.css';
import 'leaflet-draw/dist/leaflet.draw.css';

interface PolygonData {
  id: string;
  latlngs: any;
  color: string;
}

const defaultThresholds = [
  { value: 10, color: 'red' },
  { value: 25, color: 'blue' },
  { value: 30, color: 'green' },
];

export default function DashboardPage() {
  const [sliderRange, setSliderRange] = useState([0, 30]);
  const [polygons, setPolygons] = useState<PolygonData[]>([]);
  const [thresholds, setThresholds] = useState(defaultThresholds);

  const getColorByTemperature = (temperature: number) => {
    for (let i = 0; i < thresholds.length; i++) {
      if (temperature < thresholds[i].value) {
        return thresholds[i].color;
      }
    }
    return thresholds[thresholds.length - 1].color;
  };

  const fetchTemperatureData = async (lat: number, lon: number) => {
    const res = await fetch(
      `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=2025-07-18&end_date=2025-08-01&hourly=temperature_2m`
    );
    const data = await res.json();
    return data.hourly.temperature_2m || [];
  };

  const handleCreated = async (e: any) => {
    const layer = e.layer;
    const latlngs = layer.getLatLngs()[0];
    const center = layer.getBounds().getCenter();
    const tempData = await fetchTemperatureData(center.lat, center.lng);
    const selectedTemp = tempData[sliderRange[0]];
    const color = getColorByTemperature(selectedTemp);

    setPolygons((prev) => [
      ...prev,
      { id: Date.now().toString(), latlngs, color },
    ]);
  };

  const handleSliderChange = (value: any) => {
    setSliderRange(value);
  };

  const handleThresholdChange = (index: number, value: number) => {
    const updated = [...thresholds];
    updated[index].value = value;
    setThresholds(updated);
  };

  return (
    <div className="p-4 space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-2">Timeline Slider</h2>
        <Slider
          range
          min={0}
          max={30}
          defaultValue={[0, 30]}
          onChange={handleSliderChange}
        />
      </div>

      <div>
        <h2 className="text-xl font-bold mb-2">Data Source Thresholds</h2>
        <div className="flex gap-4">
          {thresholds.map((t, i) => (
            <div key={i} className="flex flex-col gap-1">
              <label>{t.color.toUpperCase()}</label>
              <input
                type="number"
                value={t.value}
                onChange={(e) => handleThresholdChange(i, +e.target.value)}
                className="border p-1 w-20"
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-2">Interactive Map</h2>
        <MapContainer
          center={[20.5937, 78.9629]}
          zoom={6}
          style={{ height: '500px', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />

          <FeatureGroup>
            <EditControl
              position="topright"
              onCreated={handleCreated}
              draw={{
                rectangle: false,
                circle: false,
                circlemarker: false,
                marker: false,
                polyline: false,
              }}
            />
          </FeatureGroup>

          {polygons.map((poly) => (
            <Polygon
              key={poly.id}
              positions={poly.latlngs}
              pathOptions={{ color: poly.color }}
            />
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
