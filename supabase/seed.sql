-- Seed data for LOCAL TESTING ONLY. Never run against production.
-- Reference data (roles/permissions) is created by the migration itself.
-- Test users must be created through Supabase Auth (Studio or the register page);
-- promote the first administrator manually from the SQL editor:
--   update public.profiles set role = 'administrator', verification_status = 'verified'
--   where id = '<auth user uuid>';
select 1;
