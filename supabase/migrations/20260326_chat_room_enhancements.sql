-- STEP 1 — DATABASE CHANGES (Supabase):

-- Create new table room_members
CREATE TABLE IF NOT EXISTS room_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id uuid REFERENCES chat_rooms(id) 
    ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) 
    ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- RLS Policies:
ALTER TABLE room_members ENABLE ROW LEVEL SECURITY;

-- Anyone can view members of a room
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'room_members' AND policyname = 'view members'
    ) THEN
        CREATE POLICY "view members" ON room_members
          FOR SELECT USING (true);
    END IF;
END $$;

-- Only authenticated users can join
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'room_members' AND policyname = 'join room'
    ) THEN
        CREATE POLICY "join room" ON room_members
          FOR INSERT WITH CHECK (
            auth.uid() = user_id
          );
    END IF;
END $$;

-- Only member can leave
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'room_members' AND policyname = 'leave room'
    ) THEN
        CREATE POLICY "leave room" ON room_members
          FOR DELETE USING (
            auth.uid() = user_id
          );
    END IF;
END $$;

-- Add column to chat_rooms
ALTER TABLE chat_rooms 
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS created_by uuid 
    REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS rules text,
  ADD COLUMN IF NOT EXISTS tags text[];

-- Add last_seen to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS last_seen timestamptz DEFAULT now();
  
-- TRIGGER: Update member_count in chat_rooms
CREATE OR REPLACE FUNCTION update_room_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE chat_rooms 
    SET member_count = member_count + 1 
    WHERE id = NEW.room_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE chat_rooms 
    SET member_count = GREATEST(0, member_count - 1) 
    WHERE id = OLD.room_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_update_room_member_count ON room_members;
CREATE TRIGGER tr_update_room_member_count
AFTER INSERT OR DELETE ON room_members
FOR EACH ROW EXECUTE FUNCTION update_room_member_count();
