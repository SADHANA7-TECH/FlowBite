import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Search,
  Send,
  AlertTriangle,
  Clock,
  Zap,
  Boxes,
  Users,
  ChefHat,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  BarChart3,
  Lightbulb,
  HelpCircle,
  HelpCircle as QuestionIcon,
  Play,
  Sliders,
  ShieldAlert,
} from 'lucide-react';
import {
  Order,
  Ingredient,
  MenuItem,
  DiningTable,
  QueueEntry,
  AnalyticsSummary,
  CopilotResponse,
  SmartRecommendation,
  WhatIfResult,
} from '../types';
import { queryCopilot, simulateWhatIfScenario } from '../lib/api';

interface AiCopilotProps {
  orders: Order[];
  ingredients: Ingredient[];
  menu: MenuItem[];
  tables: DiningTable[];
  queue: QueueEntry[];
  analytics: AnalyticsSummary;
  onUpdateInventoryStock: (ingredientId: string, currentStock: number) => Promise<void>;
  onToggleMenuItem: (menuItemId: string, isAvailable?: boolean) => Promise<void>;
  onUpdateQueueStatus: (queueId: string, status: string) => Promise<void>;
  onTriggerAIPredictions: () => Promise<void>;
}

export const AiCopilot: React.FC<AiCopilotProps> = ({
  orders,
  ingredients,
  menu,
  tables,
  queue,
  analytics,
  onUpdateInventoryStock,
  onToggleMenuItem,
  onUpdateQueueStatus,
  onTriggerAIPredictions,
}) => {
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [copilotData, setCopilotData] = useState<CopilotResponse | null>(null);
  const [actionNotice, setActionNotice] = useState<string>('');

  // What-If Simulator State
  const [whatIfPrompt, setWhatIfPrompt] = useState<string>('What if 50 additional customers arrive in the next hour?');
  const [whatIfLoading, setWhatIfLoading] = useState<boolean>(false);
  const [whatIfResult, setWhatIfResult] = useState<WhatIfResult | null>(null);

  // The 6 exact manager operational questions requested
  const presetQuestions = [
    'Which menu items may become unavailable today?',
    'Why is the current waiting time increasing?',
    'Which dishes should we prepare more of?',
    'Which ingredients need restocking?',
    'What operational problem requires immediate attention?',
    'What can we do to reduce today\'s waiting time?',
  ];

  const presetWhatIfScenarios = [
    'What if 50 additional customers arrive in the next hour?',
    'What if Jasmine Rice stock drops by 50% during dinner rush?',
    'What if 2 line cooks call in sick at peak dinner time?',
  ];

  const fetchCopilotAnalysis = async (queryText?: string) => {
    setLoading(true);
    try {
      const data = await queryCopilot(queryText || customPrompt || presetQuestions[0]);
      setCopilotData(data);
    } catch (err) {
      console.error('Error querying copilot:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunWhatIfSimulation = async (scenarioText?: string) => {
    const promptToRun = scenarioText || whatIfPrompt;
    setWhatIfLoading(true);
    try {
      const result = await simulateWhatIfScenario(promptToRun);
      setWhatIfResult(result);
    } catch (err) {
      console.error('Error running What-If scenario:', err);
    } finally {
      setWhatIfLoading(false);
    }
  };

  useEffect(() => {
    fetchCopilotAnalysis(presetQuestions[0]);
    handleRunWhatIfSimulation(presetWhatIfScenarios[0]);
  }, []);

  const handleExecuteRecommendation = async (rec: SmartRecommendation) => {
    try {
      if (rec.actionType === 'restock_ingredient' && rec.targetId) {
        const ing = ingredients.find((i) => i.id === rec.targetId);
        const newStock = (ing?.currentStock || 10) + 20;
        await onUpdateInventoryStock(rec.targetId, newStock);
        setActionNotice(`Executed: Restocked ${ing?.name || 'Ingredient'} to ${newStock} ${ing?.unit || 'units'}.`);
      } else if (rec.actionType === 'toggle_menu_86' && rec.targetId) {
        await onToggleMenuItem(rec.targetId, false);
        setActionNotice(`Executed: Auto-86 toggled for menu item.`);
      } else if (rec.actionType === 'notify_waitlist') {
        const nextInQueue = queue.find((q) => q.status === 'waiting');
        if (nextInQueue) {
          await onUpdateQueueStatus(nextInQueue.id, 'notified');
          setActionNotice(`Executed: Sent seating SMS alert to ${nextInQueue.customerName}.`);
        } else {
          setActionNotice(`Executed: Checked waitlist queue.`);
        }
      } else {
        await onTriggerAIPredictions();
        setActionNotice(`Executed: Rebalanced station workloads & triggered kitchen sync.`);
      }

      setTimeout(() => setActionNotice(''), 4000);
      fetchCopilotAnalysis(copilotData?.query || '');
    } catch (err) {
      alert((err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white rounded-3xl p-6 border border-purple-500/30 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 font-black flex items-center justify-center shadow-lg shrink-0">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-black tracking-tight text-white">AI Restaurant Copilot</h1>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                  Live Telemetry Connected
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Real-time operational intelligence, inventory predictions, demand forecasting & what-if simulator
              </p>
            </div>
          </div>

          <button
            onClick={() => fetchCopilotAnalysis(copilotData?.query)}
            disabled={loading}
            className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs px-4 py-2.5 rounded-2xl border border-white/20 transition-all shadow-xs shrink-0 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-amber-300 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Analyzing Data...' : 'Refresh AI Analysis'}</span>
          </button>
        </div>

        {/* Live Restaurant Telemetry Pill Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-white/10 text-xs">
          <div className="bg-white/5 rounded-2xl p-2.5 border border-white/10 flex items-center space-x-2">
            <ChefHat className="w-4 h-4 text-orange-400 shrink-0" />
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Kitchen Orders</p>
              <p className="font-black text-white">{orders.filter((o) => o.status !== 'completed').length} Active</p>
            </div>
          </div>

          <div className="bg-white/5 rounded-2xl p-2.5 border border-white/10 flex items-center space-x-2">
            <Boxes className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Low Stock Alert</p>
              <p className="font-black text-amber-300">
                {ingredients.filter((i) => i.currentStock <= i.minThreshold).length} Ingredients
              </p>
            </div>
          </div>

          <div className="bg-white/5 rounded-2xl p-2.5 border border-white/10 flex items-center space-x-2">
            <Users className="w-4 h-4 text-cyan-400 shrink-0" />
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Waitlist Queue</p>
              <p className="font-black text-white">{queue.filter((q) => q.status === 'waiting').length} Parties</p>
            </div>
          </div>

          <div className="bg-white/5 rounded-2xl p-2.5 border border-white/10 flex items-center space-x-2">
            <Clock className="w-4 h-4 text-purple-400 shrink-0" />
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Avg Ticket Time</p>
              <p className="font-black text-white">{analytics.avgPrepTimeMinutes} Mins</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Notice Alert */}
      {actionNotice && (
        <div className="bg-emerald-900/90 text-emerald-100 p-3.5 rounded-2xl border border-emerald-500/40 text-xs font-bold flex items-center space-x-2 shadow-md animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* SECTION 1: MANAGER OPERATIONAL QUESTIONS & COPILOT CHAT */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div>
          <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <QuestionIcon className="w-4 h-4 text-purple-600" />
            <span>Manager Operational Questions (Click to Ask AI)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Select a core operational query below or enter a custom question for real-time analysis based on actual database state:
          </p>
        </div>

        {/* 6 Preset Manager Questions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {presetQuestions.map((q, idx) => {
            const isSelected = copilotData?.query === q;
            return (
              <button
                key={idx}
                onClick={() => {
                  setCustomPrompt(q);
                  fetchCopilotAnalysis(q);
                }}
                disabled={loading}
                className={`text-left text-xs font-extrabold p-3 rounded-2xl transition-all border flex items-start space-x-2.5 ${
                  isSelected
                    ? 'bg-purple-900 text-white border-purple-900 shadow-md scale-101'
                    : 'bg-slate-50 text-slate-800 hover:bg-slate-100 border-slate-200 hover:border-slate-300'
                }`}
              >
                <span className={`w-5 h-5 rounded-lg flex items-center justify-center font-black text-[10px] shrink-0 mt-0.5 ${
                  isSelected ? 'bg-amber-400 text-slate-950' : 'bg-slate-200 text-slate-700'
                }`}>
                  {idx + 1}
                </span>
                <span className="leading-snug flex-1">{q}</span>
              </button>
            );
          })}
        </div>

        {/* Custom Question Form Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (customPrompt.trim()) fetchCopilotAnalysis(customPrompt);
          }}
          className="flex items-center space-x-2 pt-2"
        >
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Ask Copilot e.g., 'Which items sold the most during lunch rush today?'"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-2xl pl-4 pr-10 py-3 text-slate-900 focus:outline-none focus:border-slate-900 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !customPrompt.trim()}
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold px-5 py-3 rounded-2xl flex items-center space-x-1.5 transition-all shadow-md disabled:opacity-50 shrink-0"
          >
            <span>Query AI</span>
            <Send className="w-3.5 h-3.5 text-amber-400" />
          </button>
        </form>

        {/* Structured Response Cards Grid */}
        {copilotData?.structuredInsights && copilotData.structuredInsights.length > 0 && (
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Structured Operational Analysis</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {copilotData.structuredInsights.map((item, i) => {
                const riskBadge = {
                  HIGH: 'bg-rose-600 text-white',
                  MEDIUM: 'bg-amber-500 text-slate-950 font-black',
                  LOW: 'bg-emerald-600 text-white',
                }[item.risk] || 'bg-slate-600 text-white';

                const cardStyle = {
                  HIGH: 'bg-rose-50/70 border-rose-200 text-rose-950',
                  MEDIUM: 'bg-amber-50/70 border-amber-200 text-amber-950',
                  LOW: 'bg-slate-50 border-slate-200 text-slate-900',
                }[item.risk] || 'bg-slate-50 border-slate-200 text-slate-900';

                return (
                  <div key={i} className={`p-4 rounded-2xl border shadow-2xs space-y-2.5 ${cardStyle}`}>
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-extrabold text-xs text-slate-900 leading-snug">
                        {item.insight}
                      </span>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 ${riskBadge}`}>
                        {item.risk} Risk
                      </span>
                    </div>

                    <div className="text-[11px] space-y-1">
                      <p className="text-slate-600">
                        <strong className="text-slate-800">Reason:</strong> {item.reason}
                      </p>
                      <div className="bg-white/90 p-2.5 rounded-xl border border-black/5 mt-1.5 space-y-0.5">
                        <p className="text-[10px] font-black uppercase text-purple-900">Recommended Action:</p>
                        <p className="text-slate-800 font-bold">{item.recommendedAction}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Copilot Markdown Response Output */}
        {loading ? (
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 text-center space-y-2">
            <div className="w-8 h-8 rounded-full border-2 border-purple-600 border-t-transparent animate-spin mx-auto" />
            <p className="text-xs font-extrabold text-slate-700">Analyzing live POS, KDS & Inventory telemetry...</p>
          </div>
        ) : copilotData ? (
          <div className="bg-gradient-to-br from-purple-50/60 via-slate-50 to-indigo-50/50 rounded-2xl p-5 border border-purple-200/80 space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-purple-100 pb-2.5">
              <span className="text-[11px] font-black uppercase text-purple-900 tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Detailed AI Copilot Analysis: "{copilotData.query}"
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Generated: {copilotData.generatedAt}</span>
            </div>

            <div className="text-xs text-slate-800 space-y-2 leading-relaxed font-medium">
              {copilotData.answer.split('\n\n').map((paragraph, i) => (
                <div key={i} className="bg-white/80 rounded-xl p-3 border border-purple-100/60 shadow-2xs">
                  {paragraph.split('\n').map((line, j) => {
                    if (line.startsWith('### ')) {
                      return <h4 key={j} className="font-black text-slate-900 text-sm mb-1">{line.replace('### ', '')}</h4>;
                    }
                    if (line.startsWith('- ') || line.startsWith('1. ') || line.startsWith('2. ') || line.startsWith('3. ')) {
                      return (
                        <p key={j} className="pl-2 my-0.5 flex items-start space-x-1.5 text-slate-700">
                          <span className="text-purple-600 font-bold shrink-0">•</span>
                          <span>{line.replace(/^[-123.]+\s*/, '')}</span>
                        </p>
                      );
                    }
                    return <p key={j} className="my-0.5">{line}</p>;
                  })}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {/* SECTION 2: WHAT-IF OPERATIONAL SIMULATOR */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-slate-950 font-black">
              <Sliders className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">4. What-If Operational Scenario Simulator</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Stress-test kitchen capacity, wait times, and inventory depletion under custom future rush scenarios
              </p>
            </div>
          </div>
          <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-black px-3 py-1 rounded-full uppercase">
            Simulation Engine
          </span>
        </div>

        {/* Preset What-If Chips */}
        <div className="space-y-2">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Quick Preset Scenarios:</p>
          <div className="flex flex-wrap gap-2">
            {presetWhatIfScenarios.map((sc, i) => (
              <button
                key={i}
                onClick={() => {
                  setWhatIfPrompt(sc);
                  handleRunWhatIfSimulation(sc);
                }}
                disabled={whatIfLoading}
                className={`text-xs font-bold px-3.5 py-2 rounded-xl border transition-all ${
                  whatIfPrompt === sc
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700'
                }`}
              >
                {sc}
              </button>
            ))}
          </div>
        </div>

        {/* Scenario Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (whatIfPrompt.trim()) handleRunWhatIfSimulation(whatIfPrompt);
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            placeholder="Type scenario e.g. 'What if 40 takeaway orders arrive in 30 minutes?'"
            value={whatIfPrompt}
            onChange={(e) => setWhatIfPrompt(e.target.value)}
            className="flex-1 bg-slate-800 border border-slate-700 text-xs font-bold text-white rounded-2xl px-4 py-3 focus:outline-none focus:border-cyan-400"
          />
          <button
            type="submit"
            disabled={whatIfLoading || !whatIfPrompt.trim()}
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black px-5 py-3 rounded-2xl flex items-center space-x-2 transition-all shadow-md shrink-0 disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 fill-slate-950 ${whatIfLoading ? 'animate-spin' : ''}`} />
            <span>{whatIfLoading ? 'Simulating...' : 'Run Simulation'}</span>
          </button>
        </form>

        {/* What-If Simulation Output */}
        {whatIfResult && (
          <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-black text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                Simulation Results: "{whatIfResult.scenarioPrompt}"
              </span>
              <span className="text-[11px] font-bold text-slate-400">
                Projected Wait Time: <strong className="text-amber-400 text-sm">{whatIfResult.waitTimeMinutes} Mins</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 space-y-1">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase">Queue Impact</p>
                <p className="font-extrabold text-white text-xs">{whatIfResult.queueImpact}</p>
              </div>

              <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 space-y-1">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase">Estimated Wait Increase</p>
                <p className="font-extrabold text-amber-400 text-xs">~{whatIfResult.waitTimeMinutes} Minutes Avg</p>
              </div>

              <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 space-y-1">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase">Potential Unavailable Dishes</p>
                <p className="font-extrabold text-rose-400 text-xs">{whatIfResult.potentialUnavailableItems.join(', ')}</p>
              </div>

              <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 space-y-1">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase">Critical Kitchen Workload</p>
                <p className="font-extrabold text-cyan-300 text-xs">
                  {whatIfResult.kitchenWorkload.filter(w => w.status !== 'Normal').map(w => `${w.station}: ${w.expectedTickets} tix`).join(', ') || 'Grill Overloaded'}
                </p>
              </div>
            </div>

            {/* Recommended Action Steps for Manager */}
            <div className="bg-cyan-950/30 rounded-xl p-3.5 border border-cyan-800/40 space-y-2 text-xs">
              <span className="font-black text-cyan-300 uppercase tracking-wider text-[11px] block">
                Recommended Mitigation Strategy:
              </span>
              <ul className="space-y-1 text-slate-300 font-medium">
                {whatIfResult.recommendedActions.map((act, i) => (
                  <li key={i} className="flex items-start space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <span>{act}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* THREE CORE REQUIRED ANALYTICAL SECTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. DEMAND FORECASTING */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-orange-100 text-orange-800">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Demand Forecasting</h3>
                <p className="text-[11px] text-slate-500">Peak hour covers & volume projection</p>
              </div>
            </div>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
              Rush Warning
            </span>
          </div>

          {copilotData?.demandForecast && (
            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold">Predicted Peak Window:</span>
                  <span className="font-black text-slate-900">{copilotData.demandForecast.peakHours}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold">Expected Orders Next Hour:</span>
                  <span className="font-black text-orange-600 text-sm">
                    ~{copilotData.demandForecast.expectedOrdersNextHour} Orders
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold">Projected Guests (Covers):</span>
                  <span className="font-black text-slate-900">{copilotData.demandForecast.coversForecast} Guests</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold">Station Bottleneck Risk:</span>
                  <span className="font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200">
                    {copilotData.demandForecast.stationBottleneck} Station
                  </span>
                </div>
              </div>

              <div className="bg-purple-50/70 rounded-2xl p-3 border border-purple-200/80 space-y-1.5">
                <span className="font-extrabold text-purple-900 text-[11px] uppercase tracking-wider block">
                  Top Prep Risk Dishes (Rush Volume)
                </span>
                <div className="flex flex-wrap gap-1">
                  {copilotData.demandForecast.topRiskDishes.map((dish, i) => (
                    <span key={i} className="bg-white text-slate-900 font-bold px-2 py-1 rounded-lg border border-purple-200 text-[11px]">
                      {dish}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 2. INVENTORY PREDICTION */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                <Boxes className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Inventory Prediction</h3>
                <p className="text-[11px] text-slate-500">Calculated depletion time per ingredient</p>
              </div>
            </div>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
              Auto-86 Risk
            </span>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {copilotData?.inventoryPredictions?.slice(0, 4).map((item, idx) => {
              const isCritical = item.riskLevel === 'high';
              return (
                <div
                  key={idx}
                  className={`p-3 rounded-2xl border text-xs space-y-1.5 transition-all ${
                    isCritical
                      ? 'bg-rose-50/60 border-rose-200 text-rose-950'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-900">{item.ingredientName}</span>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        isCritical ? 'bg-rose-600 text-white' : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {item.predictedDepletionTime}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 font-medium">
                    Current: <strong>{item.currentStock} {item.unit}</strong> • Draw Rate:{' '}
                    <strong>{item.consumptionRate} {item.unit}/hr</strong> (~{item.hoursRemaining} hrs left)
                  </p>

                  {item.affectedDishes.length > 0 && (
                    <p className="text-[10px] font-bold text-slate-500">
                      Auto-86 Dish Impact: <span className="text-slate-900">{item.affectedDishes.join(', ')}</span>
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. SMART OPERATIONAL RECOMMENDATIONS */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-purple-100 text-purple-800">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Smart Recommendations</h3>
                <p className="text-[11px] text-slate-500">1-Click execution actions for managers</p>
              </div>
            </div>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
              Interactive
            </span>
          </div>

          <div className="space-y-3">
            {copilotData?.smartRecommendations?.map((rec) => (
              <div
                key={rec.id}
                className="bg-slate-50 hover:bg-purple-50/40 p-3.5 rounded-2xl border border-slate-200 hover:border-purple-200 text-xs space-y-2 transition-all"
              >
                <div>
                  <h4 className="font-black text-slate-900 text-xs flex items-center justify-between">
                    <span>{rec.title}</span>
                    <span className="text-[9px] font-black uppercase bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md">
                      {rec.category}
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-1">{rec.description}</p>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] font-bold text-purple-700">{rec.impact}</span>
                  <button
                    onClick={() => handleExecuteRecommendation(rec)}
                    className="bg-slate-900 hover:bg-purple-700 text-white font-extrabold text-[11px] px-3 py-1.5 rounded-xl transition-all shadow-xs flex items-center space-x-1"
                  >
                    <span>Execute</span>
                    <ArrowRight className="w-3 h-3 text-amber-300" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
