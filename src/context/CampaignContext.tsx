import React, { createContext, useContext, useState, useEffect } from "react";
import { ImageSourcePropType } from "react-native";
import {
  CAROUSEL_BANNERS as DEFAULT_BANNERS,
  NEWS_ARTICLES as DEFAULT_NEWS,
  CUSTOM_AD_BANNERS,
  VIDEO_GALLERY_ITEMS,
  CustomAdBanner,
  VideoGalleryItem,
} from "../constants/campaignData";
import {
  appConfigApi,
  AboutCandidateData,
  NewsArticleItem,
  NotificationItem,
  JourneyMilestone,
  SocialWorkItem,
  GalleryItem,
} from "../services/appConfigApi";
import {
  triggerLocalNotification,
  getCachedPushTokens,
  registerForPushNotificationsAsync,
} from "../services/notificationPushService";
import {
  issuesApi,
  IssueItem,
  IssueStatus,
  IssueTimelineEvent,
  IssueCategory,
  CreateIssueInput,
  AssignedOfficer,
  DEFAULT_ISSUES,
} from "../services/issuesApi";
import { authApi, UserProfile } from "../services/authApi";

export type {
  JourneyMilestone,
  SocialWorkItem,
  AboutCandidateData,
  NewsArticleItem,
  NotificationItem,
  GalleryItem,
  IssueItem,
  IssueStatus,
  IssueTimelineEvent,
  IssueCategory,
  CreateIssueInput,
  AssignedOfficer,
  UserProfile,
  CustomAdBanner,
  VideoGalleryItem,
};

export interface CandidateProfile {
  honorific: string;
  name: string;
  englishName: string;
  designation: string;
  constituency: string;
  ward: string;
  electionYear: string;
  slogan: string;
  appealMessage: string;
  tagline: string;
  photo: ImageSourcePropType | string;
  biography: string;
  vision: string[];
}

export interface PartyLeaderProfile {
  prefix: string;
  name: string;
  englishName: string;
  title: string;
  photo: ImageSourcePropType | string;
}

export interface PartyProfile {
  name: string;
  shortName: string;
  faction: string;
  tagline: string;
  symbolName: string;
  symbolIcon: string;
  logo: ImageSourcePropType | string;
}

export interface ContactInfo {
  officeName: string;
  address: string;
  city: string;
  pincode: string;
  helpline1: string;
  helpline2: string;
  email: string;
  whatsapp: string;
  officeTimings: string;
  website: string;
}

export interface QuoteCardInfo {
  text: string;
  icon: string;
  actionUrl: string;
}

export interface CarouselBanner {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  badgeBg: string;
  image: ImageSourcePropType | string;
  actionRoute?: string;
}

export interface ResolutionItem {
  id: string;
  title: string;
  iconName: string;
  subtitle?: string;
  fullDetails?: string;
  badgeText?: string;
}

export interface CampaignContextType {
  candidate: CandidateProfile;
  partyLeader: PartyLeaderProfile;
  party: PartyProfile;
  contact: ContactInfo;
  quoteCard: QuoteCardInfo;
  carouselBanners: CarouselBanner[];
  customAdBanners: CustomAdBanner[];
  videoGallery: VideoGalleryItem[];
  resolutions: ResolutionItem[];
  aboutDetails: AboutCandidateData;
  newsArticles: NewsArticleItem[];
  notifications: NotificationItem[];
  issues: IssueItem[];
  myIssues: IssueItem[];
  splashDurationMs: number;
  carouselIntervalMs: number;
  isConfigLoaded: boolean;
  updateCandidate: (data: Partial<CandidateProfile>) => void;
  updatePartyLeader: (data: Partial<PartyLeaderProfile>) => void;
  updateParty: (data: Partial<PartyProfile>) => void;
  updateContact: (data: Partial<ContactInfo>) => void;
  updateQuoteCard: (data: Partial<QuoteCardInfo>) => void;
  updateAboutDetails: (data: Partial<AboutCandidateData>) => void;
  setCarouselBanners: (banners: CarouselBanner[]) => void;
  setResolutions: (resolutions: ResolutionItem[]) => void;
  setNewsArticles: (articles: NewsArticleItem[]) => void;
  setNotifications: (notifications: NotificationItem[]) => void;
  addNewsArticle: (article: NewsArticleItem) => void;
  updateNewsArticle: (id: string, article: Partial<NewsArticleItem>) => void;
  deleteNewsArticle: (id: string) => void;
  createIssue: (data: CreateIssueInput) => Promise<IssueItem>;
  updateIssueStatus: (
    id: string,
    status: IssueStatus,
    remark?: string,
    department?: string,
    officer?: AssignedOfficer
  ) => Promise<IssueItem | null>;
  gallery: GalleryItem[];
  setGallery: (gallery: GalleryItem[]) => void;
  refreshGallery: () => Promise<void>;
  currentUser: UserProfile | null;
  isLoggedIn: boolean;
  login: (user: UserProfile) => Promise<void>;
  logout: () => Promise<void>;
  refreshIssues: () => Promise<void>;
  refreshNews: () => Promise<void>;
  refreshAppConfig: () => Promise<void>;
  resetToDefaults: () => void;
}

