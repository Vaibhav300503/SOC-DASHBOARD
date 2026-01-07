const REGIONS = [
  { name: "California, USA", lat: 36.7783, lon: -119.4179 },
  { name: "Texas, USA", lat: 31.9686, lon: -99.9018 },
  { name: "New York, USA", lat: 40.7128, lon: -74.0060 },
  { name: "Florida, USA", lat: 27.6648, lon: -81.5158 },
  { name: "Washington, USA", lat: 47.7511, lon: -120.7401 },
  { name: "Ontario, CAN", lat: 51.2538, lon: -85.3232 },
  { name: "Quebec, CAN", lat: 52.9399, lon: -73.5491 },
  { name: "Bavaria, DEU", lat: 48.7904, lon: 11.4979 },
  { name: "Ile-de-France, FRA", lat: 48.8566, lon: 2.3522 },
  { name: "England, GBR", lat: 52.3555, lon: -1.1743 },
  { name: "Lombardy, ITA", lat: 45.4791, lon: 9.8453 },
  { name: "Madrid, ESP", lat: 40.4168, lon: -3.7038 },
  { name: "Moscow Oblast, RUS", lat: 55.7558, lon: 37.6173 },
  { name: "Tokyo, JPN", lat: 35.6762, lon: 139.6503 },
  { name: "Osaka, JPN", lat: 34.6937, lon: 135.5023 },
  { name: "Guangdong, CHN", lat: 23.3790, lon: 113.7633 },
  { name: "Zhejiang, CHN", lat: 29.1832, lon: 120.0934 },
  { name: "Maharashtra, IND", lat: 19.7515, lon: 75.7139 },
  { name: "Karnataka, IND", lat: 15.3173, lon: 75.7139 },
  { name: "Seoul, KOR", lat: 37.5665, lon: 126.9780 },
  { name: "NSW, AUS", lat: -31.2532, lon: 146.9211 },
  { name: "Victoria, AUS", lat: -37.4713, lon: 144.7852 },
  { name: "Sao Paulo, BRA", lat: -23.5505, lon: -46.6333 },
  { name: "Buenos Aires, ARG", lat: -34.6037, lon: -58.3816 },
  { name: "Gauteng, ZAF", lat: -26.2708, lon: 28.1123 },
  { name: "Lagos, NGA", lat: 6.5244, lon: 3.3792 },
  { name: "Cairo, EGY", lat: 30.0444, lon: 31.2357 },
]

const ATTACK_TYPES = [
  { name: "SMB (445)", color: "#ff4d4d" },      // Red
  { name: "Telnet (23)", color: "#00f2ff" },     // Cyan
  { name: "SSH (22)", color: "#ffee00" },       // Yellow
  { name: "HTTP (80)", color: "#ff00ff" },      // Magenta
  { name: "RDP (3389)", color: "#3d5afe" },     // Electric Blue
]

const INITIAL_COUNTRIES_SRC = [
  { name: "Russia", count: 45021 },
  { name: "China", count: 32104 },
  { name: "USA", count: 21004 },
  { name: "Netherlands", count: 15400 },
  { name: "Brazil", count: 12040 },
]

const INITIAL_COUNTRIES_DST = [
  { name: "USA", count: 89002 },
  { name: "Germany", count: 45001 },
  { name: "Japan", count: 32004 },
  { name: "UK", count: 28000 },
  { name: "India", count: 15000 },
]

const regions = REGIONS
  .map(normalizeRegion)
  .filter(validateCoordinates)
const attackTypes = ATTACK_TYPES
const initialSources = INITIAL_COUNTRIES_SRC
const initialDestinations = INITIAL_COUNTRIES_DST

if (!regions.length) {
  console.warn('Location map data: Unable to parse regions from 2dMap.jsx; real-time thread disabled.')
} else {
  seedInitialFeatures()
  pruneFlows()
}
