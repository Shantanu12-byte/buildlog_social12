-- Create push_subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  subscription JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, subscription) -- Avoid duplicate subscriptions for the same user/device
);

-- Enable RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can manage their own subscriptions" ON push_subscriptions;
CREATE POLICY "Users can manage their own subscriptions" 
ON push_subscriptions FOR ALL 
USING (auth.uid() = user_id);

-- Explicitly allow service role for backend access (though typically RLS is bypassed by service role)
-- CREATE POLICY "Service role can manage all subscriptions" ON push_subscriptions FOR ALL USING (true);
