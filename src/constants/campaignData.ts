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
    englishName: "",
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

export interface ResolutionItem {
  id: string;
  title: string;
  slug?: string;
  fullTitle?: string;
  shortTitle?: string;
  iconName: string;
  subtitle?: string;
  fullDetails?: string;
  badgeText?: string;
  sankalpNumber?: number;
  logoUrl?: string;
  buttonText?: string;
  content?: string;
  sankalpStatement?: string;
  policies?: string[];
  actionPlan?: string;
  category?: string;
  order?: number;
}

export interface ManifestoInfo {
  title: string;
  subtitle: string;
  tagline: string;
  visionTitle: string;
  visionRole: string;
  principlesTitle: string;
  principles: string[];
  citizenParticipationTitle: string;
  citizenParticipationText: string;
  conclusionTitle: string;
  conclusionText: string;
  candidateName: string;
}

export const MANIFESTO_INFO: ManifestoInfo = {
  title: "माझे प्रमुख संकल्प – माझा विकास आराखडा",
  subtitle: "समृद्ध कोपरगाव – विकसित कोपरगाव",
  tagline: "सर्वांगीण विकासासाठी माझा संकल्प व कृती आराखडा",
  visionTitle: "माझी विकासाची भूमिका",
  visionRole:
    "कोपरगाव तालुक्याचा विकास हा केवळ काही रस्ते किंवा इमारती उभारण्यापुरता मर्यादित नसावा. शेतकरी, शेतमजूर, महिला, युवक, विद्यार्थी, उद्योजक, कामगार, व्यापारी, ज्येष्ठ नागरिक आणि समाजातील प्रत्येक घटकाला विकासाचा लाभ मिळाला पाहिजे.\n\nप्रत्येक गावाचा विकास, प्रत्येक नागरिकाला सुविधा, युवकांना रोजगार, शेतकऱ्यांना आधार, विद्यार्थ्यांना संधी आणि सामान्य माणसाला सन्मानाने जगण्यासाठी आवश्यक सुविधा मिळवून देणे हा माझ्या विकास आराखड्याचा केंद्रबिंदू असेल.",
  principlesTitle: "माझे विकासविषयक कार्यतत्त्व",
  principles: [
    "प्रत्येक गावाचा विकास हा माझ्या कामाचा केंद्रबिंदू असेल.",
    "नागरिकांच्या समस्या ऐकून त्यांची अधिकृत नोंद ठेवली जाईल.",
    "प्रत्येक तक्रारीसाठी जबाबदार व्यक्ती निश्चित केली जाईल.",
    "तक्रार मिळाल्यानंतर 24 तासांच्या आत पुढील अपडेट देण्याचा प्रयत्न केला जाईल.",
    "विकासकामांसाठी संबंधित शासकीय विभागाकडे प्रस्ताव व पाठपुरावा केला जाईल.",
    "कामांच्या प्रगतीची माहिती नागरिकांपर्यंत पोहोचवली जाईल.",
    "उपलब्ध निधी, प्रशासकीय मंजुरी आणि अधिकारक्षेत्र यांचा विचार करून कामांना प्राधान्य दिले जाईल.",
    "सर्व समाजघटकांना समान सन्मान व संधी दिली जाईल.",
    "विकासकामांमध्ये पारदर्शकता आणि नागरिकांचा सहभाग ठेवला जाईल.",
    "प्रत्येक संकल्पाचा नियमित आढावा घेण्यात येईल.",
  ],
  citizenParticipationTitle: "माझा संकल्प – नागरिकांचा सहभाग",
  citizenParticipationText:
    "कोपरगावच्या विकासासाठी नागरिकांनीही आपले प्रश्न, सूचना, प्रस्ताव आणि गावाच्या गरजा ॲपद्वारे मांडाव्यात.\n\nप्रत्येक नागरिकाची सूचना महत्त्वाची आहे. नागरिकांच्या सहभागातून विकासाच्या प्राधान्यक्रमांची आखणी करण्याचा माझा प्रयत्न असेल.",
  conclusionTitle: "समृद्ध कोपरगाव – विकसित कोपरगाव",
  conclusionText:
    "आपला विश्वास, आपला सहभाग आणि आपल्या सर्वांच्या प्रयत्नांतून विकासाचा नवा मार्ग निर्माण करूया.",
  candidateName: "सचिन मलिक",
};

export const DEFAULT_RESOLUTIONS: ResolutionItem[] = [];

export function enrichResolution(item: any): ResolutionItem {
  if (!item) {
    return {
      id: "",
      title: "",
      iconName: "star",
    };
  }

  // Extract or parse policies if provided dynamically
  let rawPolicies = item.policies;
  let policies: string[] = [];
  if (Array.isArray(rawPolicies) && rawPolicies.length > 0) {
    policies = rawPolicies;
  } else if (typeof rawPolicies === "string" && rawPolicies.trim().startsWith("[")) {
    try {
      policies = JSON.parse(rawPolicies);
    } catch {
      policies = [];
    }
  } else if (item.fullDetails && typeof item.fullDetails === "string") {
    policies = item.fullDetails
      .replace(/।/g, "\n")
      .split(/[,;\n]+/)
      .map((p: string) => p.trim())
      .filter((p: string) => p.length > 3);
  }

  return {
    id: String(item.slug || item.id || ""),
    title: (item.title || "").replace(/\n/g, " ").trim(),
    shortTitle:
      item.shortTitle ||
      (item.title ? String(item.title).replace(/\n/g, " ").trim() : undefined),
    fullTitle: item.fullTitle || item.title,
    slug: item.slug || String(item.id || ""),
    logoUrl: item.icon_image || item.logoUrl || item.logo || item.image || item.imageUrl,
    iconName: item.iconName || "star",
    sankalpNumber: typeof item.sankalpNumber === "number" ? item.sankalpNumber : undefined,
    sankalpStatement: item.sankalpStatement || item.short_description || item.subtitle || "",
    policies,
    actionPlan: item.actionPlan || "",
    category: item.category || item.badgeText,
    buttonText: item.button_text || item.buttonText || "अधिक माहिती पहा",
    content: item.content,
    order: item.display_order ?? item.order ?? 0,
  };
}
