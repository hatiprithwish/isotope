export enum LogCategory {
  Route = "Route",
  DAL = "DAL",
  Repo = "Repo",
  Middleware = "Middleware",
  DB = "DB",
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

  // Contacts
  CreateContact = "CreateContact",
  GetContactDetails = "GetContactDetails",
  ListContacts = "ListContacts",
  UpdateContact = "UpdateContact",
  DeleteContact = "DeleteContact",
}
