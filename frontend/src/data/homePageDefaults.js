// Default home page content. The admin "Home page" editor saves overrides to
// site content (homePage); anything not overridden falls back to these values.

export const HOME_SECTIONS = [
  { key: "heroCarousel", label: "Hero Carousel" },
  { key: "hero", label: "Static Hero banner" },
  { key: "trustStrip", label: "Trust strip" },
  { key: "services", label: "Gifting services" },
  { key: "featuredCollections", label: "Featured collections" },
  { key: "bestSellers", label: "Best sellers" },
  { key: "brands", label: "Brands" },
  { key: "brandStory", label: "Brand story" },
  { key: "promoBanner", label: "Promotional banner" },
  { key: "newArrivals", label: "New arrivals" },
  { key: "reassurance", label: "How we work" },
  { key: "testimonials", label: "Testimonials" },
  { key: "newsletter", label: "Catalogue request" },
];

export const HOME_PAGE_DEFAULTS = {
  sections: Object.fromEntries(HOME_SECTIONS.map((s) => [s.key, true])),

  heroCarousel: {
    enabled: true,
    autoplay: true,
    interval: 5,
    slides: [
      {
        id: "slide-1",
        badge: "Christmas Special · 20% Off Bulk Orders",
        title: "Christmas Bulk Orders For Clients & Teams",
        subtitle: "Celebrate the festive season with curated luxury gift hampers, insulated bottles, gourmet treats, and keepsake gift boxes finished with your company logo branding.",
        primaryCtaText: "Explore Christmas Hampers",
        primaryCtaLink: "/products?search=Hamper",
        secondaryCtaText: "Request Bulk Quote",
        secondaryCtaLink: "/cart",
        image: "/uploads/carousel-christmas-bulk-orders.jpg",
        imageAlt: "Christmas Bulk Orders - 20% Off on Bulk Orders for Clients & Teams",
        tagTitle: "20% Off Bulk Orders",
        tagText: "Flat 20% discount on institutional corporate orders",
        isActive: true,
      },
      {
        id: "slide-2",
        badge: "Diwali Celebration · 20% Off Bulk Orders",
        title: "Diwali Bulk Orders For Valued Clients & Teams",
        subtitle: "Handcrafted brass diyas, artisanal sweets, gourmet dry fruits, and bespoke corporate celebration hampers. Delivered with custom greeting cards pan-India.",
        primaryCtaText: "Browse Diwali Hampers",
        primaryCtaLink: "/products?search=Festive",
        secondaryCtaText: "Send Order Enquiry",
        secondaryCtaLink: "/cart",
        image: "/uploads/carousel-diwali-bulk-orders.jpg",
        imageAlt: "Diwali Bulk Orders - 20% Off on Bulk Orders for Valued Clients & Teams",
        tagTitle: "Festive Bestseller",
        tagText: "Free digital sample proof with custom corporate packaging",
        isActive: true,
      },
      {
        id: "slide-3",
        badge: "New Year 2026 · 20% Off Bulk Orders",
        title: "New Year 2026 Bulk Orders & Executive Kits",
        subtitle: "Start the new year with premium welcome merchandise, smart drinkware, custom-printed desk accessories, and branded team celebration gifts.",
        primaryCtaText: "View New Year Catalogue",
        primaryCtaLink: "/products",
        secondaryCtaText: "Get Volume Pricing",
        secondaryCtaLink: "/cart",
        image: "/uploads/carousel-new-year-bulk-orders.jpg",
        imageAlt: "New Year 2026 Bulk Orders - 20% Off on Bulk Orders",
        tagTitle: "Pan-India Multi-City",
        tagText: "Direct doorstep delivery to remote teams across India",
        isActive: true,
      },
    ],
  },

  hero: {
    title: "Gifts your clients and teams will keep.",
    lead: "Hampers, onboarding kits, drinkware and merchandise from brands people know, finished with your logo and delivered from Hyderabad.",
    primaryCtaText: "Browse the catalogue",
    primaryCtaLink: "/products",
    secondaryCtaText: "Request a bulk quote",
    image: "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?auto=format&fit=crop&w=1100&q=80",
    imageAlt: "Stack of wrapped gift boxes tied with ribbon",
    tagTitle: "See it before you order",
    tagText: "Free digital sample on bulk orders",
    promises: ["Your logo printed or engraved", "GST invoice on every order", "Delivered across India"],
  },

  trustStrip: {
    items: [
      { icon: "fa-solid fa-wand-magic-sparkles", title: "Custom Logo Branding", description: "Precision Digital UV printing, laser engraving, and screen print on every item." },
      { icon: "fa-solid fa-receipt", title: "Official B2B GST 18% Invoices", description: "100% compliant business invoices provided for input tax credit on all bulk dispatches." },
      { icon: "fa-solid fa-truck-fast", title: "Pan-India Multi-City Delivery", description: "Doorstep delivery to remote employee residences or consolidated branch shipments." },
      { icon: "fa-solid fa-boxes-stacked", title: "Tiered Volume Pricing", description: "Institutional discounts, free digital sample proofs, and dedicated account manager." },
    ],
  },

  newArrivals: {
    title: "New Season Gifting Arrivals",
    subtitle: "Innovative tech gadgets, insulated drinkware, and sustainable gift sets recently added.",
  },

  bestSellers: {
    title: "Trending Corporate Bestsellers",
    subtitle: "Handpicked executive drinkware, onboarding kits, and custom-branded gifts.",
  },

  featuredCollections: {
    title: "Curated Gifts for Every Occasion.",
    subtitle: "Discover precision-branded executive merchandise, onboarding gift kits, and festive hampers.",
    items: [
      {
        title: "Executive Bottles & Mugs",
        description: "Vacuum insulated temperature-retaining flasks, eco bamboo tumblers, and cork-base ceramic mugs tailored for desk and travel.",
        image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=1000&q=80",
        link: "/products?search=Mug",
        tag: "High Volume · Laser Engraved",
      },
      {
        title: "Bags & Executive Backpacks",
        description: "Ballistic nylon laptop bags, gym duffles, and sustainable biodegradable jute conference totes.",
        image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80",
        link: "/products?search=Bag",
        tag: "Custom Logo Badging",
      },
      {
        title: "Smart Tech & Gadgets",
        description: "High-speed power banks, Bluetooth speakers, wireless earbuds, and smart wearable fitness trackers.",
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
        link: "/products?search=Speaker",
        tag: "1-Year Brand Warranty",
      },
      {
        title: "Festive & Diwali Hampers",
        description: "Artisanal dry fruit boxes, handcrafted brass diyas, luxury confectionery, and executive New Year planners.",
        image: "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?auto=format&fit=crop&w=800&q=80",
        link: "/products?search=Hamper",
        tag: "Seasonal Bestseller",
      },
    ],
  },

  promoBanner: {
    kicker: "Diwali & Festive 2026 Collection",
    title: "Bespoke Hampers for Valued Clients & Teams.",
    text: "Early-bird bookings are now open. Enjoy customized packaging, company greeting cards, and guaranteed delivery dates for your festival celebrations.",
    ctaText: "Explore Festive Hampers",
    ctaLink: "/products?search=Festive",
    note: "Complimentary corporate logo branding on orders of 50+ units",
    image: "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?auto=format&fit=crop&w=1200&q=85",
    imageAlt: "Artisanal Diwali and festive corporate gift hamper",
  },

  reassurance: {
    title: "Seamless Corporate Gifting, End-to-End",
    subtitle: "From digital proofing to doorstep distribution, we manage every detail so you can focus on your business.",
    items: [
      { icon: "fa-solid fa-wand-magic-sparkles", title: "Free Digital Mockup Proofs", detail: "See your company logo rendered on any mug, bottle, backpack, or pen within 24 hours before manufacturing.", actionText: "Request Mockup", link: "/products", badge: "24h Turnaround" },
      { icon: "fa-solid fa-receipt", title: "B2B GST Tax Invoicing", detail: "Official 18% GST tax invoices generated with your company GSTIN to claim full corporate input tax credit.", actionText: "Billing Info", link: "/products", badge: "100% Compliant" },
      { icon: "fa-solid fa-truck-fast", title: "Multi-Address Delivery", detail: "Effortlessly send gifts to 100+ remote employee home residences or single consolidated company branches.", actionText: "Delivery Specs", link: "/products", badge: "Pan-India" },
      { icon: "fa-solid fa-headset", title: "Dedicated B2B Concierge", detail: "Direct WhatsApp and phone assistance for corporate quotes, bulk tier discounts, and order dispatch tracking.", actionText: "Get In Touch", link: "/products", badge: "Priority Care" },
    ],
  },

  testimonials: {
    title: "What clients say",
    subtitle: "The kind of orders we handle for HR, procurement and leadership teams.",
    // Placeholder copy until real client testimonials are supplied; marked "Sample" on the page.
    isSample: true,
    items: [
      { name: "Ritu Sengupta", location: "Bengaluru", role: "VP Human Resources, Fintech Solutions", rating: 5, title: "Flawless Branding & Fast Delivery for 450 Employee Kits", comment: "We ordered 450 custom welcome kits with ceramic cork mugs and hardbound bamboo notebooks for our annual company offsite. Every single piece had our logo engraved with crisp perfection. Delivery was 2 days ahead of schedule!", item: "Executive Cork Ceramic Mug & Notebook Set" },
      { name: "Vikramaditya Singhania", location: "Mumbai", role: "Managing Director, Apex Capital", rating: 5, title: "Diwali Hampers That Truly Impressed Our Top Tier Clients", comment: "Our C-suite banking partners were thrilled with the presentation of the Royal Brass Diya and gourmet dry fruit gift boxes. Elegant, rich, and zero hassle with individual multi-city dispatches.", item: "Royal Artisanal Diwali Gourmet Hamper" },
      { name: "Neha Deshmukh", location: "Hyderabad", role: "Head of Procurement, CloudTech Global", rating: 5, title: "Exceptional Quality on 800+ Smart Temperature Bottles", comment: "From receiving digital sample proofs in 24 hours to getting official GST invoices for tax credit, the entire procurement process was seamless. The smart temperature LED display is a huge hit among our developers.", item: "Smart Temp Vacuum Insulated Flask 500ml" },
    ],
  },

  newsletter: {
    title: "Get the corporate catalogue",
    text: "Tell us where to send it. Our team emails the current catalogue with volume pricing, usually within two working hours.",
    buttonText: "Send me the catalogue",
  },
};

/** Merge saved overrides onto the defaults, one level deep per section (arrays replace). */
export const mergeHomePage = (saved = {}) => {
  const out = {};
  for (const [key, def] of Object.entries(HOME_PAGE_DEFAULTS)) {
    const value = saved?.[key];
    out[key] = value && typeof value === "object" && !Array.isArray(value) ? { ...def, ...value } : def;
  }
  return out;
};
