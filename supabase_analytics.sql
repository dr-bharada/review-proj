-- Analytics Events Table
CREATE TABLE analytics_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (since public users click the links)
CREATE POLICY "Allow anonymous inserts"
ON analytics_events
FOR INSERT
TO public
WITH CHECK (true);

-- Allow business owners to read their own analytics
CREATE POLICY "Allow owners to read analytics"
ON analytics_events
FOR SELECT
TO authenticated
USING (
  business_id IN (
    SELECT id FROM businesses WHERE user_id = auth.uid()
  )
);