const DEFAULT_CANDIDATE: CandidateProfile = {
  honorific: "कार्यसम्राट व लोकप्रिय उमेदवार",
  name: "श्री. सचिन मलिक",
  englishName: "Mr. Sachin Malik",
  designation: "शिवसेना अधिकृत उमेदवार",
  constituency: "कोपरगाव विधानसभा मतदारसंघ",
  ward: "कोपरगाव",
  electionYear: "२०२६",
  slogan: "जनतेसाठी, जनतेसोबत सदैव तत्पर!",
  appealMessage: "धनुष्यबाण चिन्हासमोरील बटण दाबून प्रचंड बहुमताने विजयी करा!",
  tagline: "माणसांसाठी काम करणारा, आपला माणूस !",
  photo: require("../../assets/images/umedwar.png"),
  biography:
    "गेल्या अनेक वर्षांपासून कोपरगाव शहर आणि परिसरातील जनतेच्या हक्कांसाठी, सर्वांगीण विकासासाठी आणि समस्या सोडवण्यासाठी अहोरात्र कार्यरत असलेले आक्रमक व संवेदनशील नेतृत्व.",
  vision: [
    "२४ तास अखंड व स्वच्छ पिण्याचे पाणी पुरवठा",
    "रस्त्यांचे आधुनिक काँक्रीटीकरण व खड्डेमुक्त कोपरगाव परिसर",
    "युवकांसाठी रोजगार आणि कौशल्य विकास केंद्रे",
    "शेतकरी बांधवांचे प्रश्न व सिंचन व्यवस्था बळकटीकरण",
  ],
};

const DEFAULT_PARTY_LEADER: PartyLeaderProfile = {
  prefix: "आदरणीय मुख्यनेते",
  name: "मा. ना. श्री. एकनाथजी शिंदे साहेब",
  englishName: "Hon. Shri Eknathji Shinde",
  title: "मुख्यनेते, शिवसेना",
  photo: require("../../assets/images/leader.png"),
};

const DEFAULT_PARTY: PartyProfile = {
  name: "शिवसेना",
  shortName: "शिवसेना",
  faction: "(शिंदे गट)",
  tagline: "हिंदुहृदयसम्राट बाळासाहेब ठाकरे व धर्मवीर आनंद दिघे साहेबांचे विचार",
  symbolName: "निवडणूक चिन्ह: धनुष्यबाण",
  symbolIcon: "🏹",
  logo: require("../../assets/images/shivsena_logo.png"),
};

const DEFAULT_CONTACT: ContactInfo = {
  officeName: "श्री. सचिन मलिक जनसंपर्क कार्यालय",
  address: "कोपरगाव",
  city: "कोपरगाव, महाराष्ट्र",
  pincode: "४२३६०१",
  helpline1: "+91 73878 77820",
  helpline2: "+91 73878 77820",
  email: "contact@sachinmalik.com",
  whatsapp: "+91 73878 77820",
  officeTimings: "सकाळी ९:०० ते सायं ८:०० (सोमवार ते शनिवार)",
  website: "www.sachinmalik.com",
};

const DEFAULT_QUOTE_CARD: QuoteCardInfo = {
  text: "“जनतेच्या सेवेसाठी\nनेहमी तत्पर !”",
  icon: "bank",
  actionUrl: "/issues",
};

const DEFAULT_RESOLUTIONS: ResolutionItem[] = [
  { id: "res-1", title: "२४ तास अखंड व शुद्ध पाणीपुरवठा", iconName: "water-pump" },
  { id: "res-2", title: "खड्डेमुक्त रस्ते व काँक्रीटीकरण", iconName: "road-variant" },
  { id: "res-3", title: "युवा रोजगार व कौशल्य विकास", iconName: "school" },
  { id: "res-4", title: "शेतकरी बांधवांसाठी कृषी सहाय्य", iconName: "sprout" },
];

