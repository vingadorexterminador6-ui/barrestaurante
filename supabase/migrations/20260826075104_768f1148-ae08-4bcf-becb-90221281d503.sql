-- ROLES
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "own roles readable" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admins read all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- UPDATED_AT helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  email text,
  full_name text,
  onboarding_step integer NOT NULL DEFAULT 0,
  onboarding_done boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "admins read profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- LICENSE CODES
CREATE TABLE public.license_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  plan text NOT NULL DEFAULT 'basico',
  status text NOT NULL DEFAULT 'disponivel',
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  activated_at timestamptz,
  expires_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT license_status_check CHECK (status IN ('disponivel','ativo','suspenso','expirado'))
);
GRANT SELECT ON public.license_codes TO authenticated;
GRANT ALL ON public.license_codes TO service_role;
ALTER TABLE public.license_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own license select" ON public.license_codes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admins manage licenses" ON public.license_codes FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER license_codes_updated_at BEFORE UPDATE ON public.license_codes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- WHATSAPP CONNECTIONS
CREATE TABLE public.wa_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  account_type text NOT NULL,
  status text NOT NULL DEFAULT 'desconectado',
  masked_identifier text,
  display_name text,
  is_demo boolean NOT NULL DEFAULT true,
  connected_at timestamptz,
  last_sync_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT wa_account_type_check CHECK (account_type IN ('messenger','business')),
  CONSTRAINT wa_status_check CHECK (status IN ('conectado','desconectado','a_sincronizar')),
  UNIQUE (user_id, account_type)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wa_connections TO authenticated;
GRANT ALL ON public.wa_connections TO service_role;
ALTER TABLE public.wa_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own connections" ON public.wa_connections FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admins read connections" ON public.wa_connections FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER wa_connections_updated_at BEFORE UPDATE ON public.wa_connections FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- PROTECTION SETTINGS
CREATE TABLE public.protection_settings (
  user_id uuid PRIMARY KEY,
  protection_active boolean NOT NULL DEFAULT false,
  automations_paused boolean NOT NULL DEFAULT false,
  campaigns_paused boolean NOT NULL DEFAULT false,
  monitor_activity boolean NOT NULL DEFAULT true,
  anomaly_alerts boolean NOT NULL DEFAULT true,
  risk_notifications boolean NOT NULL DEFAULT true,
  daily_message_limit integer NOT NULL DEFAULT 200,
  hourly_message_limit integer NOT NULL DEFAULT 30,
  new_contacts_limit integer NOT NULL DEFAULT 50,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.protection_settings TO authenticated;
GRANT ALL ON public.protection_settings TO service_role;
ALTER TABLE public.protection_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own protection" ON public.protection_settings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admins read protection" ON public.protection_settings FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER protection_settings_updated_at BEFORE UPDATE ON public.protection_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RISK SNAPSHOTS
CREATE TABLE public.risk_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  score integer NOT NULL DEFAULT 0,
  level text NOT NULL DEFAULT 'baixo',
  message_volume integer NOT NULL DEFAULT 0,
  response_rate numeric NOT NULL DEFAULT 0,
  reports_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT risk_level_check CHECK (level IN ('baixo','atencao','alto')),
  CONSTRAINT risk_score_check CHECK (score BETWEEN 0 AND 100)
);
GRANT SELECT, INSERT ON public.risk_snapshots TO authenticated;
GRANT ALL ON public.risk_snapshots TO service_role;
ALTER TABLE public.risk_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own risk" ON public.risk_snapshots FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own risk insert" ON public.risk_snapshots FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admins read risk" ON public.risk_snapshots FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ALERTS
CREATE TABLE public.alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  level text NOT NULL DEFAULT 'baixo',
  title text NOT NULL,
  description text NOT NULL,
  recommendation text NOT NULL,
  status text NOT NULL DEFAULT 'novo',
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  CONSTRAINT alert_level_check CHECK (level IN ('baixo','atencao','alto')),
  CONSTRAINT alert_status_check CHECK (status IN ('novo','resolvido'))
);
GRANT SELECT, INSERT, UPDATE ON public.alerts TO authenticated;
GRANT ALL ON public.alerts TO service_role;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own alerts" ON public.alerts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admins read alerts" ON public.alerts FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ACTIVITY LOG
CREATE TABLE public.activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  activity text NOT NULL,
  status text NOT NULL DEFAULT 'ok',
  risk_score integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.activity_log TO authenticated;
GRANT ALL ON public.activity_log TO service_role;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own activity" ON public.activity_log FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own activity insert" ON public.activity_log FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admins read activity" ON public.activity_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_activity_user_date ON public.activity_log (user_id, created_at DESC);
CREATE INDEX idx_alerts_user_date ON public.alerts (user_id, created_at DESC);
CREATE INDEX idx_risk_user_date ON public.risk_snapshots (user_id, created_at DESC);

-- DEMO LICENSE CODES
INSERT INTO public.license_codes (code, plan, status, expires_at) VALUES
('WAGD-2026-0001','basico','disponivel', now() + interval '365 days'),
('WAGD-2026-0002','basico','disponivel', now() + interval '365 days'),
('WAGD-2026-0003','pro','disponivel', now() + interval '365 days'),
('WAGD-2026-0004','pro','disponivel', now() + interval '365 days'),
('WAGD-2026-0005','pro','disponivel', now() + interval '180 days'),
('WAGD-2026-0006','empresa','disponivel', now() + interval '365 days'),
('WAGD-2026-0007','empresa','disponivel', now() + interval '365 days'),
('WAGD-2026-0008','basico','suspenso', now() + interval '90 days'),
('WAGD-2026-0009','pro','disponivel', now() + interval '30 days'),
('WAGD-2026-0010','empresa','disponivel', now() + interval '730 days');