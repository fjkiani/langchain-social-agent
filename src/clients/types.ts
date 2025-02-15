/**
 * Interface for authorizing a user to use the Twitter API
 */
export type AuthorizeUserResponse =
  | {
      /**
       * The Bearer token used to authenticate requests with the Twitter API
       */
      token: string;
      /**
       * The URL to visit to authorize the user
       */
      authorizationUrl?: never;
    }
  | {
      /**
       * The Bearer token used to authenticate requests with the Twitter API
       */
      token?: never;
      /**
       * The URL to visit to authorize the user
       */
      authorizationUrl: string;
    };
