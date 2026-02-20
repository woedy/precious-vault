// Mock data for the precious metals demo platform

export const metals = [
  {
    id: 'gold',
    name: 'Gold',
    symbol: 'Au',
    price: 2024.50,
    change: 1.2,
    unit: 'oz',
    color: 'from-yellow-400 to-amber-500',
    icon: '🥇',
  },
  {
    id: 'silver',
    name: 'Silver',
    symbol: 'Ag',
    price: 23.45,
    change: -0.8,
    unit: 'oz',
    color: 'from-slate-300 to-slate-400',
    icon: '🥈',
  },
  {
    id: 'platinum',
    name: 'Platinum',
    symbol: 'Pt',
    price: 912.80,
    change: 0.5,
    unit: 'oz',
    color: 'from-slate-400 to-slate-500',
    icon: '⚪',
  },
  {
    id: 'palladium',
    name: 'Palladium',
    symbol: 'Pd',
    price: 1045.20,
    change: 2.1,
    unit: 'oz',
    color: 'from-zinc-300 to-zinc-400',
    icon: '💠',
  },
  {
    id: 'palladium',
    name: 'Palladium',
    symbol: 'Pd',
    price: 1045.20,
    change: 2.1,
    unit: 'oz',
    color: 'from-zinc-300 to-zinc-400',
    icon: '💠',
  },
];

export const products = [
  {
    id: 'gold-bar-1oz',
    metalId: 'gold',
    name: '1 oz Gold Bar',
    manufacturer: 'PAMP Suisse',
    purity: '.9999',
    weight: 1,
    premium: 45.00,
    image: 'gold-bar',
    type: 'bar'
  },
  {
    id: 'gold-coin-1oz',
    metalId: 'gold',
    name: '1 oz Gold Eagle',
    manufacturer: 'US Mint',
    purity: '.9167',
    weight: 1,
    premium: 65.00,
    image: 'gold-coin',
    type: 'coin'
  },
  {
    id: 'silver-bar-10oz',
    metalId: 'silver',
    name: '10 oz Silver Bar',
    manufacturer: 'Royal Canadian Mint',
    purity: '.9999',
    weight: 10,
    premium: 4.50, // per oz
    image: 'silver-bar',
    type: 'bar'
  },
  {
    id: 'gold-digital-pool',
    metalId: 'gold',
    name: 'Digital Gold (Pool Allocated)',
    manufacturer: 'Fortress Vault',
    purity: '.9999',
    weight: 1, // fractional allowed
    premium: 0.50, // per oz low premium
    image: 'digital-gold',
    type: 'digital'
  }
];

export const portfolio = {
  totalValue: 48750.00,
  cashBalance: 5420.00,
  holdings: [
    { metalId: 'gold', amount: 20.5, value: 41502.25, averageCost: 1980.00 },
    { metalId: 'silver', amount: 50.0, value: 1172.50, averageCost: 22.00 },
    { metalId: 'platinum', amount: 0.5, value: 456.40, averageCost: 890.00 },
  ],
};

export const vaults = [
  {
    id: 'new-york',
    city: 'New York',
    country: 'USA',
    flag: '🇺🇸',
    allocated: true,
    insured: true,
    storageFee: 0.12,
    status: 'active',
    capacity: 85,
  },
  {
    id: 'zurich',
    city: 'Zurich',
    country: 'Switzerland',
    flag: '🇨🇭',
    allocated: true,
    insured: true,
    storageFee: 0.08,
    status: 'active',
    capacity: 72,
  },
  {
    id: 'london',
    city: 'London',
    country: 'UK',
    flag: '🇬🇧',
    allocated: true,
    insured: true,
    storageFee: 0.10,
    status: 'active',
    capacity: 90,
  },
  {
    id: 'singapore',
    city: 'Singapore',
    country: 'Singapore',
    flag: '🇸🇬',
    allocated: true,
    insured: true,
    storageFee: 0.09,
    status: 'active',
    capacity: 65,
  },
];

export const transactions = [
  {
    id: 'txn-001',
    date: '2024-01-15',
    type: 'buy',
    asset: 'Gold',
    amount: '5.0 oz',
    value: 10122.50,
    status: 'completed',
  },
  {
    id: 'txn-002',
    date: '2024-01-12',
    type: 'storage',
    asset: 'All Metals',
    amount: '—',
    value: 45.00,
    status: 'completed',
  },
  {
    id: 'txn-003',
    date: '2024-01-10',
    type: 'sell',
    asset: 'Silver',
    amount: '25.0 oz',
    value: 586.25,
    status: 'completed',
  },
  {
    id: 'txn-004',
    date: '2024-01-08',
    type: 'cashout',
    asset: 'Gold',
    amount: '2.0 oz',
    value: 4049.00,
    status: 'completed',
  },
  {
    id: 'txn-005',
    date: '2024-01-05',
    type: 'buy',
    asset: 'Platinum',
    amount: '0.5 oz',
    value: 445.00,
    status: 'completed',
  },
  {
    id: 'txn-006',
    date: '2024-01-03',
    type: 'buy',
    asset: 'Gold',
    amount: '10.0 oz',
    value: 19800.00,
    status: 'completed',
  },
  {
    id: 'txn-007',
    date: '2024-01-01',
    type: 'deposit',
    asset: 'Cash',
    amount: '—',
    value: 25000.00,
    status: 'completed',
  },
];

export const user = {
  name: 'Alex Morgan',
  email: 'alex.morgan@example.com',
  phone: '+1 (555) 123-4567',
  joinDate: 'January 2024',
  preferredVault: 'Zurich',
  twoFactor: true,
  notifications: true,
};

export const chartData = [
  { month: 'Aug', gold: 1920, silver: 22, platinum: 880 },
  { month: 'Sep', gold: 1890, silver: 21, platinum: 870 },
  { month: 'Oct', gold: 1950, silver: 23, platinum: 895 },
  { month: 'Nov', gold: 1980, silver: 24, platinum: 900 },
  { month: 'Dec', gold: 2010, silver: 23, platinum: 905 },
  { month: 'Jan', gold: 2024, silver: 23, platinum: 912 },
];

export const features = [
  {
    title: 'Buy & Sell Metals',
    description: 'Trade gold, silver, platinum, and palladium at competitive market rates with instant execution.',
    icon: 'TrendingUp',
  },
  {
    title: 'Insured Vault Storage',
    description: 'Store your metals in world-class vaults across New York, Zurich, London, and Singapore.',
    icon: 'Shield',
  },
  {
    title: 'Instant Cash Conversion',
    description: 'Convert your precious metals to cash anytime with same-day settlement to your bank account.',
    icon: 'Banknote',
  },
  {
    title: '24/7 Market Access',
    description: 'Access global precious metals markets around the clock from anywhere in the world.',
    icon: 'Globe',
  },
];

export const steps = [
  {
    number: '01',
    title: 'Create Account',
    description: 'Sign up in minutes with our streamlined verification process.',
  },
  {
    number: '02',
    title: 'Fund Your Account',
    description: 'Deposit funds via bank transfer, wire, or card.',
  },
  {
    number: '03',
    title: 'Buy Metals',
    description: 'Purchase gold, silver, or other metals at live market prices.',
  },
  {
    number: '04',
    title: 'Store or Convert',
    description: 'Keep metals in secure vaults or convert to cash anytime.',
  },
];

export const stats = [
  { value: '$2.5B+', label: 'Assets Under Custody' },
  { value: '150K+', label: 'Active Investors' },
  { value: '99.99%', label: 'Uptime Reliability' },
  { value: '4.9/5', label: 'Customer Rating' },
];