const DEFAULT_ABOUT_DETAILS: AboutCandidateData = {
  heroBannerUrl: undefined,
  biography:
    "मी जनतेच्या विश्वासातून, जनतेसाठी आणि जनतेबरोबर काम करण्याच्या उद्देशाने सार्वजनिक जीवनात प्रवेश केला. शिवसेना (शिंदे गट) या विचारधारेने प्रेरित होऊन, समाजाच्या सर्व स्तरांपर्यंत विकास पोहोचवणे हे माझे ध्येय आहे. शिक्षण, आरोग्य, पायाभूत सुविधा, युवकांना संधी आणि सर्वसमावेशक विकास या क्षेत्रांमध्ये सातत्याने काम करण्याचा माझा प्रयत्न आहे.",
  politicalEntryYear: "2015",
  missionStatement:
    "प्रत्येक नागरिकाला विकासाच्या मुख्य प्रवाहात आणणे आणि सुशासन, सुविधा व संधी सर्वांपर्यंत पोहोचवणे.",
  roleDescription:
    "जनतेचे प्रश्न समजून घेणे, त्यावर कृती करणे आणि एक विकसित, सक्षम आणि प्रगत समाज घडवणे.",
  quoteText: "माझं ध्येय – आपला विकास, आपला विश्वास !",
  quoteAuthor: "श्री. सचिन मलिक",
  milestones: [
    {
      id: "m-1",
      year: "2015",
      title: "सामाजिक व राजकीय जीवनाचा आरंभ",
      subtitle: "युवक सक्षमीकरण व जनसेवा चळवळ",
      description:
        "कोपरगाव परिसरात स्थानिक युवकांच्या सहकार्याने विविध सामाजिक उपक्रम, आरोग्य शिबिरे व रक्तदान शिबिरांचे यशस्वी आयोजन.",
      tag: "सुरवात",
    },
    {
      id: "m-2",
      year: "2018",
      title: "शेतकरी व कामगार हक्क लढा",
      subtitle: "सिंचन प्रश्न व कृषी बाजारपेठ सुधारणा",
      description:
        "दुष्काळग्रस्त भागातील शेतकऱ्यांसाठी सिंचन सुविधा व शेतमालाला योग्य भाव मिळवून देण्यासाठी भव्य शेतकरी मोर्चाचे नेतृत्व.",
      tag: "आंदोलन",
    },
    {
      id: "m-3",
      year: "2021",
      title: "कोविड मदत व आपत्कालीन आरोग्य मोहीम",
      subtitle: "नागरिकांसाठी २४ तास तत्पर सेवा",
      description:
        "साथरोगाच्या कठीण काळात ५,००० हून अधिक गरजू कुटुंबांना धान्य वाटप, मोफत ऑक्सिजन कॉन्सन्ट्रेटर्स व आवश्यक औषधोपचार पुरवला.",
      tag: "सेवाकार्य",
    },
    {
      id: "m-4",
      year: "2024",
      title: "शिवसेना अधिकृत उमेदवारी व महासंकल्प",
      subtitle: "कोपरगाव विधानसभा मतदारसंघाचा सर्वांगीण कायापालट",
      description:
        "आदरणीय मुख्यनेते ना. श्री. एकनाथजी शिंदे साहेबांच्या नेतृत्वाखाली कोपरगावच्या सर्वांगीण विकासासाठी शिवसेना अधिकृत उमेदवारी जाहीर.",
      tag: "उमेदवारी",
    },
  ],
  socialWorks: [
    {
      id: "sw-1",
      title: "स्वच्छ व अखंड पाणीपुरवठा मोहीम",
      category: "मूलभूत सुविधा",
      description:
        "शहरातील व ग्रामीण भागातील जलवाहिन्यांचे नूतनीकरण करून घराघरांपर्यंत शुद्ध पिण्याचे पाणी पोहोचवण्याचे महत्त्वपूर्ण काम.",
      impactCount: "२५,०००+ लाभार्थी",
      iconName: "water-pump",
    },
    {
      id: "sw-2",
      title: "युवा रोजगार व कौशल्य विकास केंद्र",
      category: "युवा विकास",
      description:
        "स्थानिक तरुणांना औद्योगिक प्रशिक्षण, स्पर्धा परीक्षा मार्गदर्शन व थेट नोकरीच्या संधी उपलब्ध करून दिल्या.",
      impactCount: "३,५००+ युवक",
      iconName: "school",
    },
    {
      id: "sw-3",
      title: "महिला सक्षमीकरण व बचत गट सहाय्य",
      category: "महिला कल्याण",
      description:
        "महिला बचत गटांना शून्य टक्के व्याजदर कर्ज मिळवून देणे व गृहउद्योगांसाठी विशेष प्रदर्शन केंद्रांची निर्मिती.",
      impactCount: "१५०+ बचत गट",
      iconName: "account-group",
    },
    {
      id: "sw-4",
      title: "मोफत आरोग्य शिबिरे व शस्त्रक्रिया मोहीम",
      category: "आरोग्य सेवा",
      description:
        "ग्रामीण भागातील ज्येष्ठ नागरिकांसाठी नेत्र तपासणी, मोफत मोतीबिंदू शस्त्रक्रिया व आवश्यक औषधांचे वाटप.",
      impactCount: "१२,०००+ नागरिक",
      iconName: "hospital-box",
    },
  ],
  socialLinks: {
    facebook: "https://facebook.com/sachinmalikofficial",
    instagram: "https://instagram.com/sachinmalikofficial",
    twitter: "https://twitter.com/sachinmalik",
    youtube: "https://youtube.com/@sachinmalik",
    whatsapp: "https://wa.me/917387877820",
  },
};

