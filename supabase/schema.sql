-- ============================================================
-- SRT Generator — Supabase スキーマ
-- Supabase ダッシュボード → SQL Editor に貼り付けて実行
-- ============================================================

-- プロフィールテーブル（auth.users と 1:1 対応）
CREATE TABLE IF NOT EXISTS profiles (
  id                     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                  TEXT,
  plan                   TEXT NOT NULL DEFAULT 'free',       -- 'free' | 'pro'
  stripe_customer_id     TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  minutes_used           FLOAT NOT NULL DEFAULT 0,
  minutes_limit          FLOAT DEFAULT 5,                    -- NULL = 無制限（Pro）
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 変換履歴テーブル
CREATE TABLE IF NOT EXISTS transcriptions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  filename       TEXT,
  duration       FLOAT,   -- 秒
  segments_count INT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- updated_at を自動更新するトリガー
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 毎月1日に無料プランの minutes_used をリセット（pg_cron が必要）
-- SELECT cron.schedule('reset-monthly-usage', '0 0 1 * *',
--   $$UPDATE profiles SET minutes_used = 0 WHERE plan = 'free'$$);

-- Row Level Security
ALTER TABLE profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcriptions ENABLE ROW LEVEL SECURITY;

-- 自分のプロフィールのみ読み書き可
CREATE POLICY "profiles: own read"  ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles: own write" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 自分の変換履歴のみ読み取り可
CREATE POLICY "transcriptions: own read" ON transcriptions FOR SELECT USING (auth.uid() = user_id);

-- サービスロールはすべて操作可（webhook用）
CREATE POLICY "profiles: service role" ON profiles FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "transcriptions: service role" ON transcriptions FOR ALL USING (auth.role() = 'service_role');
