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

  // AI
  AiRun = "AiRun",

  // Contacts
  CreateContact = "CreateContact",
  GetContactDetails = "GetContactDetails",
  ListContacts = "ListContacts",
  UpdateContact = "UpdateContact",
  DeleteContact = "DeleteContact",
  GetContactHistory = "GetContactHistory",
  CreateContactHistory = "CreateContactHistory",
  UpdateContactHistory = "UpdateContactHistory",
  DeleteContactHistory = "DeleteContactHistory",

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
}