const DEFAULT_NEWS_ARTICLES: NewsArticleItem[] = (DEFAULT_NEWS as unknown as NewsArticleItem[]) || [];

export const DEFAULT_GALLERY_ITEMS: GalleryItem[] = [
  {
    id: "gal-1",
    category: "events",
    title: "कोपरगाव भव्य संकल्प सभा",
    date: "१५ सप्टेंबर २०२६",
    photoCount: 8,
    image: require("../../assets/images/gallery_card_1.png"),
    description: "मतदारसंघातील नागरिकांचा प्रचंड प्रतिसाद व जाहीर सभेचे क्षणचित्रे.",
  },
  {
    id: "gal-2",
    category: "dialogue",
    title: "महिला बचत गट संवाद परिषद",
    date: "१० सप्टेंबर २०२६",
    photoCount: 12,
    image: require("../../assets/images/gallery_card_2.png"),
    description: "महिला भगिनींच्या विविध अडचणी समजून घेऊन त्यांना शासकीय योजनांचा लाभ देण्यावर चर्चा.",
  },
  {
    id: "gal-3",
    category: "meetings",
    title: "ज्येष्ठ नागरिक व शेतकरी बांधव भेट",
    date: "५ सप्टेंबर २०२६",
    photoCount: 6,
    image: require("../../assets/images/gallery_card_3.png"),
    description: "गावपातळीवरील विकासकामे व शेती सिंचन प्रश्नांवर शेतकरी बांधवांशी चर्चा.",
  },
  {
    id: "gal-4",
    category: "events",
    title: "युवा सक्षमीकरण व क्रीडा स्पर्धा",
    date: "१ सप्टेंबर २०२६",
    photoCount: 15,
    image: require("../../assets/images/gallery_card_4.png"),
    description: "स्थानिक खेळाडूंना प्रोत्साहन देण्यासाठी भव्य क्रीडा महोत्सवाचे आयोजन.",
  },
  {
    id: "gal-5",
    category: "media",
    title: "पत्रकार परिषद व विकास आराखडा प्रकाशन",
    date: "२५ ऑगस्ट २०२६",
    photoCount: 5,
    image: require("../../assets/images/gallery_card_5.png"),
    description: "कोपरगाव मतदारसंघाच्या आगामी ५ वर्षांच्या विकास आराखड्याची माहिती प्रसारमाध्यमांना दिली.",
  },
  {
    id: "gal-6",
    category: "dialogue",
    title: "नागरी समस्या निवारण बैठक",
    date: "२० ऑगस्ट २०२६",
    photoCount: 9,
    image: require("../../assets/images/gallery_card_6.png"),
    description: "वॉर्डनिहाय प्रत्यक्ष पाहणी करून पाणी, रस्ते व स्वच्छता समस्यांवर तातडीने तोडगा.",
  },
];

const CampaignContext = createContext<CampaignContextType | undefined>(undefined);

