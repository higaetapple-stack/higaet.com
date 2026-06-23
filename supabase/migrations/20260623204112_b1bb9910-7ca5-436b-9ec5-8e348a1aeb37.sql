
ALTER TYPE public.payment_provider ADD VALUE IF NOT EXISTS 'manual';
ALTER TYPE public.payment_status ADD VALUE IF NOT EXISTS 'pending_verification';
ALTER TYPE public.payment_status ADD VALUE IF NOT EXISTS 'approved';
ALTER TYPE public.payment_status ADD VALUE IF NOT EXISTS 'rejected';
ALTER TYPE public.payment_status ADD VALUE IF NOT EXISTS 'info_requested';
