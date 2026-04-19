-- Add unique constraint on endpoint so upsert(onConflict:'endpoint') works correctly.
-- Without this, PostgreSQL throws "no unique constraint matching ON CONFLICT specification"
-- and subscriptions silently never get saved to the database.
ALTER TABLE public.push_subscriptions
  ADD CONSTRAINT push_subscriptions_endpoint_key UNIQUE (endpoint);
