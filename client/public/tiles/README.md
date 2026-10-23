# Offline PMTiles Vector Tile Archive

This directory stores offline vector tile archives for the Ateneo de Davao University (AdDU) campus and 2 km perimeter:
- Target file: `addu_campus.pmtiles` (~3.8 MB, bounds: `[125.600, 7.055, 125.630, 7.085]`)
- MapLibre GL JS loads this via the `pmtiles` protocol adapter (`pmtiles:///tiles/addu_campus.pmtiles`).
- The application automatically falls back to OpenStreetMap / Carto online raster tiles whenever the local archive is loading or during network builds.
