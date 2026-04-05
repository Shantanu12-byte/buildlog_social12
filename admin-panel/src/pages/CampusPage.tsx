import { useEffect, useState } from 'react'
import { 
  Plus, Users, Shield, 
  MapPin, MoreVertical, Search 
} from 'lucide-react'
import { supabase } from '../lib/supabase'

const CampusPage = () => {
  const [campuses, setCampuses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCampuses()
  }, [])

  const fetchCampuses = async () => {
    setLoading(true)
    // Dynamic campus list from profiles table
    const { data: profiles } = await supabase
      .from('profiles')
      .select('campus_name, role, username')
    
    if (profiles) {
      const campusMap: Record<string, any> = {}
      profiles.forEach(p => {
        if (!p.campus_name) return
        if (!campusMap[p.campus_name]) {
          campusMap[p.campus_name] = { name: p.campus_name, members: 0, moderators: [] }
        }
        campusMap[p.campus_name].members++
        if (p.role === 'moderator') {
          campusMap[p.campus_name].moderators.push(`@${p.username}`)
        }
      })
      setCampuses(Object.values(campusMap))
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Campus Management</h1>
          <p className="text-gray-400 text-sm mt-1">Monitor and assign moderators to institutional hubs.</p>
        </div>
        <button className="bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all">
          <Plus size={18} /> Add Campus
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-[#111111] border border-[#1f2937] rounded-3xl animate-pulse" />
          ))
        ) : campuses.map((campus) => (
          <div key={campus.name} className="bg-[#111111] border border-[#1f2937] p-6 rounded-3xl hover:border-purple-500/30 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-purple-600/10 rounded-2xl text-purple-500">
                <MapPin size={24} />
              </div>
              <button className="p-2 hover:bg-white/5 rounded-lg text-gray-500">
                <MoreVertical size={20} />
              </button>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-bold">{campus.name}</h3>
              <div className="flex items-center gap-2 text-xs font-black text-gray-500 mt-1 uppercase tracking-widest">
                <Users size={12} /> {campus.members} Members
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Moderators</div>
              <div className="flex flex-wrap gap-2">
                {campus.moderators.length > 0 ? campus.moderators.map((mod: string) => (
                  <div key={mod} className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-bold text-gray-300">
                    <Shield size={12} className="text-amber-500" /> {mod}
                  </div>
                )) : (
                  <div className="text-xs text-gray-600 italic">None assigned</div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-[#1f2937]">
              <button className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-black uppercase tracking-widest transition-all">
                Rooms
              </button>
              <button className="flex-1 py-2.5 bg-purple-600/10 hover:bg-purple-600/20 text-purple-500 rounded-xl text-xs font-black uppercase tracking-widest transition-all">
                Assign Mod
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CampusPage
