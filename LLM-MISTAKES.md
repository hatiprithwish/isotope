1. Forgot to put constants in utils.ts file (in frontend). But to be fair, my utils.ts file was empty, so it would not have known where to put it.
2. Need a README.md file for all future apps, I need to add all the env variables, database setup, all those things I need to do in order to get started with the app. Otherwise I will forget one thing or the other.
   a. Set up clerk
   b. Add env variables for clerk
   c. Change database name db:migrate command
3. Write example utility functions in frontend too so that LLM understands where to put it, your utility functions also may be added in the rules file too.
4. Add theme support in scaffold repo.
5. Create ZSafeString and other input sanitization in scaffold repo
6. Change User_id column in the scaffold's example table to created_by. and fix it everywhere.
7. Usage of caseExpr in the scaffold's example DAL
8. Use dayjs in both FE & BE
9. All the packages should be like - "^x.0.0" so that it will get updated by themselves
10. LLM is storing all FE components in one file!! This is happening because in Frontend we don't have a huge number of components that interact with each other. Need to store this in scaffolding.
11. Instead of building table in shad
12. Add EnvConfig.ts in both FE & BE
