export interface ShellWorkspace {
  slug: string;
  name: string;
  logoUrl: string | null;
}

export interface ShellUser {
  displayName: string;
  email: string | null;
}
