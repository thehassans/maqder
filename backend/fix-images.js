import { MongoClient } from 'mongodb';

const svgToDataUrl = (text, bgColor) => {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300' width='400' height='300'>
    <rect width='400' height='300' fill='${bgColor}' />
    <text x='50%' y='50%' font-family='Arial, sans-serif' font-size='24' font-weight='bold' fill='#ffffff' dominant-baseline='middle' text-anchor='middle'>${text}</text>
  </svg>`;
  return 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
};

const defaultServices = [
  { nameEn: 'Shirt Wash & Iron', category: 'wash_fold', color: '#0d9488' },
  { nameEn: 'T-Shirt Wash & Fold', category: 'wash_fold', color: '#0f766e' },
  { nameEn: 'Pants / Trousers', category: 'dry_clean', color: '#115e59' },
  { nameEn: 'Suit (2 Piece)', category: 'dry_clean', color: '#0f766e' },
  { nameEn: 'Dress', category: 'dry_clean', color: '#0d9488' },
  { nameEn: 'Blanket / Comforter', category: 'premium_care', color: '#3b82f6' },
  { nameEn: 'Carpet (per SQM)', category: 'premium_care', color: '#2563eb' },
  { nameEn: 'Jacket / Coat', category: 'dry_clean', color: '#1d4ed8' },
  { nameEn: 'Thobe (Traditional)', category: 'wash_fold', color: '#0d9488' },
  { nameEn: 'Abaya', category: 'dry_clean', color: '#115e59' },
  { nameEn: 'Shemagh', category: 'ironing', color: '#db2777' },
  { nameEn: 'Curtains (per kg)', category: 'premium_care', color: '#be185d' }
];

async function run() {
  const c = await MongoClient.connect('mongodb://127.0.0.1:27017/');
  const db = c.db('maqder');
  for(const s of defaultServices) {
    const dataUrl = svgToDataUrl(s.nameEn, s.color);
    await db.collection('laundryservices').updateMany(
      { nameEn: s.nameEn },
      { $set: { imageUrl: dataUrl } }
    );
  }
  console.log('Images updated to SVG Base64!');
  process.exit(0);
}

run().catch(console.error);
