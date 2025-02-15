# Setup Twitter API Instructions

- Create a Twitter developer account
- Create a new app and give it a name.
- Copy the `API Key` and `API Key Secret` and `Bearer Token` and set them as `TWITTER_API_KEY`, `TWITTER_API_KEY_SECRET`, and `TWITTER_BEARER_TOKEN` in your `.env` file.
- After saving, visit the App Dashboard. Find the `User authentication settings` section, and click the `Set up` button. This is how you will authorize users to use the Twitter API on their behalf.
- Set the following fields:
  - `App permissions`: `Read and write`
  - `Type of App`: `Web App, Automated App or Bot`
  - `App info`:
    - `Callback URI/Redirect URL`: `http://localhost:3000/auth/twitter/callback`
    - `Website URL`: Your website URL
- Save. You'll then be given a `Client ID` and `Client Secret`. Set these as `TWITTER_CLIENT_ID` and `TWITTER_CLIENT_SECRET` in your `.env` file.

Once done, run the `yarn start:auth` command to run the Twitter OAuth server. Open [http://localhost:3000](http://localhost:3000) in your browser, and click `Login with Twitter`.

After authorizing your account with the app, navigate to your terminal where you'll see a JSON object logged. Copy the `token` and `tokenSecret` values and set them as `TWITTER_USER_TOKEN` and `TWITTER_USER_TOKEN_SECRET` in your `.env` file.
