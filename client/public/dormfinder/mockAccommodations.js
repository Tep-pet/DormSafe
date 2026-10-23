/**
 * Mock Accommodations Data for DormFinder
 * Sample accommodations located within 2 km of Ateneo de Davao University (AdDU Jacinto Campus)
 * 
 * Fields per accommodation:
 * - id: unique identifier (string / number)
 * - name: accommodation title
 * - address: street address in Davao City
 * - latitude: decimal latitude
 * - longitude: decimal longitude
 * - price: monthly rate in Philippine Pesos (PHP)
 * - type: 'dorm' | 'boarding_house' | 'apartment'
 * - description: brief student summary
 */

export const mockAccommodations = [
  {
    id: 'juan-luna',
    name: 'Juan Luna Boarding House',
    address: 'Brgy 29-C, 102-1 Juan Luna St, Poblacion District, Davao City',
    latitude: 7.0725891,
    longitude: 125.6160124,
    price: 2500,
    type: 'boarding_house',
    description: 'Female-only boarding house, 5-minute walk to AdDU Jacinto Gate. Free Wi-Fi, kitchen access, 24/7 security gate.'
  },
  {
    id: 'brc-dormitory',
    name: 'BRC Dormitory',
    address: 'Padre Gomez St & A. Bonifacio St, Barangay 34-D, Davao City',
    latitude: 7.0680548,
    longitude: 125.6125343,
    price: 10000,
    type: 'dorm',
    description: 'Co-ed dormitory with air-conditioned study rooms, high-speed fiber internet, TV lounge, and fire safety compliance.'
  },
  {
    id: 'correla-dormitory',
    name: 'Correla Dormitory',
    address: '108 Roxas Avenue, Poblacion District, Davao City',
    latitude: 7.0694500,
    longitude: 125.6146800,
    price: 4000,
    type: 'dorm',
    description: 'Ladies-only dormitory directly along Roxas Avenue. Features CCTV surveillance, quiet study area, and water dispenser.'
  },
  {
    id: 'maria-goretti',
    name: 'Residencia de Maria Goretti',
    address: '32 Padre Faura St, Poblacion District, Davao City',
    latitude: 7.0695629,
    longitude: 125.6152546,
    price: 3500,
    type: 'dorm',
    description: 'Safe female student housing with kitchen privileges, air-conditioned options, strict curfew, and peaceful environment.'
  },
  {
    id: 'ivory-residences',
    name: 'Ivory Residences Condominium',
    address: '3JP5+WVM, J.P. Laurel Ave, Poblacion District, Davao City',
    latitude: 7.0871921,
    longitude: 125.6091495,
    price: 35000,
    type: 'apartment',
    description: 'Modern condominium studio unit with RFID keycard access, swimming pool, gym, laundry, and 24/7 front desk.'
  },
  {
    id: 'jacinto-suites',
    name: 'Jacinto Student Suites',
    address: '95 Emilio Jacinto St, Barangay 29-C, Davao City',
    latitude: 7.0731000,
    longitude: 125.6138000,
    price: 6500,
    type: 'dorm',
    description: 'Right across from Ateneo Jacinto Campus Gate. Aircon rooms, individual study desks, backup generator, and CCTV.'
  },
  {
    id: 'roxas-bedspace',
    name: 'Roxas Avenue Bedspace & Studio',
    address: 'Corner Roxas Ave & Padre Gomez St, Davao City',
    latitude: 7.0705000,
    longitude: 125.6131000,
    price: 5000,
    type: 'boarding_house',
    description: 'Affordable bedspacing near Roxas Night Market and AdDU campus. Walking distance to food stalls and jeepney stops.'
  }
];

// Helper to find an accommodation by ID
export function getAccommodationById(id) {
  return mockAccommodations.find((acc) => String(acc.id) === String(id)) || mockAccommodations[0];
}
