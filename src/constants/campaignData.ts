/**
 * Centralized Campaign & Leadership Details
 * Configured with Hon. Shri Eknath Shinde (Shiv Sena) leadership
 */

export interface CampaignData {
  partyOwner: {
    prefix: string;
    name: string;
    englishName: string;
    title: string;
  };

  party: {
    name: string;
    shortName: string;
    tagline: string;
    symbolName: string;
  };

  candidate: {
    honorific: string;
    name: string;
    englishName: string;
    designation: string;
    constituency: string;
    electionYear: string;
    slogan: string;
    appealMessage: string;
  };

  theme: {
    primaryOrange: string;
    deepOrange: string;
    darkOrange: string;
    lightSaffron: string;
    goldAccent: string;
    cardBg: string;
    textDark: string;
    textMuted: string;
  };

  splashDurationMs: number;
}

export interface CarouselBanner {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  badgeBg: string;
  image: any;
}

export interface NewsArticle {
  id: string;
  category: "all" | "politics" | "development" | "outreach" | "events";
  categoryName: string;
  date: string;
  readTime: string;
  location: string;
  title: string;
  subtitle: string;
  summary: string;
  highlights: string[];
  fullContent: string[];
  quote: {
    text: string;
    author: string;
  };
  image: any;
  isFeatured?: boolean;
}

export const CAMPAIGN_CONFIG: CampaignData = {
  partyOwner: {
    prefix: "आदरणीय मुख्यनेते",
    name: "मा. ना. श्री. एकनाथजी शिंदे साहेब",
    englishName: "Hon. Shri Eknathji Shinde",
    title: "मुख्यनेते, शिवसेना",
  },
  party: {
    name: "शिवसेना (Shiv Sena)",
    shortName: "शिवसेना",
    tagline: "हिंदुहृदयसम्राट बाळासाहेब ठाकरे व धर्मवीर आनंद दिघे साहेबांचे विचार",
    symbolName: "निवडणूक चिन्ह: धनुष्यबाण 🏹",
  },
  candidate: {
    honorific: "कार्यसम्राट व लोकप्रिय उमेदवार",
    name: "श्री. सचिन मलिक",
    englishName: "Mr. Sachin Malik",
    designation: "शिवसेना अधिकृत उमेदवार",
    constituency: "कोपरगाव विधानसभा मतदारसंघ",
    electionYear: "२०२६",
    slogan: "जनतेसाठी, जनतेसोबत सदैव तत्पर!",
    appealMessage: "धनुष्यबाण चिन्हासमोरील बटण दाबून प्रचंड बहुमताने विजयी करा!",
  },
  theme: {
    primaryOrange: "#FF6F00",
    deepOrange: "#EA580C",
    darkOrange: "#9A3412",
    lightSaffron: "#FFF7ED",
    goldAccent: "#F59E0B",
    cardBg: "rgba(255, 255, 255, 0.94)",
    textDark: "#1C1917",
    textMuted: "#78716C",
  },
  splashDurationMs: 3400,
};

export interface CustomAdBanner {
  id: string;
  tag: string;
  badgeBg: string;
  badgeTextColor?: string;
  title: string;
  subtitle: string;
  description: string;
  image?: any;
  actionText: string;
  actionRoute: string;
  gradientColors: [string, string];
  icon: string;
}

export interface VideoGalleryItem {
  id: string;
  title: string;
  category: "speeches" | "events" | "dialogue" | "development" | "other";
  categoryName: string;
  date: string;
  views: string;
  duration: string;
  thumbnail: any;
  videoUrl: string;
  description: string;
}

export const CAROUSEL_BANNERS: CarouselBanner[] = [];

export const NEWS_ARTICLES: NewsArticle[] = [];

export const CUSTOM_AD_BANNERS: CustomAdBanner[] = [];

export const VIDEO_GALLERY_ITEMS: VideoGalleryItem[] = [
  {
    id: "1",
    category: "speeches",
    categoryName: "भाषणे व सभा",
    title: "कोपरगाव विकासासाठी आमची वचनबद्धता",
    date: "12 सप्टेंबर 2026",
    views: "1.2K Views",
    duration: "12:35",
    thumbnail: { uri: "https://election.crm.inficomaiacademy.com/public/uploads/home_hero_banner-1789802262772-63798a5a.jpg" },
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    description: "कोपरगाव विधानसभा मतदारसंघातील नागरिकांशी संवाद साधताना विकासाचा संकल्प.",
  },
  {
    id: "2",
    category: "dialogue",
    categoryName: "जनसंवाद सभा",
    title: "जनसंवाद सभा - जनतेचे प्रश्न आणि उत्तरे",
    date: "5 सप्टेंबर 2026",
    views: "2.4K Views",
    duration: "08:45",
    thumbnail: { uri: "https://election.crm.inficomaiacademy.com/public/uploads/banner_rally-1789802283870-d1c91d32.jpg" },
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    description: "पाणी पुरवठा व रस्ते विकास कामांचा आढावा व थेट चर्चा.",
  },
  {
    id: "3",
    category: "events",
    categoryName: "कार्यक्रम व मेळावे",
    title: "स्वच्छ आणि सुंदर कोपरगाव अभियान",
    date: "28 ऑगस्ट 2026",
    views: "950 Views",
    duration: "10:12",
    thumbnail: { uri: "https://election.crm.inficomaiacademy.com/public/uploads/banner_development-1789802308220-7856f197.jpg" },
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    description: "मतदारसंघात राबविण्यात आलेले स्वच्छता अभियान व वृक्षारोपण कार्यक्रम.",
  },
];

