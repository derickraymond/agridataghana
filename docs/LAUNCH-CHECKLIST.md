# Launch checklist

## Before launch
- [ ] Delete all test accounts and sample data (see SQL below)
- [ ] Rotate the administrator password (it was shared in chat)
- [ ] Supabase Auth: Site URL and redirect URLs set; custom SMTP configured (built-in email is rate limited)
- [ ] Enable leaked-password protection and email confirmation in Supabase Auth
- [ ] Payment gateway decision (payments are recorded only; no real gateway yet)
- [ ] Backups enabled
- [ ] No secrets in the repo (`git log -p | grep -i service_role`)

## Test on the deployed Netlify URL
- [ ] Register, confirm email, log in/out, password reset
- [ ] Admin approves an account; pending users cannot reach role dashboards
- [ ] Farmer: farm → cycle → harvest → batch → QR → public verify
- [ ] Marketplace: listing → moderation → enquiry → order → payment record
- [ ] Prices and advisories publish; weather page loads
- [ ] Organisation create/verify; public directory lists verified only
- [ ] Analyst dashboard; admin CSV export + audit entry
- [ ] Response headers present (`curl -I`), HTTPS enforced, `/dashboard` not cached

## Remove test data (run in Supabase SQL editor)
```sql
delete from auth.users where email in (
  'agri.test.444830859@gmail.com','agri.buyer.test.7731@gmail.com',
  'agri.dealer.test.5512@gmail.com','agri.agent.test.9021@gmail.com',
  'agri.analyst.test.3310@gmail.com');
```
Review remaining rows (prices, contact messages, organisations, listings) in the admin portal and delete test entries manually.
