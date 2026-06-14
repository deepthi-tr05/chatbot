export interface UserProfile {
  userId: string;
  email: string;
  displayName: string;
  avatarIcon: string; // Theme presets: "Cat", "Dog", "Robot", "Alien", "Astronaut", "Ninja"
  avatarColor: string; // Gradient style backgrounds (e.g., violet, amber, Emerald, rose)
  avatarUrl?: string; // If they upload custom pictures
  preferredLanguage: string; // Default: "en-IN" but can select "hi-IN" (Hindi), "ta-IN" (Tamil), "te-IN" (Telugu), etc.
  preferredModel: string; // "llama-3.3-70b-versatile" or "gemma2-9b-it"
}

export interface ChatSession {
  chatId: string;
  userId: string;
  title: string;
  createdAt: number; // millisecond timestamp
  updatedAt: number;
}

export interface MessageLine {
  messageId: string;
  chatId: string;
  sender: "user" | "bot";
  text: string;
  sentiment: "positive" | "neutral" | "negative";
  detectedLanguage?: string;
  imageUrl?: string;
  audioBase64?: string;
  createdAt: number;
}

export interface LanguageOption {
  code: string; // e.g., 'en-IN'
  name: string; // e.g., 'English (India)'
  nativeName: string; // e.g., 'English'
  flag: string; // flag emoji or short symbol
}

export interface SpeakerOption {
  id: string; // e.g., 'meera' or 'pawas'
  name: string;
  gender: string;
}

// Preset configurations for multi-language, models, and voice speakers
export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "en-IN", name: "English (India)", nativeName: "English", flag: "🇮🇳" },
  { code: "hi-IN", name: "Hindi (हिंदी)", nativeName: "हिंदी", flag: "🇮🇳" },
  { code: "ta-IN", name: "Tamil (தமிழ்)", nativeName: "தமிழ்", flag: "🇮🇳" },
  { code: "te-IN", name: "Telugu (తెలుగు)", nativeName: "తెలుగు", flag: "🇮🇳" },
  { code: "bn-IN", name: "Bengali (বাংলা)", nativeName: "বাংলা", flag: "🇮🇳" },
  { code: "gu-IN", name: "Gujarati (ગુજરાતી)", nativeName: "ગુજરાતી", flag: "🇮🇳" },
  { code: "kn-IN", name: "Kannada (ಕನ್ನಡ)", nativeName: "ಕನ್ನಡ", flag: "🇮🇳" },
  { code: "ml-IN", name: "Malayalam (മലയാളം)", nativeName: "മലയാളം", flag: "🇮🇳" },
  { code: "mr-IN", name: "Marathi (मराठी)", nativeName: "मराठी", flag: "🇮🇳" },
  { code: "pa-IN", name: "Punjabi (ਪੰਜਾਬੀ)", nativeName: "ਪੰਜਾਬੀ", flag: "🇮🇳" },
];

export const LLM_MODELS = [
  { id: "llama-3.3-70b-versatile", name: "Llama 3.3 (70B) - Highly Accurate", provider: "Meta" },
  { id: "llama-3.1-8b-instant", name: "Llama 3.1 (8B) - Fast & Concise", provider: "Meta" },
];

export const SARVAM_SPEAKERS: SpeakerOption[] = [
  { id: "shreya", name: "Shreya (Female, Clear)", gender: "Female" },
  { id: "shubh", name: "Shubh (Male, Clear)", gender: "Male" },
  { id: "anushka", name: "Anushka (Female, Warm)", gender: "Female" },
  { id: "rohan", name: "Rohan (Male, Balanced)", gender: "Male" },
];

export const AVATAR_ICONS = [
  "Robot",
  "Alien",
  "Astronaut",
  "Ninja",
  "Wizard",
  "Detective",
  "Cat",
  "Dog",
  "Fox",
  "Panda",
];

export const AVATAR_COLORS = [
  { name: "Twilight Violet", value: "from-purple-500 to-indigo-600 shadow-purple-500/20 text-white" },
  { name: "Sunset Horizon", value: "from-orange-500 to-rose-600 shadow-rose-500/20 text-white" },
  { name: "Emerald Glade", value: "from-emerald-400 to-teal-600 shadow-teal-500/20 text-white" },
  { name: "Oceanic Wave", value: "from-sky-400 to-blue-600 shadow-blue-500/20 text-white" },
  { name: "Golden Amber", value: "from-amber-400 to-orange-600 shadow-orange-500/20 text-white" },
  { name: "Cosmic Charcoal", value: "from-zinc-700 to-zinc-900 shadow-zinc-800/20 text-white" },
];
