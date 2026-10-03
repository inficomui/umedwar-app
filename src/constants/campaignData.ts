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

export const NEWS_ARTICLES: NewsArticle[] = [
  {
    id: "news-1",
    category: "development",
    categoryName: "विकासकार्य",
    date: "२२ सप्टेंबर २०२६",
    readTime: "३ मिनिटे वाचन",
    location: "कोपरगाव शहर",
    title: "कोपरगाव मतदारसंघातील रस्ते काँक्रीटीकरण व जलवाहिनी नूतनीकरणासाठी निधी मंजूर",
    subtitle: "पायाभूत सुविधांचा ऐतिहासिक कायापालट",
    summary:
      "शहरातील आणि ग्रामीण भागातील मुख्य रस्त्यांचे काँक्रीटीकरण तसेच २४ तास शुद्ध पिण्याच्या पाण्यासाठी नवीन जलवाहिनी कामांना मंजुरी मिळाली आहे.",
    highlights: [
      "५० कोटी रुपयांपेक्षा अधिक निधीची विशेष तरतूद.",
      "शहरातील १५ प्रमुख रस्ते व ग्रामीण जोड रस्त्यांचे आधुनिकीकरण.",
      "घरपोच शुद्ध पिण्याच्या पाण्यासाठी भूमिगत जलवाहिनी जाळे.",
    ],
    fullContent: [
      "कोपरगाव मतदारसंघातील नागरिकांच्या सोयीसाठी आणि दळणवळण अधिक सुलभ करण्यासाठी रस्त्यांच्या काँक्रीटीकरणाचा भव्य प्रकल्प हाती घेण्यात आला आहे.",
      "मा. ना. एकनाथजी शिंदे साहेबांच्या मार्गदर्शनाखाली मतदारसंघात सर्वसमावेशक विकासकामे वेगाने पूर्ण केली जात असून प्रत्येक नागरिकाला मूलभूत सुविधांचा लाभ मिळत आहे.",
    ],
    quote: {
      text: "नागरिकांना उत्तम रस्ते आणि मुबलक शुद्ध पाणी देणे हे आमचे सर्वोच्च कर्तव्य आहे.",
      author: "श्री. सचिन मलिक",
    },
    image: require("../../assets/images/banner_development.jpg"),
    isFeatured: true,
  },
  {
    id: "news-2",
    category: "outreach",
    categoryName: "जनसंपर्क",
    date: "२० सप्टेंबर २०२६",
    readTime: "२ मिनिटे वाचन",
    location: "कोपरगाव ग्रामीण",
    title: "शेतकरी मेळावा व पीक विमा मार्गदर्शन शिबिराला उत्स्फूर्त प्रतिसाद",
    subtitle: "बळीराजाच्या पाठीशी खंबीरपणे उभे राहण्याचा संकल्प",
    summary:
      "स्थानिक शेतकरी बांधवांसाठी आयोजित विशेष मेळाव्यात मोफत पीक विमा नोंदणी व आधुनिक कृषी तंत्रज्ञान मार्गदर्शन करण्यात आले.",
    highlights: [
      "२,५०० हून अधिक शेतकरी बांधवांची उपस्थिती.",
      "शून्य रुपयात पीक विमा व नुकसान भरपाई प्रक्रिया सुलभ.",
    ],
    fullContent: [
      "शेतकऱ्यांचे प्रश्न शासन दरबारी मांडून त्यांना योग्य मोबदला आणि वेळेवर मदत मिळवून देण्यासाठी आम्ही सदैव तत्पर आहोत.",
    ],
    quote: {
      text: "शेतकरी सुखी तरच देश सुखी, हाच आमचा मूळ विचार आहे.",
      author: "श्री. सचिन मलिक",
    },
    image: require("../../assets/images/banner_welfare.jpg"),
  },
  {
    id: "news-3",
    category: "politics",
    categoryName: "कार्यक्रम",
    date: "१८ सप्टेंबर २०२६",
    readTime: "२ मिनिटे वाचन",
    location: "शिवसेना जनसंपर्क कार्यालय",
    title: "भव्य युवा रोजगार मेळावा: स्थानिक तरुणांना रोजगाराच्या संधी",
    subtitle: "कौशल्य विकास आणि थेट नियुक्ती",
    summary:
      "कोपरगावमधील सुशिक्षित तरुण-तरुणींसाठी नामांकित कंपन्यांच्या सहकार्याने भव्य नोकरी मेळाव्याचे यशस्वी आयोजन करण्यात आले.",
    highlights: [
      "४० हून अधिक औद्योगिक कंपन्यांचा सहभाग.",
      "६०० पेक्षा जास्त तरुणांना थेट नियुक्ती पत्रे वाटप.",
    ],
    fullContent: [
      "तरुणांच्या हाताला काम आणि सन्मानाचे जीवन देण्यासाठी कोपरगावात नियमित कौशल्य विकास प्रशिक्षण केंद्रे सुरू करण्यात येत आहेत.",
    ],
    quote: {
      text: "युवाशक्ती हीच आपल्या मतदारसंघाची खरी ताकद आहे.",
      author: "श्री. सचिन मलिक",
    },
    image: require("../../assets/images/banner_rally.jpg"),
  },
];

