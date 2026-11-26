import express, { Request, Response, NextFunction } from "express";
import passport from "passport";
import { Strategy as TwitterStrategy } from "passport-twitter";
import session from "express-session";
import dotenv from "dotenv";
import { TikTokClient } from "./tiktok.js";

dotenv.config();

// Extend Express Session type
declare module "express-session" {
  interface SessionData {
    linkedinToken?: string;
    linkedinUserInfo?: any;
    tiktokCsrfState?: string;
    tiktokToken?: any;
  }
}

interface TwitterUser {
  id: string;
  username: string;
  displayName: string;
  photos?: { value: string }[];
  _json: {
    id_str: string;
    screen_name: string;
    name: string;
    profile_image_url_https?: string;
  };
}

export class SocialAuthServer {
  private app: express.Application;
  private port: number;

  constructor(port = 3000) {
    this.app = express();
    this.port = port;
    this.configureMiddleware();
    this.configurePassport();
    this.setupRoutes();
  }

  private configureMiddleware(): void {
    this.app.use(
      session({
        secret: process.env.SESSION_SECRET || "your-session-secret",
        resave: true,
        saveUninitialized: true,
        cookie: {
          secure: false,
          maxAge: 60000,
        },
      }),
    );
    this.app.use(passport.initialize());
    this.app.use(passport.session());
  }

  private configurePassport(): void {
    if (process.env.TWITTER_API_KEY && process.env.TWITTER_API_KEY_SECRET) {
      this.configureTwitterStrategy();
    } else {
      console.warn(
        "[auth-server] Twitter credentials missing; /auth/twitter disabled.",
      );
    }

    // Make LinkedIn configuration optional
    if (process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET) {
      this.configureLinkedInStrategy();
    }

    if (process.env.TIKTOK_CLIENT_KEY && process.env.TIKTOK_CLIENT_SECRET) {
      console.log("[auth-server] TikTok Login Kit routes enabled.");
    } else {
      console.warn(
        "[auth-server] TikTok credentials missing; /auth/tiktok disabled.",
      );
    }

    passport.serializeUser((user, done) => {
      done(null, user);
    });

    passport.deserializeUser<any>((user, done) => {
      done(null, user);
    });
  }

  private configureTwitterStrategy(): void {
    if (!process.env.TWITTER_API_KEY || !process.env.TWITTER_API_KEY_SECRET) {
      throw new Error("Twitter API credentials are not configured");
    }

    passport.use(
      new TwitterStrategy(
        {
          consumerKey: process.env.TWITTER_API_KEY,
          consumerSecret: process.env.TWITTER_API_KEY_SECRET,
          callbackURL: `http://localhost:${this.port}/auth/twitter/callback`,
        },
        (
          token: string,
          tokenSecret: string,
          profile: TwitterUser,
          done: (error: any, user?: any) => void,
        ) => {
          const user = {
            ...profile,
            token,
            tokenSecret,
          };
          console.log("\n✅ TWITTER USER AUTHENTICATED ✅\n");
          console.dir(user, { depth: null });
          return done(null, user);
        },
      ),
    );
  }

  private configureLinkedInStrategy(): void {
    if (!process.env.LINKEDIN_CLIENT_ID || !process.env.LINKEDIN_CLIENT_SECRET) {
        // Instead of throwing error, just return if LinkedIn creds aren't present
        return;
    }

    // We'll handle LinkedIn authentication directly through routes
    // instead of using passport strategy since we're implementing
    // the OAuth flow manually
  }

  private getTikTokRedirectUri(): string {
    return (
      process.env.TIKTOK_REDIRECT_URI ||
      `http://localhost:${this.port}/auth/tiktok/callback`
    );
  }

