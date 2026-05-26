interface AuthVariables {
  clerkUserId: string;
  clerkEmail: string;
}

interface AppContext {
  Bindings: Env;
  Variables: AuthVariables;
}

export default AppContext;
