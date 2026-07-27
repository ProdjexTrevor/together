-- Push notification tables for Together PWA

CREATE TABLE IF NOT EXISTS together_push_subscriptions (
  id VARCHAR(191) NOT NULL,
  user_id VARCHAR(191) NOT NULL,
  endpoint TEXT NOT NULL,
  endpoint_hash VARCHAR(191) NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL,
  UNIQUE INDEX together_push_subscriptions_endpoint_hash_key(endpoint_hash),
  INDEX together_push_subscriptions_user_id_idx(user_id),
  PRIMARY KEY (id),
  CONSTRAINT together_push_subscriptions_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES together_profiles(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS together_deadline_reminder_logs (
  id VARCHAR(191) NOT NULL,
  item_id VARCHAR(191) NOT NULL,
  kind VARCHAR(191) NOT NULL,
  sent_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX together_deadline_reminder_logs_item_id_kind_key(item_id, kind),
  PRIMARY KEY (id),
  CONSTRAINT together_deadline_reminder_logs_item_id_fkey
    FOREIGN KEY (item_id) REFERENCES together_items(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
