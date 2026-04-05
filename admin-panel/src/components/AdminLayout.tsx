import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, Users, FileText, Map, 
  AlertCircle, ShieldCheck, BarChart3, LogOut 
} from 'lucide-react'
import { supabase } from '../lib/supabase'

const AdminLayout = () => {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Users', path: '/users', icon: Users },
    { name: 'Posts', path: '/posts', icon: FileText },
    { name: 'Campus', path: '/campus', icon: Map },
    { name: 'Reports', path: '/reports', icon: AlertCircle },
    { name: 'Roles', path: '/roles', icon: ShieldCheck },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  ]

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-[#111111] border-r border-[#1f2937] flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-black tracking-tighter flex items-center gap-2">
            <span className="bg-purple-600 p-1 rounded">🔥</span> BUILDLOG ADMIN
          </h1>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                ${isActive 
                  ? 'bg-purple-600/10 text-purple-500 font-bold border border-purple-500/20' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'}
              `}
            >
              <item.icon size={20} />
              <span className="text-sm">{item.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-[#1f2937]">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-gray-400 hover:text-red-400 hover:bg-red-400/5 rounded-xl transition-all"
          >
            <LogOut size={20} />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-[#111111] border-b border-[#1f2937] flex items-center justify-between px-8">
          <h2 className="text-sm font-semibold text-gray-400">Admin Overview</h2>
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center font-bold text-xs">
              A
            </div>
            <span className="text-sm font-medium">Administrator</span>
          </div>
        </header>

        {/* Content */}
        <section className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <Outlet />
        </section>
      </main>
    </div>
  )
}

export default AdminLayout
