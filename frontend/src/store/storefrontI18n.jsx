import React, { createContext, useContext, useState, useEffect } from 'react';

const StorefrontI18nContext = createContext(null);

const STORAGE_KEY = 'maqder_storefront_lang';

const translations = {
  en: {
    // Header
    search: 'Search products...',
    products: 'Products',
    cart: 'Cart',
    wishlist: 'Wishlist',
    home: 'Home',
    // Home
    shopNow: 'Shop Now',
    viewAll: 'View all',
    featuredProducts: 'Featured Products',
    categories: 'Categories',
    subscribe: 'Subscribe',
    emailPlaceholder: 'Email address',
    // Products
    allProducts: 'All Products',
    noProducts: 'No products found',
    soldOut: 'Sold Out',
    addedToCart: 'Added to cart',
    addedToWishlist: 'Added to wishlist',
    removedFromWishlist: 'Removed from wishlist',
    tryAdjusting: 'Try adjusting your search or filters',
    productsCount: 'products',
    newest: 'Newest',
    priceLow: 'Price: Low to High',
    priceHigh: 'Price: High to Low',
    mostPopular: 'Most Popular',
    filters: 'Filters',
    priceRange: 'Price:',
    availability: 'Availability:',
    inStockOnly: 'In Stock Only',
    loadMore: 'Load More Products',
    compareNow: 'Compare Now',
    noImage: 'No image',
    page: 'Page',
    of: 'of',
    // Product detail
    description: 'Description',
    options: 'Options:',
    quantity: 'Quantity',
    addToCart: 'Add to Cart',
    added: 'Added!',
    estimatedDelivery: 'Estimated delivery',
    youMayAlsoLike: 'You may also like',
    recentlyViewed: 'Recently Viewed',
    customerReviews: 'Customer Reviews',
    reviews: 'reviews',
    writeReview: 'Write a Review',
    yourName: 'Your name *',
    emailOptional: 'Email (optional)',
    rating: 'Rating:',
    reviewTitle: 'Review title (optional)',
    yourReview: 'Your review (optional)',
    submitReview: 'Submit Review',
    reviewSubmitted: 'Review submitted! It will appear after approval.',
    verified: 'Verified',
    // Cart
    yourCartIsEmpty: 'Your cart is empty',
    cartIsEmpty: 'Cart is empty',
    checkout: 'Checkout',
    total: 'Total',
    subtotal: 'Subtotal',
    shipping: 'Shipping',
    calculatedAtCheckout: 'Calculated at checkout',
    free: 'Free',
    discount: 'Discount',
    couponCode: 'Coupon code',
    apply: 'Apply',
    placeOrder: 'Place Order',
    // Checkout
    shippingDetails: 'Shipping Details',
    fullName: 'Full Name *',
    phone: 'Phone *',
    city: 'City',
    region: 'Region / Province',
    postalCode: 'Postal Code',
    country: 'Country',
    addressLine1: 'Address Line 1',
    orderNotes: 'Order Notes',
    optionalNotes: 'Optional notes for the seller',
    paymentMethod: 'Payment Method',
    cashOnDelivery: 'Cash on Delivery',
    creditCard: 'Credit Card',
    orderSummary: 'Order Summary',
    streetAddress: 'Street address',
    // Success/Cancel
    thankYou: 'Thank You!',
    orderPlacedSuccess: 'Your order has been placed successfully.',
    orderConfirmed: 'Order Confirmed',
    wellProcessShortly: "We'll process your order shortly",
    shippingUpdates: 'Shipping Updates',
    receiveUpdates: "You'll receive updates as your order ships",
    continueShopping: 'Continue Shopping',
    paymentCancelled: 'Payment Cancelled',
    paymentCancelledDesc: 'Your payment was cancelled and no charges were made.',
    retryCheckout: 'Retry Checkout',
    orderNumber: 'Order',
    // Wishlist
    myWishlist: 'My Wishlist',
    wishlistEmpty: 'Your wishlist is empty',
    saveItemsLater: 'Save items you love for later.',
    browseProducts: 'Browse products',
    add: 'Add',
    // Trust badges
    freeShipping: 'Free Shipping',
    freeShippingSub: 'On orders over 200 SAR',
    securePayment: 'Secure Payment',
    securePaymentSub: '100% protected checkout',
    easyReturns: 'Easy Returns',
    easyReturnsSub: '7-day return policy',
    dedicatedSupport: 'Dedicated Support',
    dedicatedSupportSub: "We're here to help",
    // Footer
    shop: 'Shop',
    help: 'Help',
    compare: 'Compare',
    myAccount: 'My Account',
    trackOrder: 'Track Order',
    returnsRefunds: 'Returns & Refunds',
    shippingPolicy: 'Shipping Policy',
    faq: 'FAQ',
    contactUs: 'Contact Us',
    getInTouch: 'Get in Touch',
    weAccept: 'We accept',
    subscribeForOffers: 'Subscribe for exclusive offers',
    yourEmail: 'Your email',
    thanksSubscribing: '✓ Thanks for subscribing!',
    contactSupport: 'Contact our support team',
  },
  ar: {
    // Header
    search: 'ابحث عن المنتجات...',
    products: 'المنتجات',
    cart: 'السلة',
    wishlist: 'المفضلة',
    home: 'الرئيسية',
    // Home
    shopNow: 'تسوق الآن',
    viewAll: 'عرض الكل',
    featuredProducts: 'المنتجات المميزة',
    categories: 'الفئات',
    subscribe: 'اشترك',
    emailPlaceholder: 'البريد الإلكتروني',
    // Products
    allProducts: 'جميع المنتجات',
    noProducts: 'لا توجد منتجات',
    soldOut: 'نفذت الكمية',
    addedToCart: 'تمت الإضافة إلى السلة',
    addedToWishlist: 'تمت الإضافة إلى المفضلة',
    removedFromWishlist: 'تمت الإزالة من المفضلة',
    tryAdjusting: 'حاول تعديل البحث أو المرشحات',
    productsCount: 'منتجات',
    newest: 'الأحدث',
    priceLow: 'السعر: من الأقل إلى الأعلى',
    priceHigh: 'السعر: من الأعلى إلى الأقل',
    mostPopular: 'الأكثر شعبية',
    filters: 'تصفية',
    priceRange: 'السعر:',
    availability: 'التوفر:',
    inStockOnly: 'متوفر فقط',
    loadMore: 'تحميل المزيد من المنتجات',
    compareNow: 'قارن الآن',
    noImage: 'لا توجد صورة',
    page: 'صفحة',
    of: 'من',
    // Product detail
    description: 'الوصف',
    options: 'الخيارات:',
    quantity: 'الكمية',
    addToCart: 'أضف إلى السلة',
    added: 'تمت الإضافة!',
    estimatedDelivery: 'التوصيل المتوقع',
    youMayAlsoLike: 'قد يعجبك أيضاً',
    recentlyViewed: 'شوهد مؤخراً',
    customerReviews: 'تقييمات العملاء',
    reviews: 'تقييم',
    writeReview: 'اكتب تقييماً',
    yourName: 'الاسم *',
    emailOptional: 'البريد الإلكتروني (اختياري)',
    rating: 'التقييم:',
    reviewTitle: 'عنوان التقييم (اختياري)',
    yourReview: 'تقييمك (اختياري)',
    submitReview: 'إرسال التقييم',
    reviewSubmitted: 'تم إرسال التقييم! سيظهر بعد الموافقة.',
    verified: 'موثق',
    // Cart
    yourCartIsEmpty: 'سلتك فارغة',
    cartIsEmpty: 'السلة فارغة',
    checkout: 'الدفع',
    total: 'الإجمالي',
    subtotal: 'المجموع الفرعي',
    shipping: 'الشحن',
    calculatedAtCheckout: 'يحسب عند الدفع',
    free: 'مجاني',
    discount: 'الخصم',
    couponCode: 'رمز الخصم',
    apply: 'تطبيق',
    placeOrder: 'تأكيد الطلب',
    // Checkout
    shippingDetails: 'تفاصيل الشحن',
    fullName: 'الاسم الكامل *',
    phone: 'الهاتف *',
    city: 'المدينة',
    region: 'المنطقة / المقاطعة',
    postalCode: 'الرمز البريدي',
    country: 'الدولة',
    addressLine1: 'العنوان',
    orderNotes: 'ملاحظات الطلب',
    optionalNotes: 'ملاحظات اختيارية للبائع',
    paymentMethod: 'طريقة الدفع',
    cashOnDelivery: 'الدفع عند الاستلام',
    creditCard: 'بطاقة ائتمان',
    orderSummary: 'ملخص الطلب',
    streetAddress: 'عنوان الشارع',
    // Success/Cancel
    thankYou: 'شكراً لك!',
    orderPlacedSuccess: 'تم تأكيد طلبك بنجاح.',
    orderConfirmed: 'تم تأكيد الطلب',
    wellProcessShortly: 'سنقوم بمعالجة طلبك قريباً',
    shippingUpdates: 'تحديثات الشحن',
    receiveUpdates: 'ستتلقى تحديثات عند شحن طلبك',
    continueShopping: 'متابعة التسوق',
    paymentCancelled: 'تم إلغاء الدفع',
    paymentCancelledDesc: 'تم إلغاء دفعتك ولم يتم خصم أي مبالغ.',
    retryCheckout: 'إعادة المحاولة',
    orderNumber: 'طلب',
    // Wishlist
    myWishlist: 'قائمة المفضلة',
    wishlistEmpty: 'قائمة المفضلة فارغة',
    saveItemsLater: 'احفظ المنتجات التي تحبها لوقت لاحق.',
    browseProducts: 'تصفح المنتجات',
    add: 'أضف',
    // Trust badges
    freeShipping: 'شحن مجاني',
    freeShippingSub: 'للطلبات فوق 200 ريال',
    securePayment: 'دفع آمن',
    securePaymentSub: 'دفع محمي 100%',
    easyReturns: 'إرجاع سهل',
    easyReturnsSub: 'سياسة إرجاع خلال 7 أيام',
    dedicatedSupport: 'دعم مخصص',
    dedicatedSupportSub: 'نحن هنا لمساعدتك',
    // Footer
    shop: 'تسوق',
    help: 'مساعدة',
    compare: 'مقارنة',
    myAccount: 'حسابي',
    trackOrder: 'تتبع الطلب',
    returnsRefunds: 'الإرجاع والاسترداد',
    shippingPolicy: 'سياسة الشحن',
    faq: 'الأسئلة الشائعة',
    contactUs: 'اتصل بنا',
    getInTouch: 'تواصل معنا',
    weAccept: 'نقبل',
    subscribeForOffers: 'اشترك للعروض الحصرية',
    yourEmail: 'بريدك الإلكتروني',
    thanksSubscribing: '✓ شكراً لاشتراكك!',
    contactSupport: 'تواصل مع فريق الدعم',
  },
};

export function StorefrontI18nProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || 'en';
    } catch {
      return 'en';
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang);
    // Set document direction
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  const toggleLang = () => setLang(prev => prev === 'en' ? 'ar' : 'en');

  const t = (key) => translations[lang]?.[key] || translations.en[key] || key;

  const value = { lang, toggleLang, t, isRTL: lang === 'ar' };

  return <StorefrontI18nContext.Provider value={value}>{children}</StorefrontI18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(StorefrontI18nContext);
  if (!ctx) return { lang: 'en', toggleLang: () => {}, t: (k) => k, isRTL: false };
  return ctx;
}
