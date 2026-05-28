1. Forgot to put constants in utils.ts file (in frontend). But to be fair, my utils.ts file was empty, so it would not have known where to put it.
2. Need a README.md file for all future apps, I need to add all the env variables, database setup, all those things I need to do in order to get started with the app. Otherwise I will forget one thing or the other.
   a. Set up clerk
   b. Add env variables for clerk
   c. Change database name db:migrate command
3. Write example utility functions in frontend too so that LLM understands where to put it, your utility functions also may be added in the rules file too.
4. Add theme support in scaffold repo.
5. Didn't put number for CompanyFitBandEnum
6. Create ZSafeString and other input sanitization in scaffold repo
7. Change User_id column in `notes` to created_by. and fix it everywhere.
8. Usage of caseExpr in NotesDAL
9. Use dayjs in both FE & BE
10. All the packages should be like - "^x.0.0" so that it will get updated by themselves
11. LLM is storing all FE components in one file!! This is happening because in Frontend we don't have a huge number of components that interact with each other. Need to store this in scaffolding.
12. Instead of building table in shad
13. Add EnvConfig.ts in both FE & BE
