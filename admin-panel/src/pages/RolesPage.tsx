import { useEffect, useState } from 'react'
import { 
  ShieldCheck, Shield, UserPlus, 
  Trash2, Search, Zap 
} from 'lucide-react'
import { supabase } from '../lib/supabase'

const RolesPage = () => {
  const [admins, setAdmins] = useState<any[]>([])
  const [mods, setMods] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRoles()
  }, [])

  const fetchRoles = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .in('role', ['admin', 'moderator'])
      .order('role', { ascending: true })

    if (data) {
      setAdmins(data.filter(p => p.role === 'admin'))
      setMods(data.filter(p => p.role === 'moderator'))
    }
    setLoading(false)
  }

  const handleUpdateRole = async (userId: string, role: 'user' | 'moderator' | 'admin') => {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', userId)
    if (!error) fetchRoles()
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Roles & Moderators</h1>
          <p className="text-gray-400 text-sm mt-1">Manage administrative access and community leadership.</p>
        </div>
        <button className="bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all">
          <UserPlus size={18} /> Assign New Role
        </button>
      </div>

      <div className="space-y-8">
        {/* Admins Section */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <ShieldCheck size={20} className="text-purple-500" />
            <h2 className="font-black text-xs uppercase tracking-widest text-gray-400">Admins ({admins.length})</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading ? (
              <div className="h-24 bg-[#111111] border border-[#1f2937] rounded-2xl animate-pulse" />
            ) : admins.map((admin) => (
              <div key={admin.id} className="bg-[#111111] border border-purple-500/20 p-5 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-purple-600 flex items-center justify-center font-bold">
                    {admin.username?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-bold">{admin.username}</div>
                    <div className="text-xs text-purple-500 font-bold uppercase mt-0.5 tracking-wider">Full Access</div>
                  </div>
                </div>
                {/* Cannot remove last admin usually, or self. For now just show zap */}
                <Zap size={16} className="text-purple-500 fill-purple-500/20" />
              </div>
            ))}
          </div>
        </section>

        {/* Moderators Section */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <Shield size={20} className="text-amber-500" />
            <h2 className="font-black text-xs uppercase tracking-widest text-gray-400">Moderators ({mods.length})</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading ? (
              <div className="h-24 bg-[#111111] border border-[#1f2937] rounded-2xl animate-pulse" />
            ) : mods.length === 0 ? (
              <div className="p-10 border border-dashed border-[#1f2937] rounded-2xl text-center text-gray-600 text-sm">
                No moderators assigned yet.
              </div>
            ) : mods.map((mod) => (
              <div key={mod.id} className="bg-[#111111] border border-[#1f2937] p-5 rounded-2xl flex items-center justify-between group hover:border-amber-500/20 transition-all">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-amber-600 flex items-center justify-center font-bold">
                    {mod.username?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-bold">{mod.username}</div>
                    <div className="text-xs text-amber-500 font-bold uppercase mt-0.5 tracking-wider">{mod.campus_name || 'Community Mod'}</div>
                  </div>
                </div>
                <button 
                  onClick={() => handleUpdateRole(mod.id, 'user')}
                  className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Permissions Guide */}
      <div className="bg-purple-600/5 border border-purple-500/10 p-6 rounded-3xl">
        <h3 className="font-bold text-sm mb-4">Role Permissions Reference</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h4 className="text-[10px] font-black text-purple-500 uppercase tracking-widest mb-2">Administrators</h4>
            <ul className="text-xs text-gray-400 space-y-2">
              <li className="flex items-center gap-2">✓ Full database access</li>
              <li className="flex items-center gap-2">✓ User deletion & management</li>
              <li className="flex items-center gap-2">✓ Global platform analytics</li>
              <li className="flex items-center gap-2">✓ Roles assignment</li>
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-2">Moderators</h4>
            <ul className="text-xs text-gray-400 space-y-2">
              <li className="flex items-center gap-2">✓ Content deletion (Campus specific)</li>
              <li className="flex items-center gap-2">✓ Mute users in Chat</li>
              <li className="flex items-center gap-2">✓ Resolve reports in Hubs</li>
              <li className="flex items-center gap-2 text-red-500/50">✗ No user account deletion</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RolesPage
