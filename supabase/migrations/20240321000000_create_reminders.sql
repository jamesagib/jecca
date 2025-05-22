-- Drop existing objects if they exist
DROP TRIGGER IF EXISTS update_reminders_updated_at ON reminders;
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP TABLE IF EXISTS reminders;

-- Create reminders table
CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  time TEXT NOT NULL,
  date TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  notification_id TEXT,
  user_email TEXT,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- Users can only see their own reminders
CREATE POLICY "Users can view own reminders" 
  ON reminders FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can only insert their own reminders
CREATE POLICY "Users can insert own reminders" 
  ON reminders FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own reminders
CREATE POLICY "Users can update own reminders" 
  ON reminders FOR UPDATE 
  USING (auth.uid() = user_id);

-- Users can only delete their own reminders
CREATE POLICY "Users can delete own reminders" 
  ON reminders FOR DELETE 
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_reminders_updated_at
  BEFORE UPDATE ON reminders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_reminders_user_date 
  ON reminders(user_id, date);

CREATE INDEX IF NOT EXISTS idx_reminders_completed 
  ON reminders(user_id, completed);

CREATE INDEX IF NOT EXISTS idx_reminders_notification 
  ON reminders(notification_id) 
  WHERE notification_id IS NOT NULL; 