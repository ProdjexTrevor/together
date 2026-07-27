-- Together tables only (does not touch existing tables)

CREATE TABLE IF NOT EXISTS profiles (
  id VARCHAR(191) NOT NULL,
  email VARCHAR(191) NOT NULL,
  password_hash VARCHAR(191) NOT NULL,
  full_name VARCHAR(191) NOT NULL,
  avatar_url VARCHAR(191) NULL,
  timezone VARCHAR(191) NOT NULL DEFAULT 'America/Chicago',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL,
  UNIQUE INDEX profiles_email_key(email),
  PRIMARY KEY (id)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS households (
  id VARCHAR(191) NOT NULL,
  name VARCHAR(191) NOT NULL,
  created_by VARCHAR(191) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  INDEX households_created_by_fkey(created_by),
  CONSTRAINT households_created_by_fkey FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS household_members (
  id VARCHAR(191) NOT NULL,
  household_id VARCHAR(191) NOT NULL,
  user_id VARCHAR(191) NOT NULL,
  role VARCHAR(191) NOT NULL,
  status VARCHAR(191) NOT NULL DEFAULT 'active',
  joined_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX household_members_household_id_user_id_key(household_id, user_id),
  PRIMARY KEY (id),
  INDEX household_members_user_id_fkey(user_id),
  CONSTRAINT household_members_household_id_fkey FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT household_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS household_invitations (
  id VARCHAR(191) NOT NULL,
  household_id VARCHAR(191) NOT NULL,
  email VARCHAR(191) NOT NULL,
  token VARCHAR(191) NOT NULL,
  invited_by VARCHAR(191) NOT NULL,
  expires_at DATETIME(3) NOT NULL,
  accepted_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX household_invitations_token_key(token),
  PRIMARY KEY (id),
  INDEX household_invitations_household_id_fkey(household_id),
  INDEX household_invitations_invited_by_fkey(invited_by),
  CONSTRAINT household_invitations_household_id_fkey FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT household_invitations_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES profiles(id) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS items (
  id VARCHAR(191) NOT NULL,
  household_id VARCHAR(191) NOT NULL,
  type VARCHAR(191) NOT NULL,
  title VARCHAR(191) NOT NULL,
  description TEXT NULL,
  status VARCHAR(191) NOT NULL,
  created_by VARCHAR(191) NOT NULL,
  owner_id VARCHAR(191) NULL,
  priority VARCHAR(191) NOT NULL DEFAULT 'normal',
  start_date DATETIME(3) NULL,
  due_date DATETIME(3) NULL,
  completed_at DATETIME(3) NULL,
  archived_at DATETIME(3) NULL,
  outcome TEXT NULL,
  decided_option_id VARCHAR(191) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  INDEX items_household_id_idx(household_id),
  INDEX items_type_idx(type),
  INDEX items_status_idx(status),
  INDEX items_owner_id_idx(owner_id),
  INDEX items_due_date_idx(due_date),
  INDEX items_created_by_fkey(created_by),
  CONSTRAINT items_household_id_fkey FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT items_created_by_fkey FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT items_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS task_checklist_items (
  id VARCHAR(191) NOT NULL,
  item_id VARCHAR(191) NOT NULL,
  title VARCHAR(191) NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  INDEX task_checklist_items_item_id_fkey(item_id),
  CONSTRAINT task_checklist_items_item_id_fkey FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS decision_options (
  id VARCHAR(191) NOT NULL,
  item_id VARCHAR(191) NOT NULL,
  title VARCHAR(191) NOT NULL,
  description TEXT NULL,
  pros JSON NOT NULL,
  cons JSON NOT NULL,
  image_url VARCHAR(191) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  INDEX decision_options_item_id_fkey(item_id),
  CONSTRAINT decision_options_item_id_fkey FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS decision_responses (
  id VARCHAR(191) NOT NULL,
  item_id VARCHAR(191) NOT NULL,
  option_id VARCHAR(191) NOT NULL,
  user_id VARCHAR(191) NOT NULL,
  note TEXT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL,
  UNIQUE INDEX decision_responses_item_id_user_id_key(item_id, user_id),
  PRIMARY KEY (id),
  INDEX decision_responses_option_id_fkey(option_id),
  INDEX decision_responses_user_id_fkey(user_id),
  CONSTRAINT decision_responses_item_id_fkey FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT decision_responses_option_id_fkey FOREIGN KEY (option_id) REFERENCES decision_options(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT decision_responses_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS goal_details (
  item_id VARCHAR(191) NOT NULL,
  tracking_type VARCHAR(191) NOT NULL,
  target_value DOUBLE NULL,
  current_value DOUBLE NOT NULL DEFAULT 0,
  unit VARCHAR(191) NULL,
  weekly_frequency INT NULL,
  streak_count INT NOT NULL DEFAULT 0,
  PRIMARY KEY (item_id),
  CONSTRAINT goal_details_item_id_fkey FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS goal_milestones (
  id VARCHAR(191) NOT NULL,
  item_id VARCHAR(191) NOT NULL,
  title VARCHAR(191) NOT NULL,
  target_date DATETIME(3) NULL,
  completed_at DATETIME(3) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  INDEX goal_milestones_item_id_fkey(item_id),
  CONSTRAINT goal_milestones_item_id_fkey FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS financial_details (
  item_id VARCHAR(191) NOT NULL,
  target_amount_cents INT NOT NULL,
  current_amount_cents INT NOT NULL DEFAULT 0,
  PRIMARY KEY (item_id),
  CONSTRAINT financial_details_item_id_fkey FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS financial_contributions (
  id VARCHAR(191) NOT NULL,
  item_id VARCHAR(191) NOT NULL,
  amount_cents INT NOT NULL,
  contributor_id VARCHAR(191) NOT NULL,
  contributed_at DATETIME(3) NOT NULL,
  note TEXT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  INDEX financial_contributions_item_id_fkey(item_id),
  INDEX financial_contributions_contributor_id_fkey(contributor_id),
  CONSTRAINT financial_contributions_item_id_fkey FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT financial_contributions_contributor_id_fkey FOREIGN KEY (contributor_id) REFERENCES profiles(id) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS comments (
  id VARCHAR(191) NOT NULL,
  item_id VARCHAR(191) NOT NULL,
  user_id VARCHAR(191) NOT NULL,
  parent_id VARCHAR(191) NULL,
  body TEXT NOT NULL,
  edited_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  INDEX comments_item_id_fkey(item_id),
  INDEX comments_user_id_fkey(user_id),
  INDEX comments_parent_id_fkey(parent_id),
  CONSTRAINT comments_item_id_fkey FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT comments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS comment_reactions (
  id VARCHAR(191) NOT NULL,
  comment_id VARCHAR(191) NOT NULL,
  user_id VARCHAR(191) NOT NULL,
  emoji VARCHAR(191) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX comment_reactions_comment_id_user_id_emoji_key(comment_id, user_id, emoji),
  PRIMARY KEY (id),
  INDEX comment_reactions_user_id_fkey(user_id),
  CONSTRAINT comment_reactions_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT comment_reactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS activity_events (
  id VARCHAR(191) NOT NULL,
  household_id VARCHAR(191) NOT NULL,
  item_id VARCHAR(191) NULL,
  actor_id VARCHAR(191) NOT NULL,
  event_type VARCHAR(191) NOT NULL,
  summary VARCHAR(191) NOT NULL,
  metadata JSON NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  INDEX activity_events_household_id_fkey(household_id),
  INDEX activity_events_item_id_fkey(item_id),
  INDEX activity_events_actor_id_fkey(actor_id),
  CONSTRAINT activity_events_household_id_fkey FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT activity_events_item_id_fkey FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT activity_events_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES profiles(id) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(191) NOT NULL,
  user_id VARCHAR(191) NOT NULL,
  household_id VARCHAR(191) NOT NULL,
  item_id VARCHAR(191) NULL,
  type VARCHAR(191) NOT NULL,
  title VARCHAR(191) NOT NULL,
  body TEXT NOT NULL,
  read_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  INDEX notifications_user_id_fkey(user_id),
  INDEX notifications_household_id_fkey(household_id),
  INDEX notifications_item_id_fkey(item_id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT notifications_household_id_fkey FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT notifications_item_id_fkey FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id VARCHAR(191) NOT NULL,
  assignments BOOLEAN NOT NULL DEFAULT true,
  comments BOOLEAN NOT NULL DEFAULT true,
  mentions BOOLEAN NOT NULL DEFAULT true,
  decisions BOOLEAN NOT NULL DEFAULT true,
  deadlines BOOLEAN NOT NULL DEFAULT true,
  contributions BOOLEAN NOT NULL DEFAULT true,
  PRIMARY KEY (user_id),
  CONSTRAINT notification_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
