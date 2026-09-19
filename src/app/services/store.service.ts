import { Injectable, signal, computed, inject, ApplicationRef } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { VendorStore, StoreServiceType, StoreOrderItem, StoreCatalogItem, StoreSettlement } from '../models/vendor.model';

const ACTIVE_STORE_KEY = 'pintu_vendor_active_store_id';

export const INITIAL_STORES: VendorStore[] = [
  // =========================================================================
  // HUBBALLI STORES
  // =========================================================================
  {
    id: 'hub-pharm-01',
    name: 'Apollo Pharmacy - Vidyanagar',
    city: 'Hubballi',
    serviceType: 'pharmacy',
    serviceLabel: 'Pharmacy & Medicines',
    serviceIcon: 'medkit-outline',
    category: 'pharmacy',
    phone: '9845012301',
    email: 'apollo.vidyanagar@pintu.com',
    address: 'Ground Floor, Shirur Park Road, Vidyanagar, Hubballi',
    pincode: '580031',
    isOpen: true,
    rating: 4.8,
    licenseType: 'Drug License No.',
    licenseNumber: 'KA-DH-2024-DL-8812',
    gstNumber: '29ABCDE1234F1Z5',
    metrics: {
      todaySales: 18450,
      salesGrowth: '+14.2%',
      activeOrders: 4,
      completedToday: 38,
      totalProducts: 240,
      lowStockCount: 6,
    },
    orders: [
      {
        id: 'ord-med-01',
        orderNumber: '#MED-9401',
        customerName: 'Anand Kumar',
        customerPhone: '9845012345',
        itemsSummary: 'Dolo 650mg (Strip of 15), Azithromycin 500mg (Strip of 3), Vitamin C 500mg',
        totalAmount: 385,
        status: 'preparing',
        timeAgo: '5 mins ago',
        paymentMethod: 'UPI (PhonePe)',
        itemCount: 3,
      },
      {
        id: 'ord-med-02',
        orderNumber: '#MED-9400',
        customerName: 'Megha Kulkarni',
        customerPhone: '9448112345',
        itemsSummary: 'Shelcal 500mg (Strip of 15), Evion 400 (Strip of 10)',
        totalAmount: 260,
        status: 'new',
        timeAgo: '12 mins ago',
        paymentMethod: 'Cash on Delivery',
        itemCount: 2,
      },
      {
        id: 'ord-med-03',
        orderNumber: '#MED-9399',
        customerName: 'Suresh Hiremath',
        customerPhone: '9740512345',
        itemsSummary: 'Digene Antacid Gel (200ml), Volini Pain Spray (100g)',
        totalAmount: 410,
        status: 'out_for_delivery',
        timeAgo: '24 mins ago',
        paymentMethod: 'UPI (GPay)',
        itemCount: 2,
      },
      {
        id: 'ord-med-04',
        orderNumber: '#MED-9398',
        customerName: 'Ramesh Patil',
        customerPhone: '9900212345',
        itemsSummary: 'Metformin 500mg (Strip of 20), Telmisartan 40mg',
        totalAmount: 195,
        status: 'delivered',
        timeAgo: '48 mins ago',
        paymentMethod: 'Credit Card',
        itemCount: 2,
      },
    ],
    catalogItems: [
      { id: 'cat-med-01', name: 'Dolo 650mg Tablet', category: 'Fever & Pain', price: 34, originalPrice: 40, inStock: true, unit: 'Strip of 15' },
      { id: 'cat-med-02', name: 'Azithromycin 500mg', category: 'Antibiotics', price: 118, originalPrice: 135, inStock: true, unit: 'Strip of 3' },
      { id: 'cat-med-03', name: 'Shelcal 500mg Calcium', category: 'Supplements', price: 142, originalPrice: 160, inStock: true, unit: 'Strip of 15' },
      { id: 'cat-med-04', name: 'Digene Gel Mint Flavour', category: 'Antacids', price: 155, originalPrice: 175, inStock: true, unit: 'Bottle (200ml)' },
      { id: 'cat-med-05', name: 'Volini Rapid Pain Spray', category: 'Pain Relief', price: 210, originalPrice: 240, inStock: true, unit: 'Can (100g)' },
      { id: 'cat-med-06', name: 'Evion 400 Vitamin E', category: 'Vitamins', price: 42, originalPrice: 50, inStock: false, unit: 'Strip of 10' },
    ],
    settlements: [
      { id: 'stl-med-01', settlementDate: 'Today, 06:00 AM', grossAmount: 17200, platformFee: 516, netPayout: 16684, bankAccount: 'HDFC Bank •••• 4412', status: 'settled' },
      { id: 'stl-med-02', settlementDate: 'Yesterday', grossAmount: 15400, platformFee: 462, netPayout: 14938, bankAccount: 'HDFC Bank •••• 4412', status: 'settled' },
    ],
  },
  {
    id: 'hub-pharm-02',
    name: 'MedPlus Healthcare - Gokul Road',
    city: 'Hubballi',
    serviceType: 'pharmacy',
    serviceLabel: 'Pharmacy & Medicines',
    serviceIcon: 'medkit-outline',
    category: 'pharmacy',
    phone: '9845012302',
    email: 'medplus.gokul@pintu.com',
    address: 'Near Akshay Park, Gokul Road, Hubballi',
    pincode: '580030',
    isOpen: true,
    rating: 4.7,
    licenseType: 'Drug License No.',
    licenseNumber: 'KA-DH-2024-DL-9104',
    gstNumber: '29BCDEF2345G2Z6',
    metrics: {
      todaySales: 12800,
      salesGrowth: '+8.9%',
      activeOrders: 2,
      completedToday: 26,
      totalProducts: 195,
      lowStockCount: 3,
    },
    orders: [
      {
        id: 'ord-med-11',
        orderNumber: '#MED-9410',
        customerName: 'Priya Joshi',
        customerPhone: '9880112233',
        itemsSummary: 'Crocin Advance (Strip of 20), Electral Powder (Pack of 4)',
        totalAmount: 175,
        status: 'new',
        timeAgo: '8 mins ago',
        paymentMethod: 'UPI',
        itemCount: 2,
      },
    ],
    catalogItems: [
      { id: 'cat-med-11', name: 'Crocin Advance 500mg', category: 'Fever', price: 28, originalPrice: 32, inStock: true, unit: 'Strip of 20' },
      { id: 'cat-med-12', name: 'Electral ORS Sachet', category: 'Hydration', price: 22, originalPrice: 25, inStock: true, unit: 'Sachet (21.8g)' },
    ],
    settlements: [
      { id: 'stl-med-11', settlementDate: 'Today, 06:00 AM', grossAmount: 11900, platformFee: 357, netPayout: 11543, bankAccount: 'SBI •••• 8821', status: 'settled' },
    ],
  },
  {
    id: 'hub-lab-01',
    name: 'Dr. Lal PathLabs - Hubballi Central',
    city: 'Hubballi',
    serviceType: 'lab_test',
    serviceLabel: 'Diagnostics & Lab Tests',
    serviceIcon: 'flask-outline',
    category: 'lab_test',
    phone: '9845012303',
    email: 'lalpath.hubballi@pintu.com',
    address: 'Opposite KIMS Hospital Gate 2, Vidyanagar, Hubballi',
    pincode: '580022',
    isOpen: true,
    rating: 4.9,
    licenseType: 'NABL Accreditation No.',
    licenseNumber: 'NABL-MED-LAB-2024-819',
    gstNumber: '29CDEFG3456H3Z7',
    metrics: {
      todaySales: 26800,
      salesGrowth: '+18.4%',
      activeOrders: 5,
      completedToday: 18,
      totalProducts: 42,
      lowStockCount: 0,
    },
    orders: [
      {
        id: 'ord-lab-01',
        orderNumber: '#LAB-4811',
        customerName: 'Dr. V. N. Patil',
        customerPhone: '9481234567',
        itemsSummary: 'Full Body Comprehensive Health Checkup (68 Parameters)',
        totalAmount: 1499,
        status: 'preparing',
        timeAgo: '15 mins ago',
        paymentMethod: 'Prepaid Online',
        itemCount: 1,
      },
      {
        id: 'ord-lab-02',
        orderNumber: '#LAB-4810',
        customerName: 'Shaila Deshpande',
        customerPhone: '9741567890',
        itemsSummary: 'Complete Blood Count (CBC) + Thyroid Profile Total (T3, T4, TSH)',
        totalAmount: 750,
        status: 'new',
        timeAgo: '28 mins ago',
        paymentMethod: 'Home Collection (Cash)',
        itemCount: 2,
      },
      {
        id: 'ord-lab-03',
        orderNumber: '#LAB-4809',
        customerName: 'Girish Angadi',
        customerPhone: '9901456789',
        itemsSummary: 'HbA1c Glycated Hemoglobin + Fasting Blood Sugar (FBS)',
        totalAmount: 520,
        status: 'delivered',
        timeAgo: '1 hour ago',
        paymentMethod: 'UPI',
        itemCount: 2,
      },
    ],
    catalogItems: [
      { id: 'cat-lab-01', name: 'Comprehensive Full Body Checkup', category: 'Health Packages', price: 1499, originalPrice: 2999, inStock: true, unit: 'Package (68 Tests)' },
      { id: 'cat-lab-02', name: 'Complete Blood Count (CBC)', category: 'Routine Tests', price: 320, originalPrice: 400, inStock: true, unit: 'Blood Sample' },
      { id: 'cat-lab-03', name: 'Thyroid Profile Total (T3, T4, TSH)', category: 'Hormones', price: 480, originalPrice: 650, inStock: true, unit: 'Fasting Serum' },
      { id: 'cat-lab-04', name: 'Lipid Profile Heart Health', category: 'Cardiology', price: 590, originalPrice: 850, inStock: true, unit: 'Blood Sample' },
      { id: 'cat-lab-05', name: 'Vitamin D3 & B12 Combo', category: 'Vitamins', price: 1150, originalPrice: 1800, inStock: true, unit: 'Blood Sample' },
    ],
    settlements: [
      { id: 'stl-lab-01', settlementDate: 'Today, 06:00 AM', grossAmount: 24500, platformFee: 735, netPayout: 23765, bankAccount: 'ICICI Bank •••• 9920', status: 'settled' },
    ],
  },
  {
    id: 'hub-prop-01',
    name: 'Pintu Prime Commercial Hub - Deshpande Nagar',
    city: 'Hubballi',
    serviceType: 'property',
    serviceLabel: 'Properties & Real Estate',
    serviceIcon: 'business-outline',
    category: 'property',
    phone: '9845012304',
    email: 'properties.hubballi@pintu.com',
    address: 'Club Road, Deshpande Nagar, Hubballi',
    pincode: '580029',
    isOpen: true,
    rating: 4.9,
    licenseType: 'Karnataka RERA Reg.',
    licenseNumber: 'PRM/KA/RERA/1251/308/PR/240101/006421',
    gstNumber: '29DEFGHI4567J4Z8',
    metrics: {
      todaySales: 145000,
      salesGrowth: '+22.0%',
      activeOrders: 6,
      completedToday: 2,
      totalProducts: 18,
      lowStockCount: 2,
    },
    orders: [
      {
        id: 'ord-prp-01',
        orderNumber: '#PRP-1092',
        customerName: 'Vinayak Hegde (Tech Solutions)',
        customerPhone: '9845119922',
        itemsSummary: 'Commercial Office Space - 1,850 Sq.Ft (Floor 3) Lease Agreement Token',
        totalAmount: 50000,
        status: 'preparing',
        timeAgo: '32 mins ago',
        paymentMethod: 'Bank Wire / NEFT',
        itemCount: 1,
      },
      {
        id: 'ord-prp-02',
        orderNumber: '#PRP-1091',
        customerName: 'Dr. Anita Joshi',
        customerPhone: '9448003344',
        itemsSummary: 'Clinic Retail Shop Unit #4 (Ground Floor) Site Visit Scheduled',
        totalAmount: 500,
        status: 'new',
        timeAgo: '1 hour ago',
        paymentMethod: 'UPI',
        itemCount: 1,
      },
    ],
    catalogItems: [
      { id: 'cat-prp-01', name: 'Grade-A Plug & Play IT Office Space', category: 'Commercial Office', price: 45000, originalPrice: 50000, inStock: true, unit: '1,200 sq.ft / month' },
      { id: 'cat-prp-02', name: 'High Street Ground Floor Retail Showroom', category: 'Retail Commercial', price: 85000, originalPrice: 95000, inStock: true, unit: '2,200 sq.ft / month' },
      { id: 'cat-prp-03', name: 'Executive Startup Suite (12 Desks)', category: 'Co-Working', price: 22000, originalPrice: 25000, inStock: true, unit: 'Furnished Suite' },
      { id: 'cat-prp-04', name: 'Prime Banking & ATM Space', category: 'Commercial Banking', price: 35000, originalPrice: 40000, inStock: false, unit: '450 sq.ft' },
    ],
    settlements: [
      { id: 'stl-prp-01', settlementDate: 'Yesterday', grossAmount: 120000, platformFee: 2400, netPayout: 117600, bankAccount: 'Kotak Mahindra •••• 1102', status: 'settled' },
    ],
  },
  {
    id: 'hub-dine-01',
    name: 'Pintu Rasoi Multi-Cuisine - Vidyanagar',
    city: 'Hubballi',
    serviceType: 'restaurant',
    serviceLabel: 'Dineout & Restaurants',
    serviceIcon: 'restaurant-outline',
    category: 'restaurant',
    phone: '9845012305',
    email: 'rasoi.hubballi@pintu.com',
    address: 'Kallur Layout, Near BVB Engineering College, Vidyanagar, Hubballi',
    pincode: '580031',
    isOpen: true,
    rating: 4.8,
    licenseType: 'FSSAI License No.',
    licenseNumber: '11224334000512',
    gstNumber: '29EFGHI5678K5Z9',
    metrics: {
      todaySales: 32400,
      salesGrowth: '+16.8%',
      activeOrders: 8,
      completedToday: 54,
      totalProducts: 65,
      lowStockCount: 4,
    },
    orders: [
      {
        id: 'ord-din-01',
        orderNumber: '#DIN-7721',
        customerName: 'Kavita Nadkarni',
        customerPhone: '9880445566',
        itemsSummary: 'Paneer Butter Masala (1), Butter Naan (4), Veg Dum Biryani (1)',
        totalAmount: 640,
        status: 'preparing',
        timeAgo: '6 mins ago',
        paymentMethod: 'UPI',
        itemCount: 3,
      },
      {
        id: 'ord-din-02',
        orderNumber: '#DIN-7720',
        customerName: 'Sunil Badami',
        customerPhone: '9901778899',
        itemsSummary: 'South Special Thali (2), Fresh Sweet Lime Soda (2)',
        totalAmount: 480,
        status: 'new',
        timeAgo: '11 mins ago',
        paymentMethod: 'Cash on Delivery',
        itemCount: 2,
      },
    ],
    catalogItems: [
      { id: 'cat-din-01', name: 'Paneer Butter Masala (Clay Pot)', category: 'North Indian', price: 240, originalPrice: 270, inStock: true, unit: 'Portion (450g)' },
      { id: 'cat-din-02', name: 'Hyderabadi Veg Dum Biryani', category: 'Biryani & Rice', price: 210, originalPrice: 240, inStock: true, unit: 'Full Handi' },
      { id: 'cat-din-03', name: 'Garlic Butter Naan', category: 'Breads', price: 45, originalPrice: 50, inStock: true, unit: '1 Pc' },
      { id: 'cat-din-04', name: 'Jolada Rotti Oota (North Karnataka Meal)', category: 'Special Thali', price: 180, originalPrice: 200, inStock: true, unit: 'Complete Thali' },
    ],
    settlements: [
      { id: 'stl-din-01', settlementDate: 'Today, 06:00 AM', grossAmount: 29800, platformFee: 894, netPayout: 28906, bankAccount: 'Canara Bank •••• 5590', status: 'settled' },
    ],
  },
  {
    id: 'hub-groc-01',
    name: 'Pintu Fresh Mart - APMC Yard',
    city: 'Hubballi',
    serviceType: 'grocery',
    serviceLabel: 'Grocery & Supermarket',
    serviceIcon: 'cart-outline',
    category: 'grocery',
    phone: '9845012306',
    email: 'freshmart.hubballi@pintu.com',
    address: 'Shop #14, Main APMC Market Yard, Amargol, Hubballi',
    pincode: '580025',
    isOpen: true,
    rating: 4.9,
    licenseType: 'FSSAI License No.',
    licenseNumber: '11224334000888',
    gstNumber: '29FGHIJ6789L6Z1',
    metrics: {
      todaySales: 21900,
      salesGrowth: '+11.5%',
      activeOrders: 5,
      completedToday: 42,
      totalProducts: 310,
      lowStockCount: 8,
    },
    orders: [
      {
        id: 'ord-gro-01',
        orderNumber: '#GRO-6601',
        customerName: 'Anand Kumar',
        customerPhone: '9845012345',
        itemsSummary: 'Farm Fresh Milk (2L), Whole Wheat Bread (1), Farm Eggs (6pcs)',
        totalAmount: 245,
        status: 'preparing',
        timeAgo: '4 mins ago',
        paymentMethod: 'UPI',
        itemCount: 3,
      },
      {
        id: 'ord-gro-02',
        orderNumber: '#GRO-6600',
        customerName: 'Pooja Hegde',
        customerPhone: '9448112345',
        itemsSummary: 'Organic Bananas (1kg), Red Apples (500g), Fresh Mint',
        totalAmount: 180,
        status: 'new',
        timeAgo: '9 mins ago',
        paymentMethod: 'COD',
        itemCount: 3,
      },
      {
        id: 'ord-gro-03',
        orderNumber: '#GRO-6599',
        customerName: 'Suresh Patil',
        customerPhone: '9740512345',
        itemsSummary: 'Basmati Rice (5kg), Fortune Sunflower Oil (1L)',
        totalAmount: 620,
        status: 'out_for_delivery',
        timeAgo: '19 mins ago',
        paymentMethod: 'UPI',
        itemCount: 2,
      },
    ],
    catalogItems: [
      { id: 'cat-gro-01', name: 'Nandini GoodLife Milk', category: 'Dairy & Eggs', price: 32, originalPrice: 34, inStock: true, unit: 'Packet (500ml)' },
      { id: 'cat-gro-02', name: 'Fortune Sunlite Sunflower Oil', category: 'Oils & Ghee', price: 145, originalPrice: 165, inStock: true, unit: 'Pouch (1L)' },
      { id: 'cat-gro-03', name: 'India Gate Basmati Rice Feast', category: 'Rice & Grains', price: 420, originalPrice: 480, inStock: true, unit: 'Bag (5kg)' },
      { id: 'cat-gro-04', name: 'Aashirvaad Shudh Chakki Atta', category: 'Atta & Flours', price: 245, originalPrice: 275, inStock: true, unit: 'Bag (5kg)' },
      { id: 'cat-gro-05', name: 'Tata Salt Vacuum Evaporated', category: 'Spices & Salt', price: 28, originalPrice: 30, inStock: true, unit: 'Packet (1kg)' },
    ],
    settlements: [
      { id: 'stl-gro-01', settlementDate: 'Today, 06:00 AM', grossAmount: 19800, platformFee: 594, netPayout: 19206, bankAccount: 'Canara Bank •••• 1920', status: 'settled' },
    ],
  },

  // =========================================================================
  // DHARWAD STORES
  // =========================================================================
  {
    id: 'dhw-pharm-01',
    name: 'Apollo Pharmacy - Jubilee Circle, Dharwad',
    city: 'Dharwad',
    serviceType: 'pharmacy',
    serviceLabel: 'Pharmacy & Medicines',
    serviceIcon: 'medkit-outline',
    category: 'pharmacy',
    phone: '9845012307',
    email: 'apollo.dharwad@pintu.com',
    address: 'Near Old Bus Stand, Jubilee Circle, PB Road, Dharwad',
    pincode: '580001',
    isOpen: true,
    rating: 4.8,
    licenseType: 'Drug License No.',
    licenseNumber: 'KA-DH-2024-DL-7731',
    gstNumber: '29GHIJK7890M7Z2',
    metrics: {
      todaySales: 15600,
      salesGrowth: '+9.4%',
      activeOrders: 3,
      completedToday: 29,
      totalProducts: 210,
      lowStockCount: 5,
    },
    orders: [
      {
        id: 'ord-dhw-m01',
        orderNumber: '#MED-8101',
        customerName: 'Prof. S. R. Desai',
        customerPhone: '9448223344',
        itemsSummary: 'Revital H Capsule (Strip of 30), Neurobion Forte (Strip of 30)',
        totalAmount: 430,
        status: 'preparing',
        timeAgo: '14 mins ago',
        paymentMethod: 'UPI',
        itemCount: 2,
      },
    ],
    catalogItems: [
      { id: 'cat-dhw-m01', name: 'Revital H Daily Health Capsule', category: 'Supplements', price: 310, originalPrice: 350, inStock: true, unit: 'Bottle of 30' },
      { id: 'cat-dhw-m02', name: 'Neurobion Forte Vitamin B-Complex', category: 'Vitamins', price: 42, originalPrice: 48, inStock: true, unit: 'Strip of 30' },
    ],
    settlements: [
      { id: 'stl-dhw-m01', settlementDate: 'Today, 06:00 AM', grossAmount: 14200, platformFee: 426, netPayout: 13774, bankAccount: 'HDFC Bank •••• 9901', status: 'settled' },
    ],
  },
  {
    id: 'dhw-dine-01',
    name: 'Spice Symphony Family Diner - Dharwad',
    city: 'Dharwad',
    serviceType: 'restaurant',
    serviceLabel: 'Dineout & Restaurants',
    serviceIcon: 'restaurant-outline',
    category: 'restaurant',
    phone: '9845012308',
    email: 'spicesymphony.dhw@pintu.com',
    address: 'Near Line Bazaar, Dharwad',
    pincode: '580001',
    isOpen: true,
    rating: 4.7,
    licenseType: 'FSSAI License No.',
    licenseNumber: '11224334000991',
    gstNumber: '29HIJKL8901N8Z3',
    metrics: {
      todaySales: 28400,
      salesGrowth: '+13.1%',
      activeOrders: 6,
      completedToday: 44,
      totalProducts: 55,
      lowStockCount: 2,
    },
    orders: [
      {
        id: 'ord-dhw-d01',
        orderNumber: '#DIN-6120',
        customerName: 'Ashok Patil',
        customerPhone: '9845998877',
        itemsSummary: 'Kaju Curry Special (1), Roti (6), Dharwad Peda Dessert (250g)',
        totalAmount: 510,
        status: 'preparing',
        timeAgo: '7 mins ago',
        paymentMethod: 'Prepaid UPI',
        itemCount: 3,
      },
    ],
    catalogItems: [
      { id: 'cat-dhw-d01', name: 'Rich Kaju Masala Curry', category: 'North Indian', price: 260, originalPrice: 290, inStock: true, unit: 'Portion (400g)' },
      { id: 'cat-dhw-d02', name: 'Authentic Dharwad Line Bazaar Peda', category: 'Desserts', price: 160, originalPrice: 180, inStock: true, unit: 'Box (250g)' },
    ],
    settlements: [
      { id: 'stl-dhw-d01', settlementDate: 'Today, 06:00 AM', grossAmount: 26500, platformFee: 795, netPayout: 25705, bankAccount: 'Karnataka Bank •••• 7741', status: 'settled' },
    ],
  },

  // =========================================================================
  // BELAGAVI STORES
  // =========================================================================
  {
    id: 'bel-pharm-01',
    name: 'HealthFirst Pharmacy - Tilakwadi, Belagavi',
    city: 'Belagavi',
    serviceType: 'pharmacy',
    serviceLabel: 'Pharmacy & Medicines',
    serviceIcon: 'medkit-outline',
    category: 'pharmacy',
    phone: '9845012309',
    email: 'healthfirst.belagavi@pintu.com',
    address: 'Congress Road, 2nd Gate, Tilakwadi, Belagavi',
    pincode: '590006',
    isOpen: true,
    rating: 4.8,
    licenseType: 'Drug License No.',
    licenseNumber: 'KA-BG-2024-DL-4491',
    gstNumber: '29IJKLM9012O9Z4',
    metrics: {
      todaySales: 16200,
      salesGrowth: '+11.0%',
      activeOrders: 3,
      completedToday: 32,
      totalProducts: 225,
      lowStockCount: 4,
    },
    orders: [
      {
        id: 'ord-bel-m01',
        orderNumber: '#MED-7021',
        customerName: 'Rahul Shinde',
        customerPhone: '9822114455',
        itemsSummary: 'Betadine 10% Ointment (20g), Cotton Roll (500g), Band-Aid (Box of 20)',
        totalAmount: 240,
        status: 'ready',
        timeAgo: '16 mins ago',
        paymentMethod: 'UPI',
        itemCount: 3,
      },
    ],
    catalogItems: [
      { id: 'cat-bel-m01', name: 'Betadine Antiseptic Ointment 10%', category: 'First Aid', price: 110, originalPrice: 125, inStock: true, unit: 'Tube (20g)' },
      { id: 'cat-bel-m02', name: 'Dettol Antiseptic Liquid', category: 'Hygiene', price: 190, originalPrice: 215, inStock: true, unit: 'Bottle (550ml)' },
    ],
    settlements: [
      { id: 'stl-bel-m01', settlementDate: 'Today, 06:00 AM', grossAmount: 14800, platformFee: 444, netPayout: 14356, bankAccount: 'Axis Bank •••• 3311', status: 'settled' },
    ],
  },
  {
    id: 'bel-prop-01',
    name: 'Belagavi IT Park & Commercial Spaces',
    city: 'Belagavi',
    serviceType: 'property',
    serviceLabel: 'Properties & Real Estate',
    serviceIcon: 'business-outline',
    category: 'property',
    phone: '9845012310',
    email: 'itpark.belagavi@pintu.com',
    address: 'Udyambag Industrial & IT Corridor, Belagavi',
    pincode: '590008',
    isOpen: true,
    rating: 4.9,
    licenseType: 'Karnataka RERA Reg.',
    licenseNumber: 'PRM/KA/RERA/1251/309/PR/240212/008899',
    gstNumber: '29JKLMN0123P0Z5',
    metrics: {
      todaySales: 95000,
      salesGrowth: '+15.5%',
      activeOrders: 4,
      completedToday: 1,
      totalProducts: 12,
      lowStockCount: 1,
    },
    orders: [
      {
        id: 'ord-bel-p01',
        orderNumber: '#PRP-2041',
        customerName: 'Kirloskar Systems Engineering',
        customerPhone: '9822339900',
        itemsSummary: 'Light Industrial Assembly Unit 3,200 Sq.Ft Lease Token Booking',
        totalAmount: 45000,
        status: 'preparing',
        timeAgo: '42 mins ago',
        paymentMethod: 'RTGS',
        itemCount: 1,
      },
    ],
    catalogItems: [
      { id: 'cat-bel-p01', name: 'Modern Warehouse & Distribution Bay', category: 'Industrial & Logistics', price: 75000, originalPrice: 85000, inStock: true, unit: '4,500 sq.ft / month' },
      { id: 'cat-bel-p02', name: 'Software Development Office Bay', category: 'IT Office', price: 38000, originalPrice: 42000, inStock: true, unit: '1,500 sq.ft / month' },
    ],
    settlements: [
      { id: 'stl-bel-p01', settlementDate: 'Yesterday', grossAmount: 90000, platformFee: 1800, netPayout: 88200, bankAccount: 'Bank of Baroda •••• 6610', status: 'settled' },
    ],
  },

  // =========================================================================
  // BENGALURU STORES
  // =========================================================================
  {
    id: 'blr-pharm-01',
    name: 'Apollo Pharmacy - Indiranagar, Bengaluru',
    city: 'Bengaluru',
    serviceType: 'pharmacy',
    serviceLabel: 'Pharmacy & Medicines',
    serviceIcon: 'medkit-outline',
    category: 'pharmacy',
    phone: '9845012311',
    email: 'apollo.indiranagar@pintu.com',
    address: '100 Feet Road, HAL 2nd Stage, Indiranagar, Bengaluru',
    pincode: '560038',
    isOpen: true,
    rating: 4.9,
    licenseType: 'Drug License No.',
    licenseNumber: 'KA-BLR-2024-DL-11002',
    gstNumber: '29KLMNO1234Q1Z6',
    metrics: {
      todaySales: 34500,
      salesGrowth: '+19.5%',
      activeOrders: 9,
      completedToday: 68,
      totalProducts: 480,
      lowStockCount: 7,
    },
    orders: [
      {
        id: 'ord-blr-m01',
        orderNumber: '#BLR-901',
        customerName: 'Aditya Sen',
        customerPhone: '9845667788',
        itemsSummary: 'Accu-Chek Active Strips (50s), Glucobay 50mg, Januvia 100mg',
        totalAmount: 1840,
        status: 'preparing',
        timeAgo: '3 mins ago',
        paymentMethod: 'UPI',
        itemCount: 3,
      },
    ],
    catalogItems: [
      { id: 'cat-blr-m01', name: 'Accu-Chek Active Glucometer Strips', category: 'Diabetes Care', price: 920, originalPrice: 1050, inStock: true, unit: 'Box of 50' },
      { id: 'cat-blr-m02', name: 'Januvia 100mg Tablet', category: 'Diabetes Care', price: 440, originalPrice: 480, inStock: true, unit: 'Strip of 7' },
    ],
    settlements: [
      { id: 'stl-blr-m01', settlementDate: 'Today, 06:00 AM', grossAmount: 31200, platformFee: 936, netPayout: 30264, bankAccount: 'HDFC Bank •••• 1209', status: 'settled' },
    ],
  },
  {
    id: 'blr-lab-01',
    name: 'Thyrocare Diagnostics - HSR Layout, Bengaluru',
    city: 'Bengaluru',
    serviceType: 'lab_test',
    serviceLabel: 'Diagnostics & Lab Tests',
    serviceIcon: 'flask-outline',
    category: 'lab_test',
    phone: '9845012312',
    email: 'thyrocare.hsr@pintu.com',
    address: '17th Cross, Sector 4, HSR Layout, Bengaluru',
    pincode: '560102',
    isOpen: true,
    rating: 4.9,
    licenseType: 'NABL Accreditation No.',
    licenseNumber: 'NABL-MED-BLR-2024-998',
    gstNumber: '29LMNOP2345R2Z7',
    metrics: {
      todaySales: 41200,
      salesGrowth: '+24.0%',
      activeOrders: 7,
      completedToday: 28,
      totalProducts: 52,
      lowStockCount: 0,
    },
    orders: [
      {
        id: 'ord-blr-l01',
        orderNumber: '#BLR-LAB-331',
        customerName: 'Vikram Mehta',
        customerPhone: '9900998811',
        itemsSummary: 'Aarogyam C Advanced Metabolic Health Checkup (72 Tests)',
        totalAmount: 1899,
        status: 'new',
        timeAgo: '10 mins ago',
        paymentMethod: 'Prepaid Online',
        itemCount: 1,
      },
    ],
    catalogItems: [
      { id: 'cat-blr-l01', name: 'Aarogyam 1.3 Advanced Wellness Check', category: 'Wellness Packages', price: 1899, originalPrice: 3500, inStock: true, unit: 'Package (72 Tests)' },
      { id: 'cat-blr-l02', name: 'Cardiac Risk Biomarkers Panel', category: 'Cardiology', price: 1250, originalPrice: 1900, inStock: true, unit: 'Blood Serum' },
    ],
    settlements: [
      { id: 'stl-blr-l01', settlementDate: 'Today, 06:00 AM', grossAmount: 38900, platformFee: 1167, netPayout: 37733, bankAccount: 'Citibank •••• 5521', status: 'settled' },
    ],
  },
];

