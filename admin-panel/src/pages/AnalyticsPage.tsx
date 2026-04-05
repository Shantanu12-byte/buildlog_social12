import { useEffect, useState } from 'react'
import { 
  BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line 
} from 'recharts'
import { supabase } from '../lib/supabase'
import { format, subDays, startOfDay } from 'date-fns'

const COLORS = ['#9333ea', '#7c3aed', '#6d28d9', '#5b21b6', '#4c1d95']

const AnalyticsPage = () => {
  const [range, setRange] = useState(7)
  const [dauData, setDauData] = useState<any[]>([])
  const [pageViews, setPageViews] = useState<any[]>([])
  const [featureUsage, setFeatureUsage] = useState<any[]>([])
  const [retention, setRetention] = useState({ d1: 0, d7: 0, d30: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAll()
  }, [range])

  const fetchAll = async () => {
    setLoading(true)
    const since = subDays(new Date(), range).toISOString()

    // 1. Fetch page_views for the selected period
    const { data: views } = await supabase
      .from('page_views')
      .select('user_id, page, viewed_at')
      .gte('viewed_at', since)

    // 2. DAU — unique users per day
    const dauMap: Record<string, Set<string>> = {}
    for (let i = range - 1; i >= 0; i--) {
      dauMap[format(subDays(new Date(), i), 'MMM dd')] = new Set()
    }
    views?.forEach(v => {
      const day = format(new Date(v.viewed_at), 'MMM dd')
      if (dauMap[day]) dauMap[day].add(v.user_id)
    })
    setDauData(Object.entries(dauMap).map(([date, users]) => ({ date, dau: users.size })))

    // 3. Page distribution
    const pageMap: Record<string, number> = {}
    views?.forEach(v => {
      const name = v.page.charAt(0).toUpperCase() + v.page.slice(1)
      pageMap[name] = (pageMap[name] || 0) + 1
    })
    setPageViews(Object.entries(pageMap).map(([name, value]) => ({ name, value })))

    // 4. Feature Usage — count from real tables
    const [{ count: postCount }, { count: challengeCount }, { count: reportCount }, { count: msgCount }] = await Promise.all([
      supabase.from('posts').select('*', { count: 'exact', head: true }).gte('created_at', since),
      supabase.from('user_problems').select('*', { count: 'exact', head: true }).gte('solved_at', since),
      supabase.from('reports').select('*', { count: 'exact', head: true }).gte('created_at', since),
      supabase.from('messages').select('*', { count: 'exact', head: true }).gte('created_at', since),
    ])
    setFeatureUsage([
      { name: 'Posts', count: postCount || 0 },
      { name: 'Chats', count: msgCount || 0 },
      { name: 'Challenges', count: challengeCount || 0 },
      { name: 'Reports', count: reportCount || 0 },
    ])

    // 5. Basic Retention — users who came back on Day 1, 7, 30
    if (views && views.length > 0) {
      const allUserIds = [...new Set(views.map(v => v.user_id))]
      const total = allUserIds.length || 1

      const d1Since = subDays(new Date(), 1).toISOString()
      const d7Since = subDays(new Date(), 7).toISOString()
      const d30Since = subDays(new Date(), 30).toISOString()

      const [{ data: d1 }, { data: d7 }, { data: d30 }] = await Promise.all([
        supabase.from('page_views').select('user_id').gte('viewed_at', d1Since),
        supabase.from('page_views').select('user_id').gte('viewed_at', d7Since),
        supabase.from('page_views').select('user_id').gte('viewed_at', d30Since),
      ])

      setRetention({
        d1: Math.round((new Set(d1?.map(v => v.user_id)).size / total) * 100),
        d7: Math.round((new Set(d7?.map(v => v.user_id)).size / total) * 100),
        d30: Math.round((new Set(d30?.map(v => v.user_id)).size / total) * 100),
      })
    }

    setLoading(false)
  }

  const cohorts = [
    { label: 'Day 1', value: retention.d1 },
    { label: 'Day 7', value: retention.d7 },
    { label: 'Day 30', value: retention.d30 },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-gray-400 text-sm mt-1">Deep dive into user engagement and feature adoption.</p>
        </div>
        <div className="flex bg-[#111111] border border-[#1f2937] p-1 rounded-xl">
          {[7, 30, 90].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${range === r ? 'bg-purple-600 text-white' : 'text-gray-500 hover:text-white'}`}
            >
              {r} days
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* DAU Chart */}
        <div className="bg-[#111111] border border-[#1f2937] p-8 rounded-3xl relative">
          {loading && <div className="absolute inset-0 bg-[#111111] animate-pulse rounded-3xl z-10" />}
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-xs uppercase tracking-widest text-gray-400">Daily Active Users</h3>
            <div className="text-[10px] font-black uppercase tracking-widest text-purple-500 bg-purple-500/10 px-3 py-1 rounded-full">Live</div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dauData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2937" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#4b5563', fontSize: 11 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#4b5563', fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#111111', border: '1px solid #1f2937', borderRadius: '12px' }} />
                <Line type="monotone" dataKey="dau" stroke="#9333ea" strokeWidth={3} dot={{ r: 4, fill: '#9333ea', strokeWidth: 2, stroke: '#111111' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Page Distribution */}
        <div className="bg-[#111111] border border-[#1f2937] p-8 rounded-3xl relative">
          {loading && <div className="absolute inset-0 bg-[#111111] animate-pulse rounded-3xl z-10" />}
          <h3 className="font-black text-xs uppercase tracking-widest text-gray-400 mb-8">Page Distribution</h3>
          {pageViews.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-600 text-xs italic">No page view data yet</div>
          ) : (
            <div className="h-64 w-full flex items-center">
              <ResponsiveContainer width="60%" height="100%">
                <PieChart>
                  <Pie data={pageViews} innerRadius={55} outerRadius={80} paddingAngle={5} dataKey="value">
                    {pageViews.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#111111', border: '1px solid #1f2937', borderRadius: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3 flex-1">
                {pageViews.map((item, index) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-xs text-gray-400 font-bold flex-1">{item.name}</span>
                    <span className="text-xs text-gray-600">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Feature Usage */}
        <div className="bg-[#111111] border border-[#1f2937] p-8 rounded-3xl relative">
          {loading && <div className="absolute inset-0 bg-[#111111] animate-pulse rounded-3xl z-10" />}
          <h3 className="font-black text-xs uppercase tracking-widest text-gray-400 mb-8">Feature Usage (Period)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={featureUsage}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2937" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#4b5563', fontSize: 11 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#4b5563', fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#111111', border: '1px solid #1f2937', borderRadius: '12px' }} />
                <Bar dataKey="count" fill="#9333ea" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Retention */}
        <div className="bg-[#111111] border border-[#1f2937] p-8 rounded-3xl relative">
          {loading && <div className="absolute inset-0 bg-[#111111] animate-pulse rounded-3xl z-10" />}
          <h3 className="font-black text-xs uppercase tracking-widest text-gray-400 mb-8">Retention (Active Users %)</h3>
          <div className="space-y-6">
            {cohorts.map((cohort) => (
              <div key={cohort.label} className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-gray-400">{cohort.label} Retention</span>
                  <span className="text-purple-500">{cohort.value}%</span>
                </div>
                <div className="h-2 bg-[#0a0a0a] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-600 rounded-full transition-all duration-700"
                    style={{ width: `${cohort.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-600 mt-6">Based on users who opened the app within each window.</p>
        </div>
      </div>
    </div>
  )
}

export default AnalyticsPage
