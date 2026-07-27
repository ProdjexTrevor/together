-- WebAuthn credentials for Face ID / passcode lock

CREATE TABLE IF NOT EXISTS together_webauthn_credentials (
  id VARCHAR(191) NOT NULL,
  user_id VARCHAR(191) NOT NULL,
  credential_id VARCHAR(512) NOT NULL,
  public_key TEXT NOT NULL,
  counter INT NOT NULL DEFAULT 0,
  transports JSON NOT NULL,
  device_type VARCHAR(191) NOT NULL DEFAULT 'singleDevice',
  backed_up BOOLEAN NOT NULL DEFAULT false,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL,
  UNIQUE INDEX together_webauthn_credentials_credential_id_key(credential_id),
  INDEX together_webauthn_credentials_user_id_idx(user_id),
  PRIMARY KEY (id),
  CONSTRAINT together_webauthn_credentials_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES together_profiles(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