@Injectable({
  providedIn: 'root',
})
export class StoreService {
  private appRef = inject(ApplicationRef);
  private stores: VendorStore[] = [...INITIAL_STORES];

  private activeStoreSubject = new BehaviorSubject<VendorStore>(this.getInitialStore());
  public activeStore$: Observable<VendorStore> = this.activeStoreSubject.asObservable();

  // Angular Signal for instant template reactivity
  public activeStore = signal<VendorStore>(this.getInitialStore());

  // Signal of available cities
  public availableCities = computed(() => this.getCities());

  constructor() {}

  private getInitialStore(): VendorStore {
    const savedId = localStorage.getItem(ACTIVE_STORE_KEY);
    if (savedId) {
      const match = this.stores.find((s) => s.id === savedId);
      if (match) return match;
    }
    return this.stores[0];
  }

  public getAllStores(): VendorStore[] {
    return [...this.stores];
  }

  public getActiveStore(): VendorStore {
    return this.activeStoreSubject.value;
  }

  /**
   * Get all unique cities where vendor has stores
   */
  public getCities(): string[] {
    const citySet = new Set(this.stores.map((s) => s.city));
    return Array.from(citySet);
  }

  /**
   * Get all service types available in a specific city (or all cities)
   */
  public getServiceTypes(city?: string): { type: StoreServiceType; label: string; icon: string; count: number }[] {
    const filtered = city ? this.stores.filter((s) => s.city.toLowerCase() === city.toLowerCase()) : this.stores;
    const map = new Map<StoreServiceType, { label: string; icon: string; count: number }>();

    for (const store of filtered) {
      if (!map.has(store.serviceType)) {
        map.set(store.serviceType, {
          label: store.serviceLabel,
          icon: store.serviceIcon,
          count: 1,
        });
      } else {
        const curr = map.get(store.serviceType)!;
        curr.count++;
      }
    }

    return Array.from(map.entries()).map(([type, data]) => ({
      type,
      label: data.label,
      icon: data.icon,
      count: data.count,
    }));
  }

