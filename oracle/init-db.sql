CREATE TABLE IF NOT EXISTS users (
  userId TEXT PRIMARY KEY,
  secret_enc TEXT NOT NULL,  -- JSON string {iv,content,tag}
  createdAt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS submissions (
  requestId TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  code TEXT NOT NULL,
  createdAt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS processed (
  requestId TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  oracleTxHash TEXT,
  fulfilledAt INTEGER NOT NULL
);
