# DormSafe — Real-Time Location Tracking Map Feature

An open-source, mobile-first live location tracker designed for Ateneo de Davao University (AdDU) students. It guides students in real time from their current position to selected dormitories, boarding houses, and apartments within 2 km of campus.

**Zero Google Maps Dependency**: 100% free with no API billing, credit cards, or proprietary rate limits.

---

## 🛠️ Tech Stack

| Component | Technology | Details |
|---|---|---|
| **Map Rendering** | [Leaflet.js 1.9.4](https://leafletjs.com/) | Lightweight, mobile-friendly map library |
| **Tiles** | [OpenStreetMap](https://www.openstreetmap.org/) | Free cartography tiles (`© OpenStreetMap contributors`) |
| **Routing** | [OSRM Public Routing API](http://project-osrm.org/) | Free pedestrian street routing (`/route/v1/foot`) |
| **Location** | Browser Geolocation API | `navigator.geolocation.watchPosition` with high accuracy |
| **Architecture** | Vanilla ES Modules + HTML5 + CSS3 | No heavy build step needed; drop-in ready |

---

## 🚀 Quick Start / Setup

### Option 1: Run with any local HTTP server
Since the project uses ES Modules (`import`/`export`), serve it over HTTP:

```bash
# Using Python
cd dormsafe-tracker
python -m http.server 8080

# Or using Node.js npx serve
npx serve dormsafe-tracker
```

Then open `http://localhost:8080` in your browser.

### Option 2: Integrated with DormSafe / Vite Dev Server
The files are also available directly in the public assets directory:
```
http://localhost:5173/dormsafe-tracker/index.html
```

---

## 📱 HTTPS Requirement (Mobile Devices)

> [!IMPORTANT]
> Modern web browsers (Chrome, Safari, Firefox, Edge) **require a secure HTTPS connection** to grant geolocation permissions on remote mobile devices.
> - **Localhost**: Browsers treat `http://localhost` and `http://127.0.0.1` as secure contexts for development.
> - **Testing on phone over Wi-Fi / LAN**: Use an HTTPS tunnel like [ngrok](https://ngrok.com/) (`ngrok http 5173`) or deploy to Vercel/Netlify with automatic SSL.

---

## 🔒 Privacy & Philippines Data Privacy Act (RA 10173)

- **Zero Server Storage**: The student's GPS coordinates are processed exclusively on the client side inside the browser.
- Coordinates are never logged, stored in databases, or forwarded to backend services.
- A custom pre-permission modal explains why location access is needed before invoking the browser's native prompt.

---

## 🔄 Replacing Mock Data with a Real Backend API

To connect to your real backend or Supabase API:

1. Open `dormsafe-tracker/mockAccommodations.js` (or import from your API service).
2. Replace `mockAccommodations` with a dynamic `fetch()` call:

```javascript
// Example: Fetching live listings from your backend API
export async function fetchAccommodations() {
  const response = await fetch('/api/properties/nearby?gate=jacinto');
  const data = await response.json();
  return data.properties.map((p) => ({
    id: p.id,
    name: p.name,
    address: p.address,
    latitude: Number(p.latitude),
    longitude: Number(p.longitude),
    price: p.min_price || p.price,
    type: p.type || 'dorm',
    description: p.description
  }));
}
```

3. In `dormsafe-tracker/index.html`, await `fetchAccommodations()` and pass the resulting array to populate the dropdown and markers.

---

## 📐 Project Structure

```
dormsafe-tracker/
├── index.html              # Mobile-first interactive UI, permission modal, map container
├── style.css               # AdDU Blue & Gold theme, pulsing radar marker, responsive cards
├── tracker.js              # Modular tracking logic: requestLocation, startTracking, getRoute, stopTracking
├── mockAccommodations.js   # 7 sample accommodations within 2km of AdDU Jacinto campus
└── README.md               # Setup and integration guide
```
