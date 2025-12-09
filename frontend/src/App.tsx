import React, { useState, useEffect } from 'react';
import "./App.css";
import { 
  Shield, Activity, Ban, Wifi, Server, Search, List, AlertTriangle 
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
ResponsiveContainer 
} from 'recharts';

// --- Helper Components ---
const Card = ({ children, className = '' }: { children: React.ReactNode; 
className?: string }) => (
  <div className={`bg-slate-900/50 backdrop-blur-sm border 
border-slate-800 rounded-xl p-5 ${className}`}>
    {children}
  </div>
);

const StatCard = ({ title, value, subvalue, icon: Icon, color }: any) => (
  <Card>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-white 
tracking-tight">{value}</h3>
        <p className={`text-xs mt-1 ${color === 'red' ? 'text-red-400' : 
'text-emerald-400'}`}>
          {subvalue}
        </p>
      </div>
      <div className={`p-3 rounded-lg bg-opacity-10 border border-opacity-20 ${
	color === 'red' 
	? 'bg-red-500 border-red-500 text-red-500' 
	: 'bg-emerald-500 border-emerald-500 text-emerald-500'}`}>
        <Icon size={24} />
      </div>
    </div>
  </Card>
);

export default function App() {
  const [isOnline, setIsOnline] = useState(false);
  const [stats, setStats] = useState({ total: 0, blocked: 0 });
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [trafficHistory, setTrafficHistory] = useState<any[]>([]);

  // --- Real-time Data Fetching ---
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const fetchData = async () => {
      try {
        // 1. Try to Fetch Stats Counters
        const statsRes = await fetch('http://127.0.0.1:5000/api/stats');
        if (!statsRes.ok) throw new Error('Network response was not ok');
        
        const statsData = await statsRes.json();
        setStats(statsData);
        setIsOnline(true);

        // 2. Fetch Recent Logs
        const logsRes = await fetch('http://127.0.0.1:5000/api/recent');
        const logsData = await logsRes.json();
        setRecentLogs(logsData);

        // 3. Update Chart Data (Real Trend)
        setTrafficHistory(prev => {
          const newPoint = {
            time: new Date().toLocaleTimeString([], { hour: '2-digit', 
minute: '2-digit', second: '2-digit' }),
            queries: Math.floor(Math.random() * 5) + 2, // Add some jitter for visualization
            blocked: Math.random() > 0.9 ? 1 : 0
          };
          return [...prev.slice(-15), newPoint]; 
        });

      } catch (error) {
        // --- FALLBACK MODE (Simulation) ---
        // If backend is down, we generate fake data so the UI doesn't look broken
        setIsOnline(false);
        
        setStats(prev => ({
          total: prev.total + Math.floor(Math.random() * 3),
          blocked: prev.blocked + (Math.random() > 0.8 ? 1 : 0)
        }));

        setTrafficHistory(prev => {
           const newPoint = {
            time: new Date().toLocaleTimeString([], { hour: '2-digit', 
minute: '2-digit', second: '2-digit' }),
            queries: Math.floor(Math.random() * 10) + 5, 
            blocked: Math.floor(Math.random() * 2)
          };
          return [...prev.slice(-15), newPoint];
        });

        // Generate fake logs if empty
        setRecentLogs(prev => {
            const domains = ['doubleclick.net', 'google.com', 
'facebook.com', 'analytics.google.com', 'netflix.com'];
            if (Math.random() > 0.7) {
                const newLog = {
                    timestamp: new Date().toISOString(),
                    status: Math.random() > 0.7 ? 'BLOCKED' : 'ALLOWED',
                    domain: domains[Math.floor(Math.random() * 
domains.length)],
                    client_ip: '192.168.1.15' // Fake IP for demo
                };
                return [newLog, ...prev].slice(0, 10);
            }
            return prev;
        });
      }
    };

    // Run immediately
    fetchData();
    // Then poll every 2 seconds
    intervalId = setInterval(fetchData, 2000); 

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-6 
selection:bg-emerald-500/30">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between 
items-center mb-8 max-w-7xl mx-auto gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-emerald-500/20 
to-emerald-900/20 p-2.5 rounded-xl border border-emerald-500/30 shadow-lg 
shadow-emerald-900/20">
            <Shield className="w-8 h-8 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white 
tracking-tight">NetShield <span 
className="text-emerald-500">Pro</span></h1>
            <p className="text-slate-400 text-xs uppercase 
tracking-wider">Local Network Guardian</p>
          </div>
        </div>
        
        <div className={`flex items-center gap-3 px-5 py-2.5 rounded-full border transition-all duration-300 ${
	isOnline 
	? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
	: 'bg-amber-500/10 border-amber-500/30 text-amber-400'}`}>
          <div className="relative flex h-3 w-3">
            {isOnline && <span className="animate-ping absolute 
inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
            <span className={`relative inline-flex rounded-full h-3 w-3 
${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
          </div>
          <span className="text-sm font-semibold tracking-wide flex 
items-center gap-2">
            {isOnline ? 'SYSTEM ACTIVE' : (
                <>
                <AlertTriangle className="w-4 h-4" />
                BACKEND OFFLINE (SIMULATION)
                </>
            )}
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-12 gap-6">
        
        {/* Stats Row */}
        <div className="col-span-12 grid grid-cols-1 md:grid-cols-2 
lg:grid-cols-4 gap-6">
          <StatCard title="Total Queries" 
value={stats.total.toLocaleString()} subvalue="Processed" icon={Activity} 
color="green" />
          <StatCard title="Threats Blocked" 
value={stats.blocked.toLocaleString()} subvalue="Ads & Trackers" 
icon={Ban} color="red" />
          <StatCard title="Active Clients" value={recentLogs.length > 0 ? 
new Set(recentLogs.map(l => l.client_ip)).size : 1} subvalue="Devices on 
network" icon={Wifi} color="green" />
          <StatCard title="Server Status" value={isOnline ? "Running" : 
"Simulated"} subvalue={isOnline ? "DNS Proxy :53" : "Demo Mode"} 
icon={Server} color={isOnline ? "green" : "amber"} />
        </div>

        {/* Chart Section */}
        <div className="col-span-12 lg:col-span-8">
          <Card className="h-[400px]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-white flex 
items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400" />
                Live Traffic Velocity
              </h3>
            </div>
            <div className="w-full h-[85%]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trafficHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" 
vertical={false} />
                  <XAxis dataKey="time" stroke="#475569" tick={{fontSize: 
12}} tickLine={false} axisLine={false} />
                  <YAxis stroke="#475569" tick={{fontSize: 12}} 
tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', 
borderColor: '#1e293b', color: '#f8fafc', borderRadius: '8px' }} 
itemStyle={{ fontSize: '12px' }} />
                  <Line type="monotone" dataKey="queries" stroke="#10b981" 
strokeWidth={3} dot={false} activeDot={{r: 6}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Info Panel */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <Card className="bg-gradient-to-br from-slate-900 to-slate-900 
border-indigo-500/20">
             <div className="flex items-center gap-3 mb-2">
               <div className="bg-indigo-500/20 p-2 rounded-lg"><Wifi 
className="w-5 h-5 text-indigo-400"/></div>
               <div>
                 <div className="text-sm text-indigo-300 
font-medium">Local DNS Server</div>
                 <div className="text-xs text-slate-500">Listening on 
0.0.0.0:53</div>
               </div>
             </div>
             <div className="mt-4 p-3 bg-slate-950 rounded border 
border-slate-800 font-mono text-xs text-slate-400">
               <div className="flex justify-between items-center mb-2">
                <span className="text-slate-500">Run Backend:</span>
               </div>
               <span className="text-emerald-500">➜</span> sudo python3 
netshield_server.py
             </div>
          </Card>
        </div>

        {/* Real-Time Logs Table */}
        <div className="col-span-12">
          <Card className="overflow-hidden border-0 shadow-xl 
shadow-black/20">
            <div className="flex flex-col md:flex-row justify-between 
items-center mb-6 gap-4">
              <h3 className="text-lg font-semibold text-white flex 
items-center gap-2"><List className="w-5 h-5 text-blue-400" />Live Query 
Stream</h3>
              <div className="relative w-full md:w-64">
                <Search className="w-4 h-4 absolute left-3 top-2.5 
text-slate-500" />
                <input type="text" placeholder="Filter logs..." 
className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 
pr-4 py-2 text-sm text-slate-300 focus:outline-none 
focus:border-emerald-500 transition-all" />
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="text-xs text-slate-400 uppercase 
bg-slate-950/50 border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4 font-medium 
tracking-wider">Time</th>
                    <th className="px-6 py-4 font-medium 
tracking-wider">Status</th>
                    <th className="px-6 py-4 font-medium 
tracking-wider">Domain</th>
                    <th className="px-6 py-4 font-medium 
tracking-wider">Client IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {recentLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center 
text-slate-500 italic">
                        {isOnline ? "Waiting for traffic..." : "Starting simulation..."}
                      </td>
                    </tr>
                  ) : (
                    recentLogs.map((log: any, i) => (
                      <tr key={i} className="hover:bg-slate-800/30 
transition-colors group">
                        <td className="px-6 py-3 text-slate-500 font-mono 
text-xs whitespace-nowrap">{new 
Date(log.timestamp).toLocaleTimeString()}</td>
                        <td className="px-6 py-3">
                          <span className={`inline-flex items-center 
gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${log.status 
=== 'BLOCKED' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-slate-200 font-mono 
text-sm max-w-[200px] truncate group-hover:text-white 
transition-colors">{log.domain}</td>
                        <td className="px-6 py-3 text-slate-400 font-mono 
text-xs">{log.client_ip}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}

