declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DISCORD_TOKEN: string;
      PREFIX: string;
      OWNERS: string;
      username: string;
      password: string;
      database: string;
    }
  }
}

export {}
