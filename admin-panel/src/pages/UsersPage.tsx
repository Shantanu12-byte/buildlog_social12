import { useEffect, useState } from 'react'
import { 
  Search, Filter, MoreHorizontal, 
  Shield, UserMinus, AlertTriangle, Trash2, Eye 
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { supabase, supabaseAdmin } from '../lib/supabase'

const UsersPage = () => {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [menuOpen, setMenuOpen] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, campus_name, role, created_at, is_suspended')
      .order('created_at', { ascending: false })

    if (!error && data) setUsers(data)
    setLoading(false)
  }

  const handleMakeModerator = async (userId: string) => {
    const { error } = await supabase.rpc('admin_set_user_role', {
      target_user_id: userId,
      new_role: 'moderator'
    })
    if (!error) fetchUsers()
    setMenuOpen(null)
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you absolutely sure? This will delete all posts, messages, and the profile.')) return
    
    // Using supabaseAdmin (service role) to delete the actual Auth user
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
    
    if (!error) fetchUsers()
    setMenuOpen(null)
  }

  const filteredUsers = users.filter(u => 
    u.username?.toLowerCase().includes(search.toLowerCase()) || 
    u.campus_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-gray-400 text-sm mt-1">Manage 50+ members across all campuses.</p>
        </div>
        <button className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-sm font-bold hover:bg-white/10 transition-all">
          Export CSV
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-500 transition-colors" size={18} />
          <input 
            type="text"
            placeholder="Search by username or campus..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#111111] border border-[#1f2937] focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl py-3 pl-12 pr-4 outline-none transition-all placeholder:text-gray-600"
          />
        </div>
        <button className="bg-[#111111] border border-[#1f2937] p-3 rounded-xl text-gray-400 hover:text-white transition-all">
          <Filter size={20} />
        </button>
      </div>

      <div className="bg-[#111111] border border-[#1f2937] rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-black/20 border-b border-[#1f2937]">
              <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest">Username</th>
              <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest">Campus</th>
              <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest">Role</th>
              <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest">Joined</th>
              <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1f2937]">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={5} className="px-6 py-4 h-16 bg-white/5 opacity-20" />
                </tr>
              ))
            ) : filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-white/5 transition-all group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center font-bold text-xs">
                      {user.username?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-bold">{user.username}</div>
                      <div className="text-xs text-gray-500">#{user.id.slice(0, 8)}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-400">
                  {user.campus_name || 'No Campus'}
                </td>
                <td className="px-6 py-4">
                  <span className={`
                    text-[10px] font-black uppercase px-2 py-0.5 rounded-full border
                    ${user.role === 'admin' ? 'border-purple-500 text-purple-500 bg-purple-500/10' : 
                      user.role === 'moderator' ? 'border-amber-500 text-amber-500 bg-amber-500/10' : 
                      'border-gray-500 text-gray-500 bg-gray-500/10'}
                  `}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {formatDistanceToNow(new Date(user.created_at))} ago
                </td>
                <td className="px-6 py-4 text-right relative">
                  <button 
                    onClick={() => setMenuOpen(menuOpen === user.id ? null : user.id)}
                    className="p-2 hover:bg-white/10 rounded-lg text-gray-400 transition-all"
                  >
                    <MoreHorizontal size={20} />
                  </button>

                  {menuOpen === user.id && (
                    <div className="absolute right-6 top-14 w-48 bg-[#0a0a0a] border border-[#1f2937] rounded-xl shadow-2xl z-50 overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-100">
                      <button className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all text-left">
                        <Eye size={16} /> View Profile
                      </button>
                      <button 
                        onClick={() => handleMakeModerator(user.id)}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-400 hover:text-amber-500 hover:bg-amber-500/5 transition-all text-left"
                      >
                        <Shield size={16} /> Make Moderator
                      </button>
                      <button className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-400 hover:text-orange-500 hover:bg-orange-500/5 transition-all text-left">
                        <AlertTriangle size={16} /> Warn User
                      </button>
                      <button className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-400 hover:text-red-500 hover:bg-red-500/5 transition-all text-left">
                        <UserMinus size={16} /> Suspend User
                      </button>
                      <div className="h-px bg-[#1f2937] my-1" />
                      <button 
                        onClick={() => handleDeleteUser(user.id)}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/5 transition-all text-left"
                      >
                        <Trash2 size={16} /> Delete Account
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!loading && filteredUsers.length === 0 && (
          <div className="p-20 text-center text-gray-500">
            No users found matching your search.
          </div>
        )}
      </div>
    </div>
  )
}

export default UsersPage