  private setupRoutes(): void {
    this.app.get("/", (_req: Request, res: Response) => {
      res.send(
        [
          '<a href="/auth/twitter">Login with Twitter</a>',
          '<a href="/auth/linkedin">Login with LinkedIn</a>',
          '<a href="/auth/tiktok">Login with TikTok</a>',
        ].join("<br>"),
      );
    });

    // Twitter routes
    this.app.get("/auth/twitter", (req: Request, res: Response, next: NextFunction) => {
      if (!process.env.TWITTER_API_KEY || !process.env.TWITTER_API_KEY_SECRET) {
        return res
          .status(400)
          .send("Twitter credentials are not configured.") as any;
      }
      return passport.authenticate("twitter")(req, res, next);
    });
    this.app.get("/auth/twitter/callback", (req: Request, res: Response) => {
      passport.authenticate("twitter", {
        failureRedirect: "/login",
      })(req, res, (err: any) => {
        if (err) {
          console.error("Authentication error:", err);
          return res.redirect("/");
        }
        res.redirect("/");
      });
    });

    // LinkedIn routes
    this.app.get("/auth/linkedin", (_req: Request, res: Response) => {
      const authUrl = new URL(
        "https://www.linkedin.com/oauth/v2/authorization",
      );
      authUrl.searchParams.append("response_type", "code");
      authUrl.searchParams.append("client_id", process.env.LINKEDIN_CLIENT_ID!);
      authUrl.searchParams.append(
        "redirect_uri",
        "http://localhost:3000/auth/linkedin/callback",
      );
      authUrl.searchParams.append("state", process.env.SESSION_SECRET!);
      authUrl.searchParams.append(
        "scope",
        "openid profile email w_member_social",
        // Use these scopes if you plan on posting to a LinkedIn company page.
        // Posting to company pages requires the "w_organization_social" scope.
        // "openid profile email w_member_social w_organization_social",
      );

      res.redirect(authUrl.toString());
    });

    this.app.get("/auth/linkedin/callback", (req: Request, res: Response) => {
      const { code, state } = req.query;

      if (state !== process.env.SESSION_SECRET) {
        return res
          .status(401)
          .send("State mismatch. Possible CSRF attack.") as any;
      }

      if (!code) {
        return res.redirect("/");
      }

      // Handle the LinkedIn OAuth token exchange
      (async () => {
        try {
          const tokenResponse = await fetch(
            "https://www.linkedin.com/oauth/v2/accessToken",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: new URLSearchParams({
                grant_type: "authorization_code",
                code: code as string,
                client_id: process.env.LINKEDIN_CLIENT_ID!,
                client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
                redirect_uri: "http://localhost:3000/auth/linkedin/callback",
              }),
            },
          );

          if (!tokenResponse.ok) {
            throw new Error("Failed to get access token");
          }

          const data = await tokenResponse.json();
          console.log("\n✅ LINKEDIN USER AUTHENTICATED ✅\n");
          console.dir(data, { depth: null });

          // Fetch user info using OpenID Connect
          const userInfoResponse = await fetch(
            "https://api.linkedin.com/v2/userinfo",
            {
              headers: {
                Authorization: `Bearer ${data.access_token}`,
              },
            },
          );

          if (!userInfoResponse.ok) {
            throw new Error("Failed to get user info");
          }

          const userInfo = await userInfoResponse.json();
          console.log("\n✅ LINKEDIN USER INFO ✅\n");
          console.dir(userInfo, { depth: null });

          // Store both the token and user info in session
          if (req.session) {
            req.session.linkedinToken = data.access_token;
            req.session.linkedinUserInfo = userInfo;
          }

          res.redirect("/");
        } catch (error) {
          console.error("LinkedIn authentication error:", error);
          res.redirect("/");
        }
      })().catch(console.error);
    });

    // TikTok routes (Login Kit + Content Posting scopes)
    this.app.get("/auth/tiktok", (req: Request, res: Response) => {
      const clientKey = process.env.TIKTOK_CLIENT_KEY;
      if (!clientKey || !process.env.TIKTOK_CLIENT_SECRET) {
        return res
          .status(400)
          .send(
            "TikTok credentials are not configured. Set TIKTOK_CLIENT_KEY and TIKTOK_CLIENT_SECRET.",
          ) as any;
      }

      const csrfState = Math.random().toString(36).substring(2);
      if (req.session) {
        req.session.tiktokCsrfState = csrfState;
      }

      const redirectUri = this.getTikTokRedirectUri();
      const authUrl = TikTokClient.getAuthorizationUrl({
        clientKey,
        redirectUri,
        state: csrfState,
      });
      console.log("[auth-server] Redirecting to TikTok OAuth:", authUrl);
      res.redirect(authUrl);
    });

    this.app.get("/auth/tiktok/callback", (req: Request, res: Response) => {
      const { code, state, error, error_description } = req.query;

      if (error) {
        console.error("TikTok OAuth error:", error, error_description);
        return res
          .status(401)
          .send(`TikTok authorization failed: ${error}`) as any;
      }

      if (
        !state ||
        !req.session?.tiktokCsrfState ||
        state !== req.session.tiktokCsrfState
      ) {
        return res
          .status(401)
          .send("State mismatch. Possible CSRF attack.") as any;
      }

      if (!code || typeof code !== "string") {
        return res.redirect("/");
      }

      (async () => {
        try {
          const redirectUri = this.getTikTokRedirectUri();
          const data = await TikTokClient.exchangeCodeForToken({
            code,
            redirectUri,
          });

          console.log("\n✅ TIKTOK USER AUTHENTICATED ✅\n");
          console.dir(data, { depth: null });
          console.log(
            "\nSet these in your .env:\n" +
              `TIKTOK_ACCESS_TOKEN=${data.access_token}\n` +
              `TIKTOK_REFRESH_TOKEN=${data.refresh_token}\n` +
              `TIKTOK_OPEN_ID=${data.open_id}\n`,
          );

          if (req.session) {
            req.session.tiktokToken = data;
          }

          res.send(
            "<pre>TikTok auth success. Check the auth-server terminal for tokens to copy into .env.</pre>",
          );
        } catch (err) {
          console.error("TikTok authentication error:", err);
          res.status(500).send("TikTok authentication failed. See server logs.");
        }
      })().catch(console.error);
    });

    this.app.get(
      "/profile",
      this.ensureAuthenticated,
      (req: Request, res: Response) => {
        res.json(req.user);
      },
    );
  }

  private ensureAuthenticated(
    req: Request,
    res: Response,
    next: NextFunction,
  ): void {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect("/");
  }

  public start(): void {
    this.app.listen(this.port, () => {
      console.log(
        `Social authentication server is running on port ${this.port}. Go to http://localhost:${this.port} to login`,
      );
    });
  }
}

async function main() {
  const server = new SocialAuthServer();
  server.start();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default SocialAuthServer;
