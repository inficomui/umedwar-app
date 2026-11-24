/**
 * Pincode Lookup Service
 * Fetches district, taluka (block), state, and village/area post offices
 * using the official India Post Postal PIN Code API.
 */

export interface PincodeDetails {
  pincode: string;
  district: string;
  taluka: string;
  state: string;
  country: string;
  primaryOffice: string;
  allOffices: string[];
  formattedAddress: string;
  shortSummary: string;
}

// In-memory cache to prevent redundant network requests
const pincodeCache = new Map<string, PincodeDetails>();

// Common Marathi transliterations for Maharashtra districts & regions
const MARATHI_DISTRICTS: Record<string, string> = {
  "ahmed nagar": "अहमदनगर (अहिल्यानगर)",
  "ahmednagar": "अहमदनगर (अहिल्यानगर)",
  "kopergaon": "कोपरगाव",
  "kopargaon": "कोपरगाव",
  "pune": "पुणे",
  "nashik": "नाशिक",
  "aurangabad": "छत्रपती संभाजीनगर",
  "chhatrapati sambhajinagar": "छत्रपती संभाजीनगर",
  "mumbai": "मुंबई",
  "thane": "ठाणे",
  "sholapur": "सोलापूर",
  "solapur": "सोलापूर",
  "satara": "सातारा",
  "kolhapur": "कोल्हापूर",
  "sangli": "सांगली",
  "jalgaon": "जळगाव",
  "dhule": "धुळे",
  "nandurbar": "नंदुरबार",
  "beed": "बीड",
  "jalna": "जालना",
  "parbhani": "परभणी",
  "nanded": "नांदेड",
  "latur": "लातूर",
  "osmanabad": "धाराशिव",
  "dharashiv": "धाराशिव",
  "amravati": "अमरावती",
  "akola": "अकोला",
  "yavatmal": "यवतमाळ",
  "buldhana": "बुलढाणा",
  "washim": "वाशिम",
  "nagpur": "नागपूर",
  "wardha": "वर्धा",
  "bhandara": "भंडारा",
  "gondia": "गोंदिया",
  "chandrapur": "चंद्रपूर",
  "gadchiroli": "गडचिरोली",
  "raigarh(mh)": "रायगड",
  "raigad": "रायगड",
  "ratnagiri": "रत्नागिरी",
  "sindhudurg": "सिंधुदुर्ग",
};

/**
 * Fetch address details for a given 6-digit Indian PIN code
 * @param pincode 6-digit postal code
 * @returns PincodeDetails or null if not found
 */
export async function fetchAddressByPincode(
  pincode: string
): Promise<PincodeDetails | null> {
  const cleanPin = pincode.replace(/\D/g, "").trim();
  if (cleanPin.length !== 6) {
    return null;
  }

  // Check cache first
  if (pincodeCache.has(cleanPin)) {
    return pincodeCache.get(cleanPin)!;
  }

  // 6 second timeout to ensure snappy UX
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch(
      `https://api.postalpincode.in/pincode/${cleanPin}`,
      {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
        },
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (
      Array.isArray(data) &&
      data[0]?.Status === "Success" &&
      Array.isArray(data[0]?.PostOffice) &&
      data[0].PostOffice.length > 0
    ) {
      const offices = data[0].PostOffice;

      // Prefer main office matching Block/Taluka name, Head, or Sub Post Office
      const mainOffice =
        offices.find(
          (o: any) =>
            o.Name &&
            o.Block &&
            o.Name.toLowerCase().trim() === o.Block.toLowerCase().trim()
        ) ||
        offices.find((o: any) =>
          (o.BranchType || "").toLowerCase().includes("head")
        ) ||
        offices.find((o: any) =>
          (o.BranchType || "").toLowerCase().includes("sub")
        ) ||
        offices[0];

      const primaryName = (mainOffice.Name || "").trim();
      const taluka = (mainOffice.Block || mainOffice.Division || "").trim();
      const district = (mainOffice.District || "").trim();
      const state = (mainOffice.State || "").trim();
      const country = (mainOffice.Country || "India").trim();

      // Collect all unique post office names for village suggestions
      const allOffices = Array.from(
        new Set(
          offices
            .map((o: any) => (o.Name || "").trim())
            .filter((name: string) => name.length > 0)
        )
      ) as string[];

      // Build clean formatted address
      const parts: string[] = [];
      if (primaryName) parts.push(primaryName);
      if (
        taluka &&
        taluka.toLowerCase() !== primaryName.toLowerCase() &&
        taluka.toUpperCase() !== "NA"
      ) {
        parts.push(taluka);
      }
      if (
        district &&
        district.toLowerCase() !== taluka.toLowerCase() &&
        district.toLowerCase() !== primaryName.toLowerCase()
      ) {
        parts.push(district);
      }
      if (state) parts.push(state);

      const formattedAddress = parts.join(", ");

      // Build short summary, e.g. "Kopergaon, Ahmed Nagar"
      const shortParts = [
        taluka || primaryName,
        district && district.toLowerCase() !== (taluka || "").toLowerCase()
          ? district
          : null,
      ].filter(Boolean);
      const shortSummary = shortParts.join(", ");

      const result: PincodeDetails = {
        pincode: cleanPin,
        district,
        taluka,
        state,
        country,
        primaryOffice: primaryName,
        allOffices,
        formattedAddress,
        shortSummary,
      };

      pincodeCache.set(cleanPin, result);
      return result;
    }
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name !== "AbortError") {
      console.warn("[pincodeService] fetchAddressByPincode error:", error);
    }
  }

  return null;
}

/**
 * Returns a friendly Marathi label for district/area if available
 */
export function getLocalizedDistrict(district: string): string {
  const key = district.toLowerCase().trim();
  return MARATHI_DISTRICTS[key] || district;
}
