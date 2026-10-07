export const PRODUCT = {
  id: 'void-gen1',
  sku: 'VOID-GEN1',
  name: 'VOID',
  fullName: 'VOID Wireless Earbuds',
  shortDescription:
    'Custom 11 mm titanium driver, hybrid active noise cancellation, and a liquid silicone seal engineered for all-day wear.',
  price: 249,
  currency: 'USD',
  currencySymbol: '$',
  shippingNote: 'Free carbon-neutral shipping. 30-day trial.',
  finishes: [
    {
      id: 'whitesmoke',
      name: 'Ceramic Whitesmoke',
      swatch: '#f4f6f5',
      housing: {
        color: 0xffffff,
        roughness: 0.06,
        metalness: 0.02,
        clearcoat: 1.0,
        clearcoatRoughness: 0.015
      },
      accent: {
        color: 0xf0f2f4,
        roughness: 0.32,
        metalness: 0.08
      }
    },
    {
      id: 'charcoal',
      name: 'Matte Charcoal',
      swatch: '#2c3136',
      housing: {
        color: 0x2a2f34,
        roughness: 0.34,
        metalness: 0.18,
        clearcoat: 0.28,
        clearcoatRoughness: 0.22
      },
      accent: {
        color: 0x3a4046,
        roughness: 0.42,
        metalness: 0.12
      }
    },
    {
      id: 'olive',
      name: 'Olive Titanium',
      swatch: '#8a9580',
      housing: {
        color: 0x8a9580,
        roughness: 0.2,
        metalness: 0.42,
        clearcoat: 0.55,
        clearcoatRoughness: 0.12
      },
      accent: {
        color: 0x9aa690,
        roughness: 0.36,
        metalness: 0.2
      }
    }
  ],
  specs: [
    { name: 'Transducer', value: '11 mm titanium dynamic driver' },
    { name: 'Frequency', value: '5 Hz – 40 kHz' },
    { name: 'ANC', value: 'Hybrid, up to −45 dB' },
    { name: 'Battery', value: '8 h buds / 38 h with case' },
    { name: 'Connectivity', value: 'Bluetooth 5.3, LDAC, Multipoint' },
    { name: 'Resistance', value: 'IP54 water and sweat' }
  ]
};

export function formatPrice(amount) {
  return `$${Number(amount).toFixed(2).replace(/\.00$/, '')}`;
}

export function getFinish(id) {
  return PRODUCT.finishes.find((finish) => finish.id === id) || PRODUCT.finishes[0];
}
