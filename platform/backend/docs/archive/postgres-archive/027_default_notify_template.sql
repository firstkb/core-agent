
INSERT INTO notification_template
(tenant_id, kind, key, locale, subject, html, text)
SELECT
  NULL, 'email', 'otp', 'default',
  'Our OTP Code',
  '<p>Hello!</p><p>Your OTP code: <b>{{ code }}</b></p><p>Code valid for {{ ttl }} minutes.</p>',
  'Hello!\nYour OTP code: {{ code }}\nCode valid for {{ ttl }} minutes.'
WHERE NOT EXISTS (
  SELECT 1
    FROM notification_template
   WHERE tenant_id IS NULL
     AND kind = 'email'
     AND key = 'otp'
     AND locale = 'default'
);

INSERT INTO notification_template
(tenant_id, kind, key, locale, subject, html, text)
SELECT
  NULL, 'sms', 'otp', 'default',
  NULL,
  NULL,
  'Your code {{ code }}, valid for {{ ttl }} minutes.'
WHERE NOT EXISTS (
  SELECT 1
    FROM notification_template
   WHERE tenant_id IS NULL
     AND kind = 'sms'
     AND key = 'otp'
     AND locale = 'default'
);