export function CampaignProvider({ children }: { children: React.ReactNode }) {
  const [candidate, setCandidate] = useState<CandidateProfile>(DEFAULT_CANDIDATE);
  const [partyLeader, setPartyLeader] = useState<PartyLeaderProfile>(DEFAULT_PARTY_LEADER);
  const [party, setParty] = useState<PartyProfile>(DEFAULT_PARTY);
  const [contact, setContact] = useState<ContactInfo>(DEFAULT_CONTACT);
  const [quoteCard, setQuoteCard] = useState<QuoteCardInfo>(DEFAULT_QUOTE_CARD);
  const [carouselBanners, setCarouselBanners] = useState<CarouselBanner[]>(DEFAULT_BANNERS);
  const [customAdBanners] = useState<CustomAdBanner[]>(CUSTOM_AD_BANNERS);
  const [videoGallery] = useState<VideoGalleryItem[]>(VIDEO_GALLERY_ITEMS);
  const [resolutions, setResolutions] = useState<ResolutionItem[]>(DEFAULT_RESOLUTIONS);
  const [aboutDetails, setAboutDetails] = useState<AboutCandidateData>(DEFAULT_ABOUT_DETAILS);
  const [newsArticles, setNewsArticles] = useState<NewsArticleItem[]>(DEFAULT_NEWS_ARTICLES);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>(DEFAULT_GALLERY_ITEMS);
  const [issues, setIssues] = useState<IssueItem[]>(DEFAULT_ISSUES);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const isLoggedIn = Boolean(currentUser && currentUser.id);
  const [splashDurationMs, setSplashDurationMs] = useState<number>(3400);
  const [carouselIntervalMs, setCarouselIntervalMs] = useState<number>(4200);
  const [isConfigLoaded, setIsConfigLoaded] = useState<boolean>(false);

  const refreshAppConfig = async () => {
    try {
      const res = await appConfigApi.getAppConfig();
      if (res && res.success && res.data) {
        const c = res.data.config;

        if (c) {
          setCandidate((prev) => ({
            ...prev,
            honorific: c.candidateHonorific || prev.honorific,
            name: c.candidateName || prev.name,
            englishName: c.candidateEnglishName || prev.englishName,
            designation: c.candidateDesignation || prev.designation,
            constituency: c.candidateConstituency || prev.constituency,
            ward: c.candidateWard || prev.ward,
            slogan: c.candidateSlogan || prev.slogan,
            appealMessage: c.candidateAppeal || prev.appealMessage,
            tagline: c.candidateTagline || prev.tagline,
            biography: c.candidateBiography || prev.biography,
            vision: c.candidateVision || prev.vision,
            photo: c.candidatePhotoUrl ? { uri: c.candidatePhotoUrl } : prev.photo,
          }));

          setPartyLeader((prev) => ({
            ...prev,
            prefix: c.leaderPrefix || prev.prefix,
            name: c.leaderName || prev.name,
            englishName: c.leaderEnglishName || prev.englishName,
            title: c.leaderTitle || prev.title,
            photo: c.leaderPhotoUrl ? { uri: c.leaderPhotoUrl } : prev.photo,
          }));

          setParty((prev) => ({
            ...prev,
            name: c.partyName || prev.name,
            shortName: c.partyShortName || prev.shortName,
            faction: c.partyFaction || prev.faction,
            tagline: c.partyTagline || prev.tagline,
            symbolName: c.partySymbolName || prev.symbolName,
            symbolIcon: c.partySymbolIcon || prev.symbolIcon,
            logo: c.partyLogoUrl ? { uri: c.partyLogoUrl } : prev.logo,
          }));

          setContact((prev) => ({
            ...prev,
            officeName: c.officeName || prev.officeName,
            address: c.officeAddress || prev.address,
            city: c.city || prev.city,
            pincode: c.pincode || prev.pincode,
            helpline1: c.helpline1 || prev.helpline1,
            helpline2: c.helpline2 || prev.helpline2,
            email: c.email || prev.email,
            whatsapp: c.whatsapp || prev.whatsapp,
            officeTimings: c.officeTimings || prev.officeTimings,
            website: c.website || prev.website,
          }));

          setQuoteCard({
            text: c.quoteCardText || DEFAULT_QUOTE_CARD.text,
            icon: c.quoteCardIcon || DEFAULT_QUOTE_CARD.icon,
            actionUrl: c.quoteCardActionUrl || DEFAULT_QUOTE_CARD.actionUrl,
          });

          if (c.splashDurationMs) setSplashDurationMs(c.splashDurationMs);
          if (c.carouselIntervalMs) setCarouselIntervalMs(c.carouselIntervalMs);
        }

        if (res.data.banners && res.data.banners.length > 0) {
          const mappedBanners: CarouselBanner[] = res.data.banners.map((b: any) => {
            const rawImg = b.imageUrl || b.image_url || b.image;
            return {
              id: String(b.id),
              tag: b.tag,
              title: b.title,
              subtitle: b.subtitle,
              badgeBg: b.badgeBg || "#EA580C",
              image: typeof rawImg === "string" ? { uri: rawImg } : rawImg,
              actionRoute: b.actionRoute || "/news",
            };
          });
          setCarouselBanners(mappedBanners);
        }

        if (res.data.resolutions && res.data.resolutions.length > 0) {
          setResolutions(res.data.resolutions);
        }

        if (res.data.about) {
          const a = res.data.about as any;
          setAboutDetails((prev) => ({
            ...prev,
            heroBannerUrl:
              a.heroBannerUrl ||
              a.hero_banner_url ||
              a.bannerUrl ||
              a.banner_url ||
              a.imageUrl ||
              a.image_url ||
              c?.aboutHeroBannerUrl ||
              c?.aboutBannerUrl ||
              prev.heroBannerUrl,
            biography: a.biography || prev.biography,
            politicalEntryYear: a.politicalEntryYear || prev.politicalEntryYear,
            missionStatement: a.missionStatement || prev.missionStatement,
            roleDescription: a.roleDescription || prev.roleDescription,
            quoteText: a.quoteText || prev.quoteText,
            quoteAuthor: a.quoteAuthor || prev.quoteAuthor,
            milestones: a.milestones?.length ? a.milestones : prev.milestones,
            socialWorks: a.socialWorks?.length ? a.socialWorks : prev.socialWorks,
            socialLinks: { ...prev.socialLinks, ...(a.socialLinks || {}) },
          }));
        }

        if (res.data.news && res.data.news.length > 0) {
          const formatNewsDate = (rawDate?: string): string => {
            if (!rawDate) return "ताजी बातमी";
            try {
              const d = new Date(rawDate);
              if (isNaN(d.getTime())) return rawDate;
              const marathiMonths = [
                "जानेवारी", "फेब्रुवारी", "मार्च", "एप्रिल", "मे", "जून",
                "जुलै", "ऑगस्ट", "सप्टेंबर", "ऑक्टोबर", "नोव्हेंबर", "डिसेंबर"
              ];
              return `${d.getDate()} ${marathiMonths[d.getMonth()]} ${d.getFullYear()}`;
            } catch {
              return rawDate;
            }
          };

          const mappedNews: NewsArticleItem[] = res.data.news.map((item: any, idx: number) => {
            const rawImg = item.imageUrl || item.image_url || item.image;
            let resolvedImage: any = require("../../assets/images/home_hero_banner.jpg");
            if (rawImg) {
              if (typeof rawImg === "string") {
                resolvedImage = { uri: rawImg };
              } else if (typeof rawImg === "object" && rawImg.uri) {
                resolvedImage = rawImg;
              } else if (typeof rawImg === "number") {
                resolvedImage = rawImg;
              }
            }

            const formattedDate =
              item.date ||
              formatNewsDate(item.publishedAt || item.published_at || item.created_at);

            const cat = String(item.category || "").toLowerCase();
            let mappedCat = item.category || "development";
            if (cat.includes("विकास") || cat.includes("development")) mappedCat = "development";
            else if (cat.includes("राजकारण") || cat.includes("politic")) mappedCat = "politics";
            else if (cat.includes("कल्याण") || cat.includes("संपर्क") || cat.includes("outreach") || cat.includes("योजना")) mappedCat = "outreach";
            else if (cat.includes("कार्यक्रम") || cat.includes("रोजगार") || cat.includes("मेळावा") || cat.includes("event")) mappedCat = "events";

            return {
              ...item,
              id: String(item.id || idx + 1),
              category: mappedCat,
              categoryName: item.categoryName || item.category || "बातम्या",
              date: formattedDate,
              readTime: item.readTime || "२ मिनिटे वाचन",
              location: item.location || "कोपरगाव विधानसभा",
              title: item.title || "",
              subtitle: item.subtitle || item.tag || "",
              summary: item.summary || item.description || "",
              description: item.description || item.summary || "",
              highlights: Array.isArray(item.highlights) && item.highlights.length > 0 ? item.highlights : [
                "मतदारसंघातील सर्व घटकांच्या विकासाला सर्वोच्च प्राधान्य.",
                "पायाभूत सुविधा, रस्ते आणि पाणीपुरवठा योजनांना गती.",
              ],
              fullContent: item.fullContent || (item.content ? [item.content] : [item.summary || item.description || ""]),
              content: item.content || item.summary || "",
              image: resolvedImage,
              imageUrl: typeof rawImg === "string" ? rawImg : undefined,
              image_url: typeof rawImg === "string" ? rawImg : undefined,
              isFeatured: Boolean(item.isFeatured ?? (item.isBreaking || item.is_breaking)),
              isBreaking: Boolean(item.isBreaking ?? item.is_breaking),
              publishedAt: item.publishedAt || item.published_at,
            };
          });
          setNewsArticles(mappedNews);
        }

        // Sync gallery photos from app-config response or dedicated endpoint
        try {
          const rawGallery = res.data.gallery || (await appConfigApi.getGallery());
          if (rawGallery && rawGallery.length > 0) {
            const mappedGallery: GalleryItem[] = rawGallery.map((item: any) => {
              const rawImg = item.imageUrl || item.image_url || item.image;
              let resolvedImage: any = require("../../assets/images/gallery_card_1.png");
              if (rawImg) {
                if (typeof rawImg === "string") {
                  resolvedImage = { uri: rawImg };
                } else if (typeof rawImg === "object" && rawImg.uri) {
                  resolvedImage = rawImg;
                } else if (typeof rawImg === "number") {
                  resolvedImage = rawImg;
                }
              }
              return {
                ...item,
                id: String(item.id),
                category: item.category || "events",
                title: item.title || "गॅलरी फोटो",
                date: item.date || "सप्टेंबर २०२६",
                photoCount: Number(item.photoCount || item.photo_count || 1),
                image: resolvedImage,
                imageUrl: typeof rawImg === "string" ? rawImg : undefined,
                description: item.description || "",
                sortOrder: item.sortOrder ?? item.sort_order ?? 0,
                isActive: item.isActive ?? item.is_active ?? true,
              };
            });
            setGallery(mappedGallery);
          }
        } catch {
          // Keep current gallery
        }
      }

      // Sync issues
      try {
        const issuesRes = await issuesApi.getPublicIssues();
        if (issuesRes && Array.isArray(issuesRes.data)) {
          setIssues(issuesRes.data);
        }
      } catch {
        // Keep current
      }

      // Sync notifications
      try {
        let notifs = (res && res.data && res.data.notifications) || null;
        if (!notifs || notifs.length === 0) {
          notifs = await appConfigApi.getNotifications();
        }
        if (notifs && notifs.length > 0) {
          // Check for newly arrived notifications to ring device
          if (notifications && notifications.length > 0) {
            const existingIds = new Set(notifications.map((n) => String(n.id)));
            const newItems = notifs.filter((n) => !existingIds.has(String(n.id)));
            if (newItems.length > 0) {
              const latest = newItems[0];
              triggerLocalNotification(
                latest.title || "नवीन सूचना",
                latest.message || latest.description || "मतदारसंघातील नवीन सूचना प्राप्त झाली आहे.",
                { id: latest.id, targetRoute: "/notifications" }
              ).catch(() => {});
            }
          }
          setNotifications(notifs);
        }
      } catch {
        // Keep current
      }
    } catch {
      // Offline fallback already preset with DEFAULT values
    } finally {
      setIsConfigLoaded(true);
    }
  };

  useEffect(() => {
    refreshAppConfig();
    const unsubscribe = authApi.subscribe((user) => {
      setCurrentUser(user);
    });
    authApi.init().then((user) => {
      if (user) {
        setCurrentUser(user);
      }
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const updateCandidate = (data: Partial<CandidateProfile>) => {
    setCandidate((prev) => ({ ...prev, ...data }));
  };

  const updatePartyLeader = (data: Partial<PartyLeaderProfile>) => {
    setPartyLeader((prev) => ({ ...prev, ...data }));
  };

  const updateParty = (data: Partial<PartyProfile>) => {
    setParty((prev) => ({ ...prev, ...data }));
  };

  const updateContact = (data: Partial<ContactInfo>) => {
    setContact((prev) => ({ ...prev, ...data }));
  };

  const updateQuoteCard = (data: Partial<QuoteCardInfo>) => {
    setQuoteCard((prev) => ({ ...prev, ...data }));
  };

  const updateAboutDetails = (data: Partial<AboutCandidateData>) => {
    setAboutDetails((prev) => ({ ...prev, ...data }));
  };

  const addNewsArticle = (article: NewsArticleItem) => {
    setNewsArticles((prev) => [article, ...prev]);
  };

  const updateNewsArticle = (id: string, updated: Partial<NewsArticleItem>) => {
    setNewsArticles((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updated } : item))
    );
  };

  const deleteNewsArticle = (id: string) => {
    setNewsArticles((prev) => prev.filter((item) => item.id !== id));
  };

  const cleanUserPhone = currentUser?.mobile ? currentUser.mobile.replace(/\D/g, "").slice(-10) : "";
  const myIssues = issues.filter((item) => {
    if (!item) return false;
    if (currentUser?.id && (item.userId === currentUser.id || (item as any).reportedBy?.userId === currentUser.id)) {
      return true;
    }
    if (cleanUserPhone) {
      const phones = [
        item.userMobile,
        (item as any).citizenMobile,
        (item as any).phone,
        (item as any).mobile,
        (item as any).reportedBy?.userMobile,
      ]
        .filter(Boolean)
        .map((p) => String(p).replace(/\D/g, "").slice(-10));
      if (phones.includes(cleanUserPhone)) return true;
    }
    return Boolean(item.isMyIssue);
  });

  const createIssue = async (data: CreateIssueInput): Promise<IssueItem> => {
    const { fcmToken, expoToken } = getCachedPushTokens();
    const payload: CreateIssueInput = {
      ...data,
      userId: data.userId || currentUser?.id,
      userName: data.userName || currentUser?.name || "नागरिक",
      userMobile: data.userMobile || currentUser?.mobile || "",
      userEmail: data.userEmail || currentUser?.email,
      fcmToken: data.fcmToken || fcmToken,
      expoToken: data.expoToken || expoToken,
    };
    const res = await issuesApi.createIssue(payload);
    setIssues((prev) => {
      const existing = prev.filter((i) => i.id !== res.data.id && i.trackingId !== res.data.trackingId);
      return [res.data, ...existing];
    });
    return res.data;
  };

  const updateIssueStatus = async (
    id: string,
    status: IssueStatus,
    remark?: string,
    department?: string,
    officer?: AssignedOfficer
  ): Promise<IssueItem | null> => {
    const res = await issuesApi.updateIssueStatus(id, status, remark, department, officer);
    if (res && res.data) {
      setIssues((prev) =>
        prev.map((item) => (item.id === id || item.trackingId === id ? res.data! : item))
      );
    }
    return res ? res.data : null;
  };

  const refreshIssues = async () => {
    try {
      const res = await issuesApi.getPublicIssues();
      let combined = Array.isArray(res?.data) ? [...res.data] : [];

      if (currentUser) {
        const myRes = await issuesApi.getMyIssues(currentUser.id, currentUser.mobile);
        if (myRes && Array.isArray(myRes.data)) {
          const existingIds = new Set(combined.map((i) => String(i.id)));
          const userOnly = myRes.data.filter((i) => !existingIds.has(String(i.id)));
          combined = [...userOnly, ...combined];
        }
      }
      setIssues(combined);
    } catch (e) {
      console.warn("Error refreshing issues:", e);
    }
  };

  const login = async (user: UserProfile) => {
    await authApi.saveUserSession(user);
    setCurrentUser(user);
    // Bind device push token to this user profile on backend
    registerForPushNotificationsAsync(user).catch(() => {});
    try {
      const myRes = await issuesApi.getMyIssues(user.id, user.mobile);
      if (myRes && myRes.data && myRes.data.length > 0) {
        setIssues((prev) => {
          const existingIds = new Set(prev.map((i) => String(i.id)));
          const toAdd = myRes.data.filter((i) => !existingIds.has(String(i.id)));
          return [...toAdd, ...prev];
        });
      }
    } catch (e) {
      console.warn("Failed to fetch user issues after login:", e);
    }
  };

  const logout = async () => {
    await authApi.logout();
    setCurrentUser(null);
  };

  const refreshGallery = async () => {
    try {
      const items = await appConfigApi.getGallery();
      if (items && items.length > 0) {
        const mapped = items.map((item: any) => {
          const rawImg = item.imageUrl || item.image_url || item.image;
          let resolvedImage: any = require("../../assets/images/gallery_card_1.png");
          if (rawImg) {
            if (typeof rawImg === "string") {
              resolvedImage = { uri: rawImg };
            } else if (typeof rawImg === "object" && rawImg.uri) {
              resolvedImage = rawImg;
            } else if (typeof rawImg === "number") {
              resolvedImage = rawImg;
            }
          }
          return {
            ...item,
            id: String(item.id),
            category: item.category || "events",
            title: item.title || "गॅलरी फोटो",
            date: item.date || "सप्टेंबर २०२६",
            photoCount: Number(item.photoCount || item.photo_count || 1),
            image: resolvedImage,
            imageUrl: typeof rawImg === "string" ? rawImg : undefined,
            description: item.description || "",
            sortOrder: item.sortOrder ?? item.sort_order ?? 0,
            isActive: item.isActive ?? item.is_active ?? true,
          };
        });
        setGallery(mapped);
      }
    } catch (e) {
      console.warn("Failed to refresh gallery:", e);
    }
  };

  const refreshNews = async () => {
    try {
      const news = await appConfigApi.getNewsArticles();
      if (news && Array.isArray(news)) {
        setNewsArticles(news);
      }
    } catch (e) {
      console.warn("Failed to refresh news:", e);
    }
  };

  const resetToDefaults = () => {
    setCandidate(DEFAULT_CANDIDATE);
    setPartyLeader(DEFAULT_PARTY_LEADER);
    setParty(DEFAULT_PARTY);
    setContact(DEFAULT_CONTACT);
    setQuoteCard(DEFAULT_QUOTE_CARD);
    setCarouselBanners(DEFAULT_BANNERS);
    setResolutions(DEFAULT_RESOLUTIONS);
    setAboutDetails(DEFAULT_ABOUT_DETAILS);
    setNewsArticles(DEFAULT_NEWS_ARTICLES);
    setGallery(DEFAULT_GALLERY_ITEMS);
    setIssues(DEFAULT_ISSUES);
  };

  return (
    <CampaignContext.Provider
      value={{
        candidate,
        partyLeader,
        party,
        contact,
        quoteCard,
        carouselBanners,
        customAdBanners,
        videoGallery,
        resolutions,
        aboutDetails,
        newsArticles,
        notifications,
        gallery,
        setGallery,
        refreshGallery,
        issues,
        myIssues,
        currentUser,
        isLoggedIn,
        login,
        logout,
        splashDurationMs,
        carouselIntervalMs,
        isConfigLoaded,
        updateCandidate,
        updatePartyLeader,
        updateParty,
        updateContact,
        updateQuoteCard,
        updateAboutDetails,
        setCarouselBanners,
        setResolutions,
        setNewsArticles,
        setNotifications,
        addNewsArticle,
        updateNewsArticle,
        deleteNewsArticle,
        createIssue,
        updateIssueStatus,
        refreshIssues,
        refreshNews,
        refreshAppConfig,
        resetToDefaults,
      }}
    >
      {children}
    </CampaignContext.Provider>
  );
}

export function useCampaign() {
  const context = useContext(CampaignContext);
  if (!context) {
    throw new Error("useCampaign must be used within a CampaignProvider");
  }
  return context;
}
