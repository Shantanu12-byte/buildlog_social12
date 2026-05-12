import { useEffect, useState } from 'react'
import { 
  Users, FileText, Zap, TrendingUp, TrendingDown 
} from 'lucide-react'
import { 
  XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts'
import { supabase } from '../lib/supabase'
import { format, subDays, startOfDay, isAfter } from 'date-fns'

const DashboardPage = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeToday: 0,
    totalPosts: 0,
    newToday: 0
  })
  const [growthData, setGrowthData] = useState<any[]>([])
  const [topCampuses, setTopCampuses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      
      // 1. Core Stats
      const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
      const { count: postCount } = await supabase.from('posts').select('*', { count: 'exact', head: true })
      
      const today = startOfDay(new Date()).toISOString()
      const { count: newTodayCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today)

      // 2. Active Today (Unique Users in Page Views)
      const { data: activeViews } = await supabase
        .from('page_views')
        .select('user_id')
        .gte('viewed_at', today)
      
      const uniqueActive = new Set(activeViews?.map(v => v.user_id)).size

      setStats({
        totalUsers: userCount || 0,
        activeToday: uniqueActive || 0,
        totalPosts: postCount || 0,
        newToday: newTodayCount || 0
      })

      // 3. User Growth (Last 7 Days)
      const last7Days = subDays(new Date(), 7).toISOString()
      const { data: recentProfiles } = await supabase
        .from('profiles')
        .select('created_at')
        .gte('created_at', last7Days)
        .order('created_at', { ascending: true })

      const growthMap: Record<string, number> = {}
      // Initialize last 7 days
      for (let i = 6; i >= 0; i--) {
        growthMap[format(subDays(new Date(), i), 'MMM dd')] = 0
      }
      
      recentProfiles?.forEach(p => {
        const date = format(new Date(p.created_at), 'MMM dd')
        if (growthMap[date] !== undefined) growthMap[date]++
      })

      setGrowthData(Object.entries(growthMap).map(([name, users]) => ({ name, users })))

      // 4. Top Campuses — using 'campus_name' (the correct column)
      const { data: allProfiles } = await supabase
        .from('profiles')
        .select('campus_name')
      
      const campusCounts = allProfiles?.reduce((acc: any, curr) => {
        const name = curr.campus_name || 'No Campus'
        acc[name] = (acc[name] || 0) + 1
        return acc
      }, {})

      const sortedCampuses = Object.entries(campusCounts || {})
        .map(([name, users]) => ({ name, users: users as number }))
        .sort((a: any, b: any) => b.users - a.users)
        .slice(0, 5)
        .map((c, i) => ({ ...c, color: ['#9333ea', '#22c55e', '#3b82f6', '#f59e0b', '#ef4444'][i] }))

      setTopCampuses(sortedCampuses)
      setLoading(false)
    }

    fetchData()
  }, [])

  const cards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, trend: `${((stats.newToday / (stats.totalUsers || 1)) * 100).toFixed(1)}%`, up: true },
    { label: 'Active Today', value: stats.activeToday, icon: Zap, trend: 'Live', up: true },
    { label: 'Total Posts', value: stats.totalPosts, icon: FileText, trend: 'Total', up: true },
    { label: 'New Today', value: stats.newToday, icon: TrendingUp, trend: 'Today', up: true },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold">Good morning, Admin 👋</h1>
        <p className="text-gray-400 mt-1 text-sm">Here&apos;s what&apos;s happening on Buildlog today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <div key={card.label} className="bg-[#111111] border border-[#1f2937] p-6 rounded-2xl relative overflow-hidden group hover:border-purple-500/20 transition-all">
            {loading && <div className="absolute inset-0 bg-[#111111] animate-pulse z-10" />}
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-600/10 rounded-lg text-purple-500">
                <card.icon size={20} />
              </div>
              <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${card.up ? 'text-green-500' : 'text-red-500'}`}>
                {card.trend}
              </div>
            </div>
            <div className="text-3xl font-bold tracking-tight">{card.value}</div>
            <div className="text-xs font-black text-gray-500 mt-1 uppercase tracking-widest">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User Growth Chart */}
        <div className="lg:col-span-2 bg-[#111111] border border-[#1f2937] p-8 rounded-3xl relative">
          {loading && <div className="absolute inset-8 bg-[#111111] animate-pulse z-10" />}
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-gray-300">User Growth (Last 7 Days)</h3>
            <div className="text-[10px] font-black uppercase tracking-widest text-purple-500 bg-purple-500/10 px-3 py-1 rounded-full">LIVE DATA</div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9333ea" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#9333ea" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2937" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#4b5563', fontSize: 11 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#4b5563', fontSize: 11 }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111111', border: '1px solid #1f2937', borderRadius: '12px' }}
                  itemStyle={{ color: '#9333ea' }}
                />
                <Area type="monotone" dataKey="users" stroke="#9333ea" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Campuses */}
        <div className="bg-[#111111] border border-[#1f2937] p-8 rounded-3xl relative">
          {loading && <div className="absolute inset-8 bg-[#111111] animate-pulse z-10" />}
          <h3 className="font-bold text-gray-300 mb-6">Top Campuses</h3>
          <div className="space-y-6">
            {topCampuses.length === 0 ? (
              <div className="py-20 text-center text-gray-600 text-xs italic">No data available</div>
            ) : topCampuses.map((campus, i) => (
              <div key={campus.name} className="flex items-center gap-4">
                <div className="text-xs font-black text-gray-500 w-4">{i + 1}</div>
                <div className="flex-1">
                  <div className="flex justify-between text-sm font-bold mb-1.5">
                    <span className="truncate w-32">{campus.name}</span>
                    <span className="text-gray-400">{campus.users}</span>
                  </div>
                  <div className="h-1.5 bg-[#0a0a0a] rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full" 
                      style={{ width: `${(campus.users / topCampuses[0].users) * 100}%`, backgroundColor: campus.color }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-10 py-3 border border-[#1f2937] hover:bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-gray-400">
            VIEW ALL CAMPUSES →
          </button>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
