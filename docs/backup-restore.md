# Backups and restore

`.github/workflows/backup.yml` runs nightly. It dumps the `public` and `auth` schemas, encrypts the dump with `BACKUP_PASSPHRASE` and keeps it as a GitHub Actions artifact for 30 days. The Terms state this 30-day period, so change them together.

## Setup

Add these under GitHub → Settings → Secrets and variables → Actions:

- `SUPABASE_DB_URL`: the **Session pooler** connection string from Supabase → Connect, including the database password. GitHub runners can't reach the direct connection over IPv4.
- `BACKUP_PASSPHRASE`: a long random string. Keep a copy outside GitHub. Generate one with `openssl rand -base64 32`.

Run it once from Actions → Nightly backup → Run workflow.

## Keys that must not be lost

- `VAULT_MASTER_KEY`: without it, saved money data can't be decrypted, even from a good backup.
- `BACKUP_PASSPHRASE`: without it, a backup can't be opened.

Keep both in a password manager, separate from each other and from the backups.

## Restore drill

Run this monthly against a new, empty Supabase project, never production.

```bash
gpg --decrypt finlio-YYYY-MM-DD.sql.gz.gpg | gunzip > restore.sql
psql "$TEST_PROJECT_DB_URL" -f restore.sql
```

Point a local copy of the app at the test project with the same `VAULT_MASTER_KEY`, sign in to a restored account and confirm its data shows. Delete `restore.sql` and the test project afterwards.
