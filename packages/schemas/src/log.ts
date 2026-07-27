export enum LogCategory {
  Route = "Route",
  DAL = "DAL",
  Repo = "Repo",
  Middleware = "Middleware",
  DB = "DB",
  Provider = "Provider",
}

export enum LogAction {
  // Auth
  VerifyToken = "VerifyToken",
  SyncClerkUser = "SyncClerkUser",
  SignOut = "SignOut",

  // User
  GetUserDetails = "GetUserDetails",

  // Notes
  CreateNote = "CreateNote",
  GetNoteDetails = "GetNoteDetails",
  ListNotes = "ListNotes",
  UpdateNote = "UpdateNote",
  DeleteNote = "DeleteNote",

  // Companies
  CreateCompany = "CreateCompany",
  GetCompanyDetails = "GetCompanyDetails",
  ListCompanies = "ListCompanies",
  UpdateCompany = "UpdateCompany",
  DeleteCompany = "DeleteCompany",
  BulkDeleteCompanies = "BulkDeleteCompanies",

  // AI
  AiRun = "AiRun",

  // Contacts
  CreateContact = "CreateContact",
  GetContactDetails = "GetContactDetails",
  ListContacts = "ListContacts",
  UpdateContact = "UpdateContact",
  DeleteContact = "DeleteContact",
  BulkDeleteContacts = "BulkDeleteContacts",
  BulkUpdateContacts = "BulkUpdateContacts",
  GetContactHistory = "GetContactHistory",
  CreateContactHistory = "CreateContactHistory",
  UpdateContactHistory = "UpdateContactHistory",
  DeleteContactHistory = "DeleteContactHistory",
  UpdateNextTouchDueAt = "UpdateNextTouchDueAt",
  UpdateContactStatus = "UpdateContactStatus",
  GetLastSentHistory = "GetLastSentHistory",
  GetSentMessageCount = "GetSentMessageCount",
  CheckDuplicateContact = "CheckDuplicateContact",
  BulkLogContactHistory = "BulkLogContactHistory",

  // Frameworks
  SaveFramework = "SaveFramework",
  GetFramework = "GetFramework",

  // Jobs
  SearchJobs = "SearchJobs",
  CreateJob = "CreateJob",
  GetJobDetails = "GetJobDetails",
  ListJobs = "ListJobs",
  CountJobs = "CountJobs",
  UpdateJob = "UpdateJob",
  DeleteJob = "DeleteJob",
  RunJobIngestion = "RunJobIngestion",
  DuplicateJobBlocked = "DuplicateJobBlocked",
  DiscoverJobs = "DiscoverJobs",
  WebSearch = "WebSearch",
  ExtractJobs = "ExtractJobs",
  BulkInsertJobs = "BulkInsertJobs",
  BulkDeleteJobs = "BulkDeleteJobs",
  BulkUpdateJobs = "BulkUpdateJobs",

  // Email inbound ingestion
  InboundEmailReceived = "InboundEmailReceived",
  InboundEmailFetchFailed = "InboundEmailFetchFailed",
  InboundUrlExtracted = "InboundUrlExtracted",
  InboundScrapeStarted = "InboundScrapeStarted",
  InboundScrapeFailed = "InboundScrapeFailed",
  InboundJobInserted = "InboundJobInserted",

  // Browser Run budget
  BrowserRunBudgetChecked = "BrowserRunBudgetChecked",
  BrowserRunBudgetShutdown = "BrowserRunBudgetShutdown",
  BrowserRunBudgetRecorded = "BrowserRunBudgetRecorded",
  BrowserRunBudgetReset = "BrowserRunBudgetReset",

  // Tasks
  GetTasksCalendar = "GetTasksCalendar",
  GetTasksForDate = "GetTasksForDate",
  GetPastTasks = "GetPastTasks",
  SearchTasks = "SearchTasks",
  UpdateTaskStatus = "UpdateTaskStatus",
  SyncFollowUpTask = "SyncFollowUpTask",
  DeleteFollowUpTasks = "DeleteFollowUpTasks",
  PauseFollowUpTask = "PauseFollowUpTask",
  ResumeFollowUpTask = "ResumeFollowUpTask",
  SweepOverdueTasks = "SweepOverdueTasks",

  // Follow-up settings
  GetFollowUpSettings = "GetFollowUpSettings",
  SaveFollowUpSettings = "SaveFollowUpSettings",

  // Contact role pills
  GetContactRolePills = "GetContactRolePills",
  SaveContactRolePills = "SaveContactRolePills",

  // Role types
  GetRoleTypes = "GetRoleTypes",
  SaveRoleTypes = "SaveRoleTypes",

  // Message template
  GetMessageTemplates = "GetMessageTemplates",
  SaveMessageTemplate = "SaveMessageTemplate",
  ResolveMessageTemplate = "ResolveMessageTemplate",
  ResolveMessageTemplatesBulk = "ResolveMessageTemplatesBulk",

  // Search
  GlobalSearch = "GlobalSearch",
}
