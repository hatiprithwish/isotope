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

  // Frameworks
  GenerateFramework = "GenerateFramework",
  SaveFramework = "SaveFramework",
  GetLatestFramework = "GetLatestFramework",
  GetFrameworkVersions = "GetFrameworkVersions",
}
