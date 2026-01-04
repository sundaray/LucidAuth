export type GoogleSignInOptions = {
  redirectTo: string;
};

export type CredentialSignInOptions = {
  email: string;
  password: string;
  redirectTo: string;
};

export type GoogleSignInResult = {
  authorizationUrl: string;
};

export type CredentialSignInResult = {
  redirectTo: `/${string}`;
};

export type ProviderSignInOptions = {
  google: GoogleSignInOptions;
  credential: CredentialSignInOptions;
};

export type ProviderSignInResult = {
  google: GoogleSignInResult;
  credential: CredentialSignInResult;
};

export type ProviderId = keyof ProviderSignInOptions;
