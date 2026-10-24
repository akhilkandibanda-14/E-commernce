import { getAdminApiUrl } from "../utils/apiConfig";
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  BRANDED_GIFTING as DEFAULT_BRANDS,
  SERVICES_DATA as DEFAULT_SERVICES,
  FESTIVE_GIFTS as DEFAULT_FESTIVE,
  CONTACT_INFO as DEFAULT_CONTACT,
  GIFTING_CATEGORIES as DEFAULT_GIFTING_CATEGORIES,
} from "../data/navigationData";

const DEFAULT_ABOUT_US = {
  kicker: "Corporate Partnership",
  title: "Gifts That Build Real Connections.",
  lead: "We believe corporate gifting shouldn’t feel like cheap disposable giveaways. A truly thoughtful gift strengthens relationships, honors team milestones, and leaves an enduring impression.",
  paragraphs: [
    "Atelier Gifting Solutions partners directly with enterprises, HR directors, and event coordinators across India. From temperature-controlled vacuum drinkware and handcrafted diaries to authorized audio tech from JBL, boAt, and Cross, we curate collections that recipients genuinely cherish and use every single day.",
  ],
  image: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=1000&q=80",
  captionYear: "ATELIER B2B LAB",
  captionDetail: "Custom Gift Packaging & Precision Engraving",
  pillars: [
    {
      id: "pillar-1",
      icon: "fa-solid fa-stamp",
      title: "Flawless Brand Co-Branding",
      description: "Digital UV color printing, high-precision laser engraving, and blind debossing aligned with your brand guidelines.",
    },
    {
      id: "pillar-2",
      icon: "fa-solid fa-truck-ramp-box",
      title: "Pan-India Direct-to-Door Fulfillment",
      description: "Send 50 or 5,000 gifts seamlessly to consolidated headquarters or individually to remote team members across India.",
    },
  ],
  buttonText: "Explore Corporate Catalog",
  buttonLink: "/products",
};

const DEFAULT_ANNOUNCEMENT = {
  badge: "🎁 CORPORATE & FESTIVE GIFTING",
  text: "Custom logo branding on 10,000+ items · Free digital sample on bulk orders · Pan-India delivery.",
  downloadText: "Download Catalogues",
  enquiryText: "Enquiry for Bulk Orders",
};

export const DEFAULT_NAVIGATION = {
  brandLogo: {
    text: "ATELIER",
    subtext: "GIFTS & CO.",
    icon: "fa-solid fa-gift",
  },
  items: [
    { id: "nav-home", key: "home", label: "Home", type: "link", path: "/", icon: "fa-solid fa-house", enabled: true, order: 1 },
    { id: "nav-about", key: "about", label: "About Us", type: "link", path: "#brand-story", icon: "fa-solid fa-circle-info", enabled: true, order: 2 },
    { id: "nav-services", key: "services", label: "Services", type: "dropdown", icon: "fa-solid fa-handshake", badge: "", enabled: true, order: 3 },
    { id: "nav-categories", key: "categories", label: "Gifting Categories", type: "dropdown", icon: "fa-solid fa-gift", badge: "", enabled: true, order: 4 },
    { id: "nav-branded", key: "branded", label: "Branded Gifting", type: "dropdown", icon: "fa-solid fa-crown", badge: "", enabled: true, order: 5 },
    { id: "nav-festive", key: "festive", label: "Festive Gifts", type: "dropdown", icon: "fa-solid fa-sparkles", badge: "✨", enabled: true, order: 6 },
    { id: "nav-contact", key: "contact", label: "Contact Us", type: "dropdown", icon: "fa-solid fa-phone", badge: "", enabled: true, order: 7 },
  ],
  actions: {
    downloadCatalogues: {
      enabled: true,
      label: "Download Catalogues",
      icon: "fa-solid fa-file-arrow-down",
    },
    bulkEnquiry: {
      enabled: true,
      label: "Enquiry for Bulk Orders",
      icon: "fa-solid fa-paper-plane",
    },
  },
};

const SiteContentContext = createContext(null);

