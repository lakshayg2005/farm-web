import type { Produce } from './catalog'

/**
 * Sample produce shown only when the catalog service cannot be reached (for example the website
 * is deployed without the backend). The page says so in a banner; nothing here is real stock.
 */
const FARMS = [
  ['Hariyali Farms', 'Ramesh Patel', 'Kumhari', 6, 40],
  ['Sunrise Organics', 'Sunita Verma', 'Ahiwara', 14, 120],
  ['Green Valley Farm', 'Mahesh Sahu', 'Patan', 22, 200],
  ['Mitti Fresh', 'Kavita Yadav', 'Dhamdha', 31, 300],
  ['Annapurna Fields', 'Dinesh Kurre', 'Arang', 47, 75],
  ['Kisan Bagh', 'Meena Thakur', 'Abhanpur', 63, 250],
] as const

const ITEMS: [crop: string, name: string, variety: string | null, unit: string, price: number, ageDays: number, organic: boolean, grade: 'A' | 'B' | null][] = [
  ['tomato', 'Tomato', 'Desi red', 'kg', 32, 0, true, 'A'],
  ['spinach', 'Spinach (Palak)', null, 'bunch', 18, 0, true, 'A'],
  ['mango', 'Mango', 'Dussehri', 'kg', 95, 1, false, 'A'],
  ['okra', 'Okra (Bhindi)', null, 'kg', 44, 1, false, 'B'],
  ['potato', 'Potato', 'Kufri Jyoti', 'kg', 24, 4, false, 'A'],
  ['onion', 'Onion', 'Nashik red', 'kg', 30, 6, false, 'B'],
  ['coriander', 'Coriander', null, 'bunch', 12, 1, true, null],
  ['brinjal', 'Brinjal', 'Bharta', 'kg', 36, 2, false, 'B'],
  ['banana', 'Banana', 'Robusta', 'dozen', 55, 2, false, 'A'],
  ['carrot', 'Carrot', 'Ooty', 'kg', 48, 3, true, 'A'],
  ['green-chilli', 'Green Chilli', null, 'kg', 60, 1, false, null],
  ['rice', 'Rice (Paddy)', 'Dubraj', 'quintal', 3400, 20, false, 'A'],
  ['wheat', 'Wheat', 'Sharbati', 'quintal', 2900, 35, false, 'A'],
  ['guava', 'Guava', 'Allahabad Safeda', 'kg', 50, 2, true, 'B'],
  ['cauliflower', 'Cauliflower', null, 'piece', 35, -2, false, null],
  ['watermelon', 'Watermelon', null, 'piece', 70, -1, false, null],
  ['methi', 'Fenugreek (Methi)', null, 'bunch', 15, 2, true, null],
  ['chana', 'Chickpea (Chana)', 'Kabuli', 'quintal', 6200, 40, false, 'A'],
  ['garlic', 'Garlic', 'Desi', 'kg', 140, 10, true, 'B'],
  ['cucumber', 'Cucumber', null, 'kg', 28, 0, false, 'A'],
  ['papaya', 'Papaya', 'Red Lady', 'kg', 40, 3, false, null],
  ['peas', 'Green Peas', null, 'kg', 65, 1, true, 'A'],
  ['ginger', 'Ginger', null, 'kg', 120, 8, false, 'B'],
  ['bottle-gourd', 'Bottle Gourd (Lauki)', null, 'piece', 25, 1, false, null],
]

const iso = (d: Date) => d.toISOString().slice(0, 10)

export function sampleProduce(lat: number, lng: number, today = new Date()): Produce[] {
  return ITEMS.map(([cropId, cropName, variety, unit, price, ageDays, organic, grade], i) => {
    const [farmName, , village, km, bearing] = FARMS[i % FARMS.length]!
    const rad = (bearing * Math.PI) / 180
    const harvest = new Date(today.getFullYear(), today.getMonth(), today.getDate() - ageDays, 12)
    return {
      id: `sample-${i}`,
      cropId,
      cropName,
      variety,
      description: `${cropName} from ${farmName}, grown in ${village}.`,
      farmId: `sample-farm-${i % FARMS.length}`,
      farmName,
      farmerId: `sample-farmer-${i % FARMS.length}`,
      village,
      district: 'Durg',
      pricePerUnit: price,
      unit,
      qtyAvailable: unit === 'quintal' ? 12 + (i % 5) * 4 : 20 + ((i * 37) % 140),
      harvestDate: iso(harvest),
      grade,
      isOrganic: organic,
      distanceM: km * 1000 + i * 130,
      lat: lat + (km / 111) * Math.cos(rad),
      lng: lng + (km / 111) * Math.sin(rad),
      updatedAt: today.toISOString(),
    }
  })
}

export const SAMPLE_FARMERS: Record<string, string> = Object.fromEntries(
  FARMS.map(([, farmer], i) => [`sample-farmer-${i}`, farmer]),
)