export const CUSTOM_AD_BANNERS: CustomAdBanner[] = [
  {
    id: "ad-1",
    tag: "शासकीय योजना",
    badgeBg: "#DC2626",
    title: "मुख्यमंत्री माझी लाडकी बहीण योजना",
    subtitle: "महिला सक्षमीकरणासाठी क्रांतीकारी पाऊल",
    description: "दरमहा थेट बँक खात्यात आर्थिक सहाय्य! अर्ज प्रक्रिया व कागदपत्रांची संपूर्ण माहिती जाणून घ्या.",
    actionText: "योजना माहिती व कागदपत्रे",
    actionRoute: "/documents",
    gradientColors: ["#E11D48", "#BE123C"],
    icon: "account-heart",
  },
  {
    id: "ad-2",
    tag: "नागरी सेवा २४/७",
    badgeBg: "#E05300",
    title: "नागरिक तक्रार निवारण कक्ष",
    subtitle: "आपली समस्या, आमची जबाबदारी!",
    description: "रस्ते, पाणी, वीज किंवा स्वच्छता यासंबंधी कोणतीही तक्रार त्वरित फोटोसह ॲपवरून नोंदवा.",
    actionText: "नवीन समस्या नोंदवा",
    actionRoute: "/report-issue",
    gradientColors: ["#EA580C", "#C2410C"],
    icon: "bullhorn",
  },
  {
    id: "ad-3",
    tag: "युवा विकास",
    badgeBg: "#2563EB",
    title: "युवा रोजगार व कौशल्य केंद्र २०२६",
    subtitle: "स्पर्धा परीक्षा व करिअर मार्गदर्शन",
    description: "स्थानिक तरुणांसाठी मोफत प्रशिक्षण, डिजिटल कौशल्ये आणि थेट नोकरीच्या संधी उपलब्ध.",
    actionText: "कार्यक्रमांची माहिती पहा",
    actionRoute: "/events",
    gradientColors: ["#2563EB", "#1D4ED8"],
    icon: "school",
  },
];

export const VIDEO_GALLERY_ITEMS: VideoGalleryItem[] = [
  {
    id: "vid-1",
    title: "कोपरगाव विकासासाठी आमची वचनबद्धता व महासंकल्प",
    category: "speeches",
    categoryName: "भाषणे",
    date: "१२ सप्टेंबर २०२६",
    views: "१.२K Views",
    duration: "१२:३५",
    thumbnail: require("../../assets/images/video_thumb_1.jpg"),
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    description: "कोपरगाव विधानसभा मतदारसंघातील सर्वांगीण विकास आराखडा आणि नागरिकांसाठी महत्त्वाचे संकल्प यावर विस्तृत भाषण.",
  },
  {
    id: "vid-2",
    title: "जनसंवाद सभा - नागरिकांच्या समस्यांवर थेट चर्चा",
    category: "dialogue",
    categoryName: "जनसंवाद",
    date: "५ सप्टेंबर २०२६",
    views: "२.४K Views",
    duration: "०८:४५",
    thumbnail: require("../../assets/images/video_thumb_2.jpg"),
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    description: "स्थानिक नागरिक, महिला बचत गट व व्यापारी बांधवांशी थेट संवाद साधून प्रश्न जाणून घेतले.",
  },
  {
    id: "vid-3",
    title: "स्वच्छ आणि सुंदर कोपरगाव महाअभियान",
    category: "events",
    categoryName: "कार्यक्रम",
    date: "२८ ऑगस्ट २०२६",
    views: "९५० Views",
    duration: "१०:१२",
    thumbnail: require("../../assets/images/video_thumb_3.jpg"),
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    description: "शहरातील स्वच्छता मोहीम आणि पर्यावरण संवर्धन उपक्रमांची झलक.",
  },
  {
    id: "vid-4",
    title: "शेतकरी बांधवांसाठी सिंचन व्यवस्था व कृषी मदत उपक्रम",
    category: "development",
    categoryName: "विकासकार्य",
    date: "१५ ऑगस्ट २०२६",
    views: "१.८K Views",
    duration: "०६:२०",
    thumbnail: require("../../assets/images/video_thumb_1.jpg"),
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    description: "दुष्काळ निवारण आणि शेतीसाठी २४ तास वीज व पाणी पुरवठा योजनांची प्रगती.",
  },
];

