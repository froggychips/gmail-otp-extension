export const STORAGE_KEYS = {
  accounts: "gmailAccounts",
  query: "gmailQuery",
  unreadOnly: "gmailUnreadOnly",
  lastEntry: "gmailLastEntry",
  unmatched: "gmailUnmatched",
  senderAllowlist: "gmailSenderAllowlist",
  senderBlocklist: "gmailSenderBlocklist",
  lastCheckTime: "gmailLastCheckTime",
  history: "gmailHistory",
  threshold: "gmailThreshold",
  mode: "gmailMode",
  logs: "gmailLogs"
};

export const MSG = {
  connect: "GMAIL_CONNECT",
  disconnect: "GMAIL_DISCONNECT",
  fetch: "GMAIL_FETCH_LAST_CODE",
  modeAuto: "GMAIL_MODE_AUTO",
  modeManual: "GMAIL_MODE_MANUAL",
  getLogs: "GMAIL_GET_LOGS",
  clearLogs: "GMAIL_CLEAR_LOGS",
  testRun: "GMAIL_TEST_RUN"
};

export const MAX_ACCOUNTS = 3;
export const MAX_LOG_ENTRIES = 50;
export const DEFAULT_QUERY = "newer_than:1h subject:(code OR verification OR подтверждение OR код)";
