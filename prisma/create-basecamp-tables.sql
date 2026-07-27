-- Discreet Basecamp tables (encrypted app payloads)

CREATE TABLE IF NOT EXISTS together_basecamp_ynm (
  id VARCHAR(191) NOT NULL,
  household_id VARCHAR(191) NOT NULL,
  title_enc TEXT NOT NULL,
  category_enc TEXT NOT NULL,
  notes_enc TEXT NULL,
  vote_a VARCHAR(16) NOT NULL DEFAULT 'unset',
  vote_b VARCHAR(16) NOT NULL DEFAULT 'unset',
  created_by VARCHAR(191) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL,
  INDEX together_basecamp_ynm_household_id_idx(household_id),
  PRIMARY KEY (id)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS together_basecamp_coupons (
  id VARCHAR(191) NOT NULL,
  household_id VARCHAR(191) NOT NULL,
  title_enc TEXT NOT NULL,
  body_enc TEXT NOT NULL,
  from_user_id VARCHAR(191) NOT NULL,
  to_user_id VARCHAR(191) NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'available',
  redeemed_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX together_basecamp_coupons_household_id_idx(household_id),
  PRIMARY KEY (id)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS together_basecamp_missions (
  id VARCHAR(191) NOT NULL,
  household_id VARCHAR(191) NOT NULL,
  title_enc TEXT NOT NULL,
  details_enc TEXT NULL,
  reward_enc TEXT NOT NULL,
  assigned_to VARCHAR(191) NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'open',
  created_by VARCHAR(191) NOT NULL,
  completed_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX together_basecamp_missions_household_id_idx(household_id),
  PRIMARY KEY (id)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS together_basecamp_goals (
  id VARCHAR(191) NOT NULL,
  household_id VARCHAR(191) NOT NULL,
  title_enc TEXT NOT NULL,
  details_enc TEXT NULL,
  target INT NOT NULL DEFAULT 1,
  progress INT NOT NULL DEFAULT 0,
  created_by VARCHAR(191) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL,
  INDEX together_basecamp_goals_household_id_idx(household_id),
  PRIMARY KEY (id)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS together_basecamp_notes (
  id VARCHAR(191) NOT NULL,
  household_id VARCHAR(191) NOT NULL,
  author_id VARCHAR(191) NOT NULL,
  body_enc TEXT NOT NULL,
  heat INT NOT NULL DEFAULT 3,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX together_basecamp_notes_household_id_idx(household_id),
  PRIMARY KEY (id)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
