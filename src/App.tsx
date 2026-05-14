/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Map as MapIcon, 
  Battery, 
  Zap, 
  Navigation2, 
  Activity, 
  Bot, 
  Settings, 
  ShieldCheck,
  Thermometer,
  Cpu,
  Disc
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { getAssistantResponse, ChatMessage } from './lib/gemini';

// --- Mock Data ---
const energyData = [
  { time: '08:00', consumption: 12.5 },
  { time: '10:00', consumption: 18.2 },
  { time: '12:00', consumption: 15.8 },
  { time: '14:00', consumption: 22.4 },
  { time: '16:00', consumption: 19.1 },
  { time: '18:00', consumption: 14.2 },
];

const chargingStations = [
  { id: '1', name: 'VoltHub Alpha', lat: 37.7749, lng: -122.4194, speed: '250kW' },
  { id: '2', name: 'SuperCharge Beta', lat: 37.7833, lng: -122.4167, speed: '150kW' },
  { id: '3', name: 'EcoCharge Gamma', lat: 37.7667, lng: -122.4333, speed: '50kW' },
];

const MAP_KEY = process.env.GOOGLE_MAPS_PLATFORM_KEY || '';

// --- Components ---

const Sidebar = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (t: string) => void }) => (
  <div className="w-20 h-full bg-voltx-sidebar border-r border-[#1a1a2e] flex flex-col items-center py-8 gap-10">
    <div className="w-10 h-10 bg-voltx-cyan rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.5)] mb-4">
      <Zap className="w-6 h-6 text-voltx-dark" fill="currentColor" />
    </div>

    <nav className="flex flex-col gap-8">
      <div 
        className={`p-3 rounded-lg transition-all cursor-pointer ${activeTab === 'dashboard' ? 'text-voltx-cyan bg-voltx-cyan/10 border border-voltx-cyan/20' : 'text-white/40 hover:text-white/60'}`} 
        onClick={() => setActiveTab('dashboard')}
        title="Dashboard"
      >
        <BarChart3 className="w-6 h-6" />
      </div>
      <div 
        className={`p-3 rounded-lg transition-all cursor-pointer ${activeTab === 'map' ? 'text-voltx-cyan bg-voltx-cyan/10 border border-voltx-cyan/20' : 'text-white/40 hover:text-white/60'}`} 
        onClick={() => setActiveTab('map')}
        title="Charge Map"
      >
        <MapIcon className="w-6 h-6" />
      </div>
      <div 
        className={`p-3 rounded-lg transition-all cursor-pointer ${activeTab === 'analytics' ? 'text-voltx-cyan bg-voltx-cyan/10 border border-voltx-cyan/20' : 'text-white/40 hover:text-white/60'}`} 
        onClick={() => setActiveTab('analytics')}
        title="Analytics"
      >
        <Activity className="w-6 h-6" />
      </div>
      <div 
        className={`p-3 rounded-lg transition-all cursor-pointer ${activeTab === 'assistant' ? 'text-voltx-cyan bg-voltx-cyan/10 border border-voltx-cyan/20' : 'text-white/40 hover:text-white/60'}`} 
        onClick={() => setActiveTab('assistant')}
        title="AI Assistant"
      >
        <Bot className="w-6 h-6" />
      </div>
    </nav>

    <div className="mt-auto">
      <div className="p-3 text-white/20 hover:text-white/40 cursor-pointer">
        <Settings className="w-6 h-6" />
      </div>
    </div>
  </div>
);

