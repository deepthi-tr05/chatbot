import { useState } from "react";
import { 
  UserProfile, 
  AVATAR_COLORS, 
  AVATAR_ICONS, 
  SUPPORTED_LANGUAGES, 
  LLM_MODELS 
} from "@/src/types";
import { 
  X, 
  User, 
  Check, 
  Languages, 
  Cpu, 
  Sparkles,
  Info
} from "lucide-react";

interface ProfileCustomizerProps {
  profile: UserProfile;
  onSave: (updated: Partial<UserProfile>) => void;
  onClose: () => void;
}

export default function ProfileCustomizer({ profile, onSave, onClose }: ProfileCustomizerProps) {
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [selectedIcon, setSelectedIcon] = useState(profile.avatarIcon);
  const [selectedColor, setSelectedColor] = useState(profile.avatarColor);
  const [preferredLang, setPreferredLang] = useState(profile.preferredLanguage);
  const [preferredMod, setPreferredMod] = useState(profile.preferredModel);
  const [isSaving, setIsSaving] = useState(false);

  // Helper to render letter fallback or matched preset avatar icon
  const renderAvatarGlyph = (iconName: string, cls: string) => {
    return (
      <div className={`w-14 h-14 rounded-xl bg-gradient-to-tr ${cls} flex items-center justify-center font-sans font-bold text-lg shadow-md`}>
        {iconName.substring(0, 2).toUpperCase()}
      </div>
    );
  };

  const handleSave = () => {
    if (!displayName.trim()) return;
    setIsSaving(true);
    setTimeout(() => {
      onSave({
        displayName: displayName.trim(),
        avatarIcon: selectedIcon,
        avatarColor: selectedColor,
        preferredLanguage: preferredLang,
        preferredModel: preferredMod,
      });
      setIsSaving(false);
      onClose();
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="shrink-0 p-1.5 bg-indigo-500/10 rounded-lg text-indigo-600 dark:text-indigo-400">
              <Sparkles size={18} />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Profile Customization & Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-slate-700 dark:text-slate-300">
          
          {/* Virtual Preview Card */}
          <div className="bg-slate-50 dark:bg-slate-950 p-4.5 rounded-xl border border-slate-100 dark:border-slate-800/60 flex items-center space-x-4">
            {renderAvatarGlyph(selectedIcon, selectedColor)}
            <div className="space-y-10 leading-none">
              <div className="space-y-1">
                <p className="font-bold text-slate-900 dark:text-white text-base leading-none">
                  {displayName || "Unnamed Explorer"}
                </p>
                <p className="text-[11px] font-mono text-slate-400">
                  {profile.email}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                <span className="text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold px-1.5 py-0.5 rounded">
                  {SUPPORTED_LANGUAGES.find(l => l.code === preferredLang)?.nativeName || preferredLang}
                </span>
                <span className="text-[10px] bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold px-1.5 py-0.5 rounded font-mono">
                  {preferredMod.split("-")[0].toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Profile Name */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Display Name
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <User size={16} />
              </span>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={30}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white font-medium"
                placeholder="Enter your name"
              />
            </div>
          </div>

          {/* Avatar Icon / Character Type */}
          <div className="space-y-2">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Character Archetype Tag
            </label>
            <div className="grid grid-cols-5 gap-2">
              {AVATAR_ICONS.map((icon) => (
                <button
                  key={icon}
                  onClick={() => setSelectedIcon(icon)}
                  className={`py-1.5 px-1 border text-center rounded-xl font-semibold text-xs truncate transition duration-150 cursor-pointer ${
                    selectedIcon === icon
                      ? "bg-indigo-500/10 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold"
                      : "bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Profile Accent Color / Gradients */}
          <div className="space-y-2">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Visual Gradient Accent
            </label>
            <div className="grid grid-cols-3 gap-2">
              {AVATAR_COLORS.map((col) => (
                <button
                  key={col.name}
                  onClick={() => setSelectedColor(col.value)}
                  className={`p-2.5 rounded-xl bg-gradient-to-tr ${col.value} border flex items-center justify-between text-left text-xs font-semibold truncate transition cursor-pointer relative ${
                    selectedColor === col.value
                      ? "ring-2 ring-indigo-500 scale-[1.02]"
                      : "hover:opacity-95"
                  }`}
                >
                  <span className="truncate">{col.name.split(" ")[1]}</span>
                  {selectedColor === col.value && <Check size={14} className="shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* Preferred Language for Sarvam */}
          <div className="space-y-2">
            <div className="flex items-center space-x-1">
              <Languages size={14} className="text-slate-400" />
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Primary Speaking & Transcription Language
              </label>
            </div>
            <select
              value={preferredLang}
              onChange={(e) => setPreferredLang(e.target.value)}
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name} ({lang.nativeName})
                </option>
              ))}
            </select>
            <span className="text-[10px] text-slate-400 flex items-center space-x-1 leading-none">
              <Info size={11} className="shrink-0" />
              <span>Voice inputs and spoken text translations are optimized for this choice.</span>
            </span>
          </div>

          {/* Preferred model for Groq */}
          <div className="space-y-2">
            <div className="flex items-center space-x-1">
              <Cpu size={14} className="text-slate-400" />
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Default LLM Model Engine (Groq)
              </label>
            </div>
            <div className="space-y-2">
              {LLM_MODELS.map((model) => (
                <div
                  key={model.id}
                  onClick={() => setPreferredMod(model.id)}
                  className={`p-3 border rounded-xl flex items-center justify-between cursor-pointer transition ${
                    preferredMod === model.id
                      ? "border-indigo-500 bg-indigo-550/5 dark:bg-indigo-950/20"
                      : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/40"
                  }`}
                >
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                      {model.name}
                    </h4>
                    <span className="text-[10px] font-mono text-slate-400">
                      Engine provider: {model.provider}
                    </span>
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                    preferredMod === model.id ? "border-indigo-500 bg-indigo-600" : "border-slate-300"
                  }`}>
                    {preferredMod === model.id && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end p-5 border-t border-slate-100 dark:border-slate-800 space-x-3 bg-slate-50 dark:bg-slate-900/60 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md cursor-pointer disabled:opacity-50 transition duration-150"
          >
            {isSaving ? "Saving..." : "Save Selection"}
          </button>
        </div>

      </div>
    </div>
  );
}
