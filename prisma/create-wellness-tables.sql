-- Wellness check-ins for Together

CREATE TABLE IF NOT EXISTS together_wellness_check_ins (
  id VARCHAR(191) NOT NULL,
  household_id VARCHAR(191) NOT NULL,
  user_id VARCHAR(191) NOT NULL,
  mental INT NOT NULL,
  physical INT NOT NULL,
  emotional INT NOT NULL,
  note TEXT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX together_wellness_check_ins_household_id_user_id_created_at_idx(household_id, user_id, created_at),
  PRIMARY KEY (id),
  CONSTRAINT together_wellness_check_ins_household_id_fkey
    FOREIGN KEY (household_id) REFERENCES together_households(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT together_wellness_check_ins_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES together_profiles(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
