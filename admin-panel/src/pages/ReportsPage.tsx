import { useEffect, useState } from 'react'
import { 
  AlertCircle, CheckCircle, XCircle, 
  Trash2, Ban, ShieldAlert 
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { supabase } from '../lib/supabase'

const ReportsPage = () => {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReports()
    
    // Real-time subscription for new reports
    const channel = supabase
      .channel('admin-reports')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reports' }, () => {
        fetchReports()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchReports = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('reports')
      .select('*, reporter:profiles!reporter_id(username)')
      .order('created_at', { ascending: false })

    if (!error && data) setReports(data)
    setLoading(false)
  }

  const handleResolve = async (id: string, status: 'resolved' | 'ignored') => {
    const { error } = await supabase.from('reports').update({ status }).eq('id', id)
    if (!error) fetchReports()
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            Reports Queue {reports.filter(r => r.status === 'pending').length > 0 && <span className="h-2 w-2 bg-red-500 rounded-full animate-ping" />}
          </h1>
          <p className="text-gray-400 text-sm mt-1">Review user-submitted flags and take corrective action.</p>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          [...Array(2)].map((_, i) => (
            <div key={i} className="h-32 bg-[#111111] border border-[#1f2937] rounded-2xl animate-pulse" />
          ))
        ) : reports.length === 0 ? (
          <div className="py-20 text-center text-gray-600">
            <CheckCircle size={48} className="mx-auto mb-4 opacity-10" />
            <p>All reports are cleared. Good job!</p>
          </div>
        ) : reports.map((report) => (
          <div key={report.id} className={`bg-[#111111] border rounded-2xl p-6 transition-all ${report.status === 'pending' ? 'border-red-500/20 shadow-lg shadow-red-500/5' : 'border-[#1f2937] opacity-60'}`}>
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl border ${report.reason.toLowerCase().includes('spam') ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-orange-500/10 text-orange-500 border-orange-500/20'}`}>
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-xs uppercase tracking-widest text-gray-200">{report.reason}</span>
                    <span className="text-xs text-gray-500">• {formatDistanceToNow(new Date(report.created_at))} ago</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Reported by <span className="text-purple-500 font-bold">@{report.reporter?.username || 'System'}</span></div>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${report.status === 'pending' ? 'bg-red-500/10 text-red-500' : 'bg-gray-500/10 text-gray-500'}`}>
                {report.status}
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-[#1f2937]">
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 px-4 py-2 hover:bg-white/5 border border-[#1f2937] rounded-xl text-xs font-bold transition-all text-gray-400">
                  <Trash2 size={14} /> Delete
                </button>
                <button className="flex items-center gap-2 px-4 py-2 hover:bg-white/5 border border-[#1f2937] rounded-xl text-xs font-bold transition-all text-gray-400">
                  <Ban size={14} /> Suspend
                </button>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => handleResolve(report.id, 'ignored')}
                  className="px-4 py-2 text-gray-500 hover:text-white text-xs font-bold transition-all"
                >
                  Ignore ✓
                </button>
                <button 
                  onClick={() => handleResolve(report.id, 'resolved')}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-xs font-bold transition-all"
                >
                  Resolve
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ReportsPage
