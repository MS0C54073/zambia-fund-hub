-- Seed demo users with confirmed emails. Idempotent.
DO $$
DECLARE
  rec RECORD;
  uid UUID;
BEGIN
  FOR rec IN
    SELECT * FROM (VALUES
      ('superadmin@zamfund.test', 'SuperAdmin#2026', 'Super Admin',     'investor', 'super_admin'),
      ('admin@zamfund.test',      'Admin#2026',      'Platform Admin',  'investor', 'admin'),
      ('founder@zamfund.test',    'Founder#2026',    'Demo Founder',    'founder',  NULL),
      ('investor@zamfund.test',   'Investor#2026',   'Demo Investor',   'investor', NULL)
    ) AS t(email, password, full_name, user_type, role)
  LOOP
    SELECT id INTO uid FROM auth.users WHERE email = rec.email;

    IF uid IS NULL THEN
      uid := gen_random_uuid();
      INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password,
        email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at, confirmation_token, recovery_token,
        email_change_token_new, email_change
      ) VALUES (
        uid,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        rec.email,
        crypt(rec.password, gen_salt('bf')),
        now(),
        jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
        jsonb_build_object('full_name', rec.full_name),
        now(), now(), '', '', '', ''
      );

      INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
      VALUES (
        gen_random_uuid(), uid,
        jsonb_build_object('sub', uid::text, 'email', rec.email, 'email_verified', true),
        'email', uid::text, now(), now(), now()
      );
    ELSE
      UPDATE auth.users
      SET encrypted_password = crypt(rec.password, gen_salt('bf')),
          email_confirmed_at = COALESCE(email_confirmed_at, now()),
          updated_at = now()
      WHERE id = uid;
    END IF;

    -- profile (upsert)
    INSERT INTO public.profiles (user_id, full_name, user_type, is_verified)
    VALUES (uid, rec.full_name, rec.user_type, true)
    ON CONFLICT (user_id) DO UPDATE
      SET full_name = EXCLUDED.full_name,
          user_type = EXCLUDED.user_type,
          is_verified = true;

    -- wallet (in case trigger missing)
    INSERT INTO public.wallets (user_id) VALUES (uid)
    ON CONFLICT (user_id) DO NOTHING;

    -- role
    IF rec.role IS NOT NULL THEN
      INSERT INTO public.user_roles (user_id, role)
      VALUES (uid, rec.role::public.app_role)
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END $$;