export const SiteContentProvider = ({ children }) => {
  const [content, setContent] = useState({
    brands: DEFAULT_BRANDS.map((b, idx) => ({
      id: `brand-${idx + 1}`,
      name: b.name,
      category: b.category,
      tag: b.tag || "",
      description: "",
      link: `/products?search=${encodeURIComponent(b.name)}`,
    })),
    aboutUs: DEFAULT_ABOUT_US,
    services: DEFAULT_SERVICES,
    festiveGifts: DEFAULT_FESTIVE,
    contactInfo: DEFAULT_CONTACT,
    announcement: DEFAULT_ANNOUNCEMENT,
    navigation: DEFAULT_NAVIGATION,
    giftingCategories: DEFAULT_GIFTING_CATEGORIES,
  });

  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(Date.now());

  // Robust token retrieval with automatic token recovery for admin operations
  const getAuthToken = async () => {
    let token =
      localStorage.getItem("shop_auth_token") ||
      localStorage.getItem("token") ||
      "";

    // Local development convenience only; production requires a real admin sign-in.
    if (!token && import.meta.env.DEV) {
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "admin@shop.co", password: "admin123" }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.token) {
            token = data.token;
            localStorage.setItem("shop_auth_token", token);
            if (data.user) {
              localStorage.setItem("shop_auth_user", JSON.stringify(data.user));
            }
          }
        }
      } catch (err) {
        console.warn("Could not auto-acquire admin token:", err.message);
      }
    }
    return token;
  };

  const fetchSiteContent = useCallback(async () => {
    try {
      const res = await fetch("/api/site-content");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.content) {
          setContent((prev) => ({
            ...prev,
            ...data.content,
            brands: Array.isArray(data.content.brands) ? data.content.brands : prev.brands,
            aboutUs: { ...prev.aboutUs, ...(data.content.aboutUs || {}) },
            services: Array.isArray(data.content.services) ? data.content.services : prev.services,
            festiveGifts: Array.isArray(data.content.festiveGifts) ? data.content.festiveGifts : prev.festiveGifts,
            contactInfo: { ...prev.contactInfo, ...(data.content.contactInfo || {}) },
            announcement: { ...prev.announcement, ...(data.content.announcement || {}) },
            giftingCategories: Array.isArray(data.content.giftingCategories)
              ? data.content.giftingCategories
              : prev.giftingCategories,
            navigation: {
              ...DEFAULT_NAVIGATION,
              ...(data.content.navigation || {}),
              brandLogo: {
                ...DEFAULT_NAVIGATION.brandLogo,
                ...(data.content.navigation?.brandLogo || {}),
              },
              items: Array.isArray(data.content.navigation?.items)
                ? data.content.navigation.items
                : DEFAULT_NAVIGATION.items,
              actions: {
                ...DEFAULT_NAVIGATION.actions,
                ...(data.content.navigation?.actions || {}),
              },
            },
          }));
          setLastUpdated(Date.now());
        }
      }
    } catch (err) {
      console.warn("Could not fetch remote site content, using cached/default content:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch and auto-refresh on window focus or interval
  useEffect(() => {
    fetchSiteContent();

    const handleFocus = () => {
      fetchSiteContent();
    };

    window.addEventListener("focus", handleFocus);
    const interval = setInterval(fetchSiteContent, 10000);

    return () => {
      window.removeEventListener("focus", handleFocus);
      clearInterval(interval);
    };
  }, [fetchSiteContent]);

  // ------------------- BRAND ACTIONS -------------------
  const addBrand = async (brandData) => {
    const token = await getAuthToken();
    const res = await fetch(getAdminApiUrl("/api/site-content/brands"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(brandData),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to add brand");
    }

    await fetchSiteContent();
    return data.brand;
  };

  const updateBrand = async (brandId, updates) => {
    const token = await getAuthToken();
    const res = await fetch(getAdminApiUrl(`/api/site-content/brands/${brandId}`), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to update brand");
    }

    await fetchSiteContent();
    return data.brand;
  };

  const deleteBrand = async (brandId) => {
    const token = await getAuthToken();
    const res = await fetch(getAdminApiUrl(`/api/site-content/brands/${brandId}`), {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to delete brand");
    }

    await fetchSiteContent();
    return data.deleted;
  };

  // ------------------- NAVIGATION ACTIONS -------------------
  const updateNavigation = async (navData) => {
    const token = await getAuthToken();
    const res = await fetch(getAdminApiUrl("/api/site-content/navigation"), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(navData),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to update navigation bar");
    }

    await fetchSiteContent();
    return data.navigation;
  };

  const addNavItem = async (itemData) => {
    const token = await getAuthToken();
    const res = await fetch(getAdminApiUrl("/api/site-content/navigation/items"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(itemData),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to add navigation item");
    }

    await fetchSiteContent();
    return data.item;
  };

  const updateNavItem = async (itemId, updates) => {
    const token = await getAuthToken();
    const res = await fetch(getAdminApiUrl(`/api/site-content/navigation/items/${itemId}`), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to update navigation item");
    }

    await fetchSiteContent();
    return data.item;
  };

  const deleteNavItem = async (itemId) => {
    const token = await getAuthToken();
    const res = await fetch(getAdminApiUrl(`/api/site-content/navigation/items/${itemId}`), {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to delete navigation item");
    }

    await fetchSiteContent();
    return data.deleted;
  };

  // ------------------- OTHER SECTION ACTIONS -------------------
  const updateAboutUs = async (aboutUsData) => {
    const token = await getAuthToken();
    const res = await fetch(getAdminApiUrl("/api/site-content/about-us"), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(aboutUsData),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to update About Us content");
    }

    await fetchSiteContent();
    return data.aboutUs;
  };

  const updateServices = async (servicesList) => {
    const token = await getAuthToken();
    const res = await fetch(getAdminApiUrl("/api/site-content/services"), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(servicesList),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to update services");
    }

    await fetchSiteContent();
    return data.services;
  };

  const updateFestiveGifts = async (festiveList) => {
    const token = await getAuthToken();
    const res = await fetch(getAdminApiUrl("/api/site-content/festive-gifts"), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(festiveList),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to update festive gifts");
    }

    await fetchSiteContent();
    return data.festiveGifts;
  };

  const updateContactInfo = async (contactData) => {
    const token = await getAuthToken();
    const res = await fetch(getAdminApiUrl("/api/site-content/contact-info"), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(contactData),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to update contact info");
    }

    await fetchSiteContent();
    return data.contactInfo;
  };

  const updateAnnouncement = async (announcementData) => {
    const token = await getAuthToken();
    const res = await fetch(getAdminApiUrl("/api/site-content/announcement"), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(announcementData),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to update announcement");
    }

    await fetchSiteContent();
    return data.announcement;
  };

  // ------------------- GIFTING CATEGORIES & SUBCATEGORIES ACTIONS -------------------
  const updateGiftingCategories = async (categoriesList) => {
    const token = await getAuthToken();
    const res = await fetch(getAdminApiUrl("/api/site-content/categories"), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(categoriesList),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to update categories");
    }

    await fetchSiteContent();
    return data.categories;
  };

  const addGiftingCategory = async (categoryData) => {
    const token = await getAuthToken();
    const res = await fetch(getAdminApiUrl("/api/site-content/categories"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(categoryData),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to add category");
    }

    await fetchSiteContent();
    return data.category;
  };

  const updateGiftingCategory = async (categoryId, updates) => {
    const token = await getAuthToken();
    const res = await fetch(getAdminApiUrl(`/api/site-content/categories/${categoryId}`), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to update category");
    }

    await fetchSiteContent();
    return data.category;
  };

  const deleteGiftingCategory = async (categoryId) => {
    const token = await getAuthToken();
    const res = await fetch(getAdminApiUrl(`/api/site-content/categories/${categoryId}`), {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to delete category");
    }

    await fetchSiteContent();
    return data.deleted;
  };

  const addSubcategory = async (categoryId, subcategoryData) => {
    const token = await getAuthToken();
    const res = await fetch(getAdminApiUrl(`/api/site-content/categories/${categoryId}/subcategories`), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(subcategoryData),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to add subcategory");
    }

    await fetchSiteContent();
    return data.subcategory;
  };

  const updateSubcategory = async (categoryId, subId, updates) => {
    const token = await getAuthToken();
    const res = await fetch(getAdminApiUrl(`/api/site-content/categories/${categoryId}/subcategories/${subId}`), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to update subcategory");
    }

    await fetchSiteContent();
    return data.subcategory;
  };

  const deleteSubcategory = async (categoryId, subId) => {
    const token = await getAuthToken();
    const res = await fetch(getAdminApiUrl(`/api/site-content/categories/${categoryId}/subcategories/${subId}`), {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to delete subcategory");
    }

    await fetchSiteContent();
    return data.deleted;
  };

  const resetDefaults = async () => {
    const token = await getAuthToken();
    const res = await fetch(getAdminApiUrl("/api/site-content/reset"), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to reset site content");
    }

    await fetchSiteContent();
    return data.content;
  };

  return (
    <SiteContentContext.Provider
      value={{
        content,
        brands: content.brands || [],
        aboutUs: content.aboutUs || DEFAULT_ABOUT_US,
        services: content.services || DEFAULT_SERVICES,
        festiveGifts: content.festiveGifts || DEFAULT_FESTIVE,
        contactInfo: content.contactInfo || DEFAULT_CONTACT,
        announcement: content.announcement || DEFAULT_ANNOUNCEMENT,
        navigation: content.navigation || DEFAULT_NAVIGATION,
        giftingCategories: content.giftingCategories || DEFAULT_GIFTING_CATEGORIES,
        loading,
        lastUpdated,
        refreshContent: fetchSiteContent,
        addBrand,
        updateBrand,
        deleteBrand,
        updateNavigation,
        addNavItem,
        updateNavItem,
        deleteNavItem,
        updateGiftingCategories,
        addGiftingCategory,
        updateGiftingCategory,
        deleteGiftingCategory,
        addSubcategory,
        updateSubcategory,
        deleteSubcategory,
        updateAboutUs,
        updateServices,
        updateFestiveGifts,
        updateContactInfo,
        updateAnnouncement,
        resetDefaults,
      }}
    >
      {children}
    </SiteContentContext.Provider>
  );
};

export const useSiteContent = () => {
  const context = useContext(SiteContentContext);
  if (!context) {
    throw new Error("useSiteContent must be used within a SiteContentProvider");
  }
  return context;
};