const StatCard = ({ icon: Icon, label, value, unit, trend }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-[#0c0c18] border border-white/5 rounded-2xl p-4 flex flex-col justify-between group hover:border-voltx-cyan/30 transition-all duration-500 min-h-[140px]"
  >
    <div className="flex justify-between items-start">
      <span className="text-[10px] uppercase tracking-widest text-white/30 font-bold">{label}</span>
      <div className="p-1 rounded-md bg-white/5 text-white/20 group-hover:text-voltx-cyan transition-colors">
        <Icon className="w-4 h-4" />
      </div>
    </div>
    <div className="flex flex-col gap-1">
      <div className="text-2xl font-mono tracking-tighter flex items-baseline gap-1">
        {value}
        <span className="text-xs text-white/40 uppercase font-medium">{unit}</span>
      </div>
      {trend && (
        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-1">
          <div className="w-2/3 h-full bg-voltx-cyan shadow-[0_0_8px_rgba(34,211,238,0.5)]"></div>
        </div>
      )}
    </div>
  </motion.div>
);

const ChargingMap = () => {
  if (!MAP_KEY) {
    return (
      <div className="h-full glass-panel flex flex-col items-center justify-center p-12 text-center gap-4">
        <MapIcon className="w-16 h-16 text-slate-700 animate-pulse" />
        <h2 className="text-xl font-bold text-slate-300 uppercase tracking-widest">Map Systems Offline</h2>
        <p className="text-slate-500 max-w-sm text-sm">To enable the EV Charging Network, please add your GOOGLE_MAPS_PLATFORM_KEY to the application secrets.</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full rounded-2xl overflow-hidden glass-panel border-voltx-cyan/10">
      <APIProvider apiKey={MAP_KEY} version="weekly">
        <Map
          defaultCenter={{ lat: 37.7749, lng: -122.4194 }}
          defaultZoom={13}
          mapId="VOLTX_DASHBOARD"
          colorScheme="DARK"
          disableDefaultUI={true}
          style={{ width: '100%', height: '100%' }}
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        >
          {chargingStations.map(station => (
            <AdvancedMarker key={station.id} position={{ lat: station.lat, lng: station.lng }}>
              <div className="group relative">
                <div className="w-8 h-8 bg-voltx-cyan border-2 border-white rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(0,242,255,0.8)] cursor-pointer">
                  <Zap className="w-4 h-4 text-voltx-dark" fill="currentColor" />
                </div>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="glass-panel p-2 text-xs">
                    <p className="font-bold">{station.name}</p>
                    <p className="text-voltx-cyan">{station.speed}</p>
                  </div>
                </div>
              </div>
            </AdvancedMarker>
          ))}
        </Map>
      </APIProvider>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel p-3 border-voltx-cyan/30 text-xs">
        <p className="text-slate-400 mb-1">{label}</p>
        <p className="text-voltx-cyan font-mono font-bold">
          {`Consumption: ${payload[0].value} kWh`}
        </p>
      </div>
    );
  }
  return null;
};

const Analytics = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
    <div className="glass-panel p-6 flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold uppercase tracking-widest flex items-center gap-2">
            <Activity className="w-5 h-5 text-voltx-cyan" />
            Energy Flux
          </h2>
          <p className="text-xs text-slate-500">Real-time consumption telemetry (%)</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-mono text-voltx-cyan">18.4 <span className="text-sm">kW</span></p>
          <p className="text-[10px] uppercase text-green-500 font-bold">-2.1% from avg</p>
        </div>
      </div>
      <div className="flex-1 min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={energyData}>
            <defs>
              <linearGradient id="colorCons" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00f2ff" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#00f2ff" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis 
              dataKey="time" 
              stroke="rgba(255,255,255,0.3)" 
              fontSize={10} 
              axisLine={false}
              tickLine={false} 
            />
            <YAxis 
              stroke="rgba(255,255,255,0.3)" 
              fontSize={10} 
              axisLine={false}
              tickLine={false} 
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="consumption" 
              stroke="#00f2ff" 
              fillOpacity={1} 
              fill="url(#colorCons)" 
              strokeWidth={3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4 h-full">
      <StatCard icon={ShieldCheck} label="System Integrity" value="98.5" unit="%" />
      <StatCard icon={Thermometer} label="Core Temp" value="38" unit="°C" />
      <StatCard icon={Cpu} label="Compute Load" value="12" unit="%" />
      <StatCard icon={Disc} label="PSI Avg" value="34.2" unit="psi" />
      <div className="col-span-2 glass-panel p-5 flex items-center justify-between border-voltx-cyan/10">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-widest">Firmware Version</p>
          <p className="font-mono text-voltx-cyan text-lg">v2.4.9-Stable</p>
        </div>
        <button className="px-4 py-2 bg-voltx-cyan/10 border border-voltx-cyan/30 rounded-lg text-voltx-cyan text-xs font-bold uppercase tracking-wider hover:bg-voltx-cyan/20 transition-all">
          Check Updates
        </button>
      </div>
    </div>
  </div>
);

const Assistant = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const response = await getAssistantResponse(messages, input);
    setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    setIsTyping(false);
  };

  return (
    <div className="h-full flex flex-col bg-[#0c0c18] border border-white/5 rounded-3xl max-w-3xl mx-auto shadow-2xl">
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
           <Bot className="w-4 h-4 text-voltx-cyan" />
           AI Assistant
        </span>
        <div className="flex gap-1">
          <div className="w-1 h-1 bg-voltx-cyan rounded-full"></div>
          <div className="w-1 h-1 bg-voltx-cyan rounded-full animate-bounce"></div>
          <div className="w-1 h-1 bg-voltx-cyan rounded-full"></div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 scrollbar-thin scrollbar-thumb-white/10">
        {messages.length === 0 && (
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <p className="text-sm leading-relaxed text-white/80">
              Optimal charging window detected between <span className="text-voltx-cyan">02:00</span> and <span className="text-voltx-cyan">06:00 AM</span>. Projected savings: $4.20.
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-4 rounded-xl text-sm ${
              msg.role === 'user' 
                ? 'bg-voltx-cyan/10 border border-voltx-cyan/20 text-voltx-cyan font-mono' 
                : 'bg-white/5 border border-white/10 text-white/80'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white/5 border border-white/5 px-4 py-2 rounded-lg animate-pulse">
              <span className="text-white/30 text-[10px] uppercase font-mono tracking-widest">Computing...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 border-t border-white/5">
        <div className="flex gap-2 p-2 bg-white/5 rounded-2xl border border-white/10 focus-within:border-voltx-cyan/40 transition-all">
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Query tactical systems..."
            className="flex-1 bg-transparent px-4 py-2 text-sm focus:outline-none"
          />
          <button 
            onClick={handleSend}
            className="p-3 bg-voltx-cyan text-voltx-dark rounded-xl hover:bg-voltx-cyan/80 transition-colors shadow-[0_0_15px_rgba(34,211,238,0.4)]"
          >
            <Navigation2 className="w-5 h-5 rotate-90" />
          </button>
        </div>
      </div>
    </div>
  );
};

const DashboardView = () => (
  <div className="flex flex-col gap-6">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <StatCard icon={Battery} label="Energy Level" value="84" unit="%" trend="+12%" />
      <StatCard icon={Zap} label="Projected Range" value="382" unit="mi" />
      <StatCard icon={Navigation2} label="Est. Arrival" value="14:48" unit="PM" />
      <StatCard icon={Activity} label="Health Index" value="94" unit="%" />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 h-[450px]">
        <ChargingMap />
      </div>
      <div className="h-[450px]">
        <div className="glass-panel h-full flex flex-col p-6 gap-6">
           <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
             <Bot className="w-4 h-4 text-voltx-cyan" />
             Tactical Briefing
           </h3>
           <div className="flex-1 flex flex-col gap-4 text-sm">
             <div className="p-4 bg-voltx-cyan/5 border border-voltx-cyan/10 rounded-xl flex gap-3">
                <Zap className="w-5 h-5 text-voltx-cyan shrink-0" />
                <p className="text-slate-300">Fast-charge available at <span className="text-voltx-cyan">VoltHub Alpha</span>. High probability of wait time &lt; 5 min.</p>
             </div>
             <div className="p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-xl flex gap-3">
                <ShieldCheck className="w-5 h-5 text-yellow-500 shrink-0" />
                <p className="text-slate-300">Brake regenerative efficiency at 92%. Monitoring for thermal drift on Front Right motor.</p>
             </div>
             <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl flex gap-3">
                <Navigation2 className="w-5 h-5 text-blue-500 shrink-0" />
                <p className="text-slate-300">Route optimized: Save 4.2 kWh by avoiding steep incline on Geary Blvd.</p>
             </div>
           </div>
           <button className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-voltx-cyan hover:bg-voltx-cyan/10 text-xs font-bold uppercase tracking-widest transition-all">
             Full System Log
           </button>
        </div>
      </div>
    </div>
  </div>
);

// --- App ---

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="flex h-screen w-full bg-voltx-dark border-4 border-[#1a1a2e] overflow-hidden select-none">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 h-full overflow-y-auto p-6 relative flex flex-col">
        <div className="scanline" />
        
        {/* Header */}
        <header className="flex justify-between items-center mb-6 px-2">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold tracking-tighter text-voltx-cyan uppercase">
              VOLT<span className="text-white">X</span> DASHBOARD
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-white/30 font-mono">
              System Version 4.2.0-Alpha // All Systems Nominal
            </p>
          </div>
          
          <div className="flex gap-12 items-center">
            <div className="text-right">
              <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Current Location</div>
              <div className="font-medium text-sm text-[#e0e0e8]">San Francisco, CA</div>
            </div>
            <div className="w-[1px] h-8 bg-white/10"></div>
            <div className="text-right font-mono">
              <div className="text-3xl font-bold tracking-tighter text-white">
                10:42<span className="text-sm text-white/40 ml-1">PM</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 1.02, filter: 'blur(10px)' }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1"
          >
            {activeTab === 'dashboard' && <DashboardView />}
            {activeTab === 'map' && <div className="h-full"><ChargingMap /></div>}
            {activeTab === 'analytics' && <Analytics />}
            {activeTab === 'assistant' && <Assistant />}
          </motion.div>
        </AnimatePresence>
        
        <footer className="h-10 mt-6 flex items-center justify-between border-t border-white/5 px-2">
          <div className="flex gap-6 text-[10px] font-mono text-white/40 uppercase tracking-widest">
            <span>Network: 5G Ultra Wideband</span>
            <span>Secure Link: AES-256 Enabled</span>
            <span>Drive Mode: Dynamic</span>
          </div>
          <div className="flex gap-4">
            <div className="w-3 h-3 rounded bg-voltx-cyan/20 border border-voltx-cyan/40"></div>
            <div className="w-3 h-3 rounded bg-white/10"></div>
            <div className="w-3 h-3 rounded bg-white/10"></div>
          </div>
        </footer>
      </main>
    </div>
  );
}

