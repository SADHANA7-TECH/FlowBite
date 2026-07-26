import React, { useState, useEffect } from 'react';
import { Sparkles, Utensils, RefreshCw, Plus, Check, Lightbulb, Wine, Heart, Flame } from 'lucide-react';
import { MenuItem, AiSuggestionItem } from '../types';
import { fetchAiSuggestions } from '../lib/api';

interface AiSuggestionsSectionProps {
  menu: MenuItem[];
  cartItemIds: string[];
  onAddToCart: (item: MenuItem) => void;
}

export const AiSuggestionsSection: React.FC<AiSuggestionsSectionProps> = ({
  menu,
  cartItemIds,
  onAddToCart,
}) => {
  const [selectedPreference, setSelectedPreference] = useState<string>('Chef Specials & Pairings');
  const [customRequest, setCustomRequest] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [suggestionData, setSuggestionData] = useState<{
    chefRecommendation: string;
    suggestedItems: AiSuggestionItem[];
  } | null>(null);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  const presetPreferences = [
    'Chef Specials & Pairings',
    'Light & Healthy Lunch',
    'Comfort Food & Burgers',
    'Vegetarian Favorites',
    'Spicy & Bold Flavors',
  ];

  const loadSuggestions = async (pref?: string) => {
    setLoading(true);
    try {
      const data = await fetchAiSuggestions({
        preference: pref || customRequest || selectedPreference,
        cartItemIds,
      });
      setSuggestionData(data);
    } catch (err) {
      console.error('Error fetching AI suggestions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuggestions('Chef Specials & Pairings');
  }, [cartItemIds.length]);

  const handleAddSuggestedItem = (item: AiSuggestionItem) => {
    const matchedMenuItem = menu.find((m) => m.id === item.id || m.name.toLowerCase() === item.name.toLowerCase());
    if (matchedMenuItem) {
      onAddToCart(matchedMenuItem);
      setAddedIds((prev) => ({ ...prev, [item.id]: true }));
      setTimeout(() => {
        setAddedIds((prev) => ({ ...prev, [item.id]: false }));
      }, 2000);
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-5 border border-purple-500/30 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-purple-500/20 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 font-black flex items-center justify-center shadow-md shrink-0">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-black text-white tracking-tight">AI Food & Drink Sommelier Suggestions</h2>
              <span className="bg-amber-400 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                Smart Recommendation
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              Personalized dish pairing, dietary recommendations & chef choices
            </p>
          </div>
        </div>

        <button
          onClick={() => loadSuggestions()}
          disabled={loading}
          className="flex items-center space-x-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3 py-1.8 rounded-xl border border-white/20 transition-all shrink-0 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-amber-300 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh AI</span>
        </button>
      </div>

      {/* Preset Preference Filter Pills */}
      <div className="space-y-2">
        <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Select Preference / Craving:</p>
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs no-scrollbar">
          {presetPreferences.map((pref) => (
            <button
              key={pref}
              onClick={() => {
                setSelectedPreference(pref);
                loadSuggestions(pref);
              }}
              disabled={loading}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all border ${
                selectedPreference === pref
                  ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-md font-black'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
              }`}
            >
              {pref}
            </button>
          ))}
        </div>
      </div>

      {/* Custom AI Query Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (customRequest.trim()) loadSuggestions(customRequest);
        }}
        className="flex items-center space-x-2"
      >
        <input
          type="text"
          placeholder="e.g. 'What pairs best with a spicy main dish?' or 'Light dinner under $20'"
          value={customRequest}
          onChange={(e) => setCustomRequest(e.target.value)}
          className="flex-1 bg-slate-900/90 text-xs font-bold text-white border border-purple-500/30 rounded-2xl px-4 py-2.5 focus:outline-none focus:border-amber-400 placeholder:text-slate-500"
        />
        <button
          type="submit"
          disabled={loading || !customRequest.trim()}
          className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-4 py-2.5 rounded-2xl transition-all shadow-md shrink-0 disabled:opacity-50"
        >
          Ask AI
        </button>
      </form>

      {/* Sommelier Advice Note */}
      {suggestionData?.chefRecommendation && (
        <div className="bg-purple-900/40 p-3 rounded-2xl border border-purple-400/30 text-xs space-y-1 flex items-start space-x-2">
          <Lightbulb className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
          <p className="text-purple-100 font-medium leading-relaxed">
            <strong className="text-amber-300 font-black">AI Sommelier Note: </strong>
            {suggestionData.chefRecommendation}
          </p>
        </div>
      )}

      {/* Suggested Items Grid */}
      {loading ? (
        <div className="py-6 text-center space-y-2">
          <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-300 font-bold">Consulting AI Gourmet Engine for suggestions...</p>
        </div>
      ) : suggestionData?.suggestedItems && suggestionData.suggestedItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
          {suggestionData.suggestedItems.slice(0, 3).map((item) => {
            const isAdded = addedIds[item.id];
            return (
              <div
                key={item.id}
                className="bg-white/10 hover:bg-white/15 p-3.5 rounded-2xl border border-white/10 transition-all flex flex-col justify-between space-y-2"
              >
                <div className="space-y-1">
                  <div className="flex items-start justify-between gap-1">
                    <h3 className="font-extrabold text-xs text-white leading-snug">{item.name}</h3>
                    <span className="font-black text-amber-300 text-xs">${item.price.toFixed(2)}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-snug font-medium">{item.reason}</p>
                  {item.pairingNote && (
                    <p className="text-[10px] text-amber-200/90 font-bold flex items-center gap-1 pt-0.5">
                      <Wine className="w-3 h-3 text-amber-300 shrink-0" />
                      <span>{item.pairingNote}</span>
                    </p>
                  )}
                </div>

                <button
                  onClick={() => handleAddSuggestedItem(item)}
                  className={`w-full text-xs font-black py-2 px-3 rounded-xl flex items-center justify-center space-x-1.5 transition-all shadow-xs ${
                    isAdded
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                  }`}
                >
                  {isAdded ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Added to Order!</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Suggested Item</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};
