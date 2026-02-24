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
  logs: "gmailLogs",
  isTestRunning: "gmailIsTestRunning",
  userStopWords: "gmailUserStopWords",
  domainPrefs: "gmailDomainPrefs",
  siteAllowlist: "gmailSiteAllowlist",
  clipboardClearSeconds: "gmailClipboardClearSeconds",
  advancedTestMode: "gmailAdvancedTestMode",
  testingToolsMode: "gmailTestingToolsMode"
};

export const MSG = {
  connect: "GMAIL_CONNECT",
  disconnect: "GMAIL_DISCONNECT",
  fetch: "GMAIL_FETCH_LAST_CODE",
  modeAuto: "GMAIL_MODE_AUTO",
  modeManual: "GMAIL_MODE_MANUAL",
  getLogs: "GMAIL_GET_LOGS",
  clearLogs: "GMAIL_CLEAR_LOGS",
  testRun: "GMAIL_TEST_RUN",
  exportFull: "GMAIL_EXPORT_FULL",
  markAsCode: "GMAIL_MARK_AS_CODE",
  markAsNoCode: "GMAIL_MARK_AS_NO_CODE",
  correctCode: "GMAIL_CORRECT_CODE",
  ignoreCode: "GMAIL_IGNORE_CODE"
};

export const MAX_ACCOUNTS = 3;
export const MAX_LOG_ENTRIES = 50;
export const DEFAULT_QUERY = "newer_than:1h subject:(code OR verification OR подтверждение OR код OR Steam OR Guard OR Access OR Security OR Login OR sign-in OR OTP)";