  /**
   * Get stores matching specific City and Service Type
   */
  public getStoresByCityAndService(city: string, serviceType: StoreServiceType): VendorStore[] {
    return this.stores.filter(
      (s) => s.city.toLowerCase() === city.toLowerCase() && s.serviceType === serviceType
    );
  }

  /**
   * Switch the active store
   */
  public setActiveStore(storeId: string): void {
    const found = this.stores.find((s) => s.id === storeId);
    if (found) {
      localStorage.setItem(ACTIVE_STORE_KEY, found.id);
      const cloned: VendorStore = {
        ...found,
        metrics: { ...found.metrics },
        orders: [...found.orders],
        catalogItems: [...found.catalogItems],
        settlements: [...found.settlements],
      };
      this.activeStore.set(cloned);
      this.activeStoreSubject.next(cloned);
      try {
        this.appRef.tick();
      } catch (e) {
        // AppRef may already be ticking in some event loops
      }
    }
  }

  /**
   * Toggle online/paused status for the active store
   */
  public toggleActiveStoreStatus(): boolean {
    const curr = this.getActiveStore();
    const nextStatus = !curr.isOpen;

    // Update in master stores array so switcher cards reflect the status
    const storeInMaster = this.stores.find((s) => s.id === curr.id);
    if (storeInMaster) {
      storeInMaster.isOpen = nextStatus;
    }

    const cloned: VendorStore = {
      ...curr,
      isOpen: nextStatus,
      metrics: { ...curr.metrics },
      orders: [...curr.orders],
      catalogItems: [...curr.catalogItems],
      settlements: [...curr.settlements],
    };

    this.activeStore.set(cloned);
    this.activeStoreSubject.next(cloned);
    try {
      this.appRef.tick();
    } catch (e) {
      // AppRef may already be ticking
    }
    return nextStatus;
  }
}

