import { useEffect, useState } from 'react'
import { 
  AlertTriangle, Trash2, Eye, 
  MessageSquare, Heart, ShieldAlert 
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { supabase } from '../lib/supabase'

const PostsPage = () => {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'reported' | 'spam'>('all')

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('posts_with_profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) setPosts(data)
    setLoading(false)
  }

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Delete this post? This cannot be undone.')) return
    const { error } = await supabase.from('posts').delete().eq('id', postId)
    if (!error) fetchPosts()
  }

  const isSpam = (post: any) => {
    const spamKeywords = ['promo', 'discount', 'free', 'buy', 'glosscut', 'http', 'https']
    const content = (post.content || post.caption || '').toLowerCase()
    return spamKeywords.some(kw => content.includes(kw))
  }

  const filteredPosts = posts.filter(p => {
    if (filter === 'spam') return isSpam(p)
    return true
  })

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Posts Moderation</h1>
          <p className="text-gray-400 text-sm mt-1">Review and manage content across the platform.</p>
        </div>
        <div className="flex bg-[#111111] border border-[#1f2937] p-1 rounded-xl">
          {['all', 'reported', 'spam'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`
                px-4 py-1.5 rounded-lg text-xs font-bold transition-all uppercase tracking-widest
                ${filter === f ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-gray-500 hover:text-white'}
              `}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-[#111111] border border-[#1f2937] rounded-2xl animate-pulse" />
          ))
        ) : filteredPosts.map((post) => {
          const spam = isSpam(post)
          return (
            <div key={post.id} className={`bg-[#111111] border rounded-2xl p-6 transition-all ${spam ? 'border-red-500/30' : 'border-[#1f2937] hover:border-gray-700'}`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-purple-600 flex items-center justify-center font-bold text-sm">
                    {post.username?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-200">@{post.username}</span>
                      <span className="text-xs text-gray-500">• {formatDistanceToNow(new Date(post.created_at))} ago</span>
                    </div>
                    <div className="text-xs text-purple-500 font-bold uppercase tracking-wider mt-0.5">{post.college || 'Community'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {spam && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full text-[10px] font-black uppercase tracking-widest">
                      <ShieldAlert size={12} /> Auto-Spam
                    </div>
                  )}
                  <button className="p-2 hover:bg-white/5 rounded-lg text-gray-400 group relative">
                    <Eye size={18} />
                  </button>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                {post.title && <h3 className="font-bold text-lg">{post.title}</h3>}
                <p className="text-gray-400 text-sm leading-relaxed">
                  {post.content || post.caption || 'No content provided.'}
                </p>
                {post.imageUrl && (
                  <div className="h-48 mt-4 rounded-xl overflow-hidden bg-black/40 border border-[#1f2937] flex items-center justify-center text-gray-600 text-xs italic">
                    [Post Image: {post.imageUrl}]
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-[#1f2937]">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Heart size={16} />
                    <span className="text-xs font-bold">{post.cheers || 0}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <MessageSquare size={16} />
                    <span className="text-xs font-bold">{post.comments || 0}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl text-xs font-bold transition-all">
                    <AlertTriangle size={14} /> Warn User
                  </button>
                  <button 
                    onClick={() => handleDeletePost(post.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-xs font-bold transition-all"
                  >
                    <Trash2 size={14} /> Delete Post
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default PostsPage
