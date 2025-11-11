import { betterFetch } from "@better-fetch/fetch";
import { betterAuth } from "better-auth";
import { genericOAuth } from "better-auth/plugins/generic-oauth";
import { GithubProfile } from "better-auth/social-providers";

const baseURL: string | undefined =
  process.env.VERCEL === "1"
    ? process.env.VERCEL_ENV === "production"
      ? process.env.BETTER_AUTH_URL
      : process.env.VERCEL_ENV === "preview"
      ? `https://${process.env.VERCEL_URL}`
      : undefined
    : undefined;

export const auth = betterAuth({
  baseURL,
  secret: process.env.BETTER_AUTH_SECRET,

  // socialProviders: {
  // 	github: {
  // 		clientId: process.env.GITHUB_CLIENT_ID as string,
  // 		clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
  // 	},
  // },

  session: {
    cookieCache: {
      enabled: true,
    },
  },

  advanced: {
    oauthConfig: {
      storeStateStrategy: "cookie",
    },
  },
  plugins: [
    genericOAuth({
      config: [
        {
          providerId: "github2",
          clientId: process.env.GITHUB_CLIENT_ID as string,
          clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
          //   scopes: ['openid', 'profile', 'email', 'offline_access', 'groups'],
          scopes: ["read:user", "user:email"],
          authorizationUrl: "https://github.com/login/oauth/authorize",
          tokenUrl: "https://github.com/login/oauth/access_token",
          //   userInfoUrl: "https://api.github.com/user",
          async getUserInfo(token) {
            const { data: profile, error } = await betterFetch<GithubProfile>(
              "https://api.github.com/user",
              {
                headers: {
                  "User-Agent": "better-auth",
                  authorization: `Bearer ${token.accessToken}`,
                },
              }
            );
            if (error) {
              return null;
            }
            const { data: emails } = await betterFetch<
              {
                email: string;
                primary: boolean;
                verified: boolean;
                visibility: "public" | "private";
              }[]
            >("https://api.github.com/user/emails", {
              headers: {
                Authorization: `Bearer ${token.accessToken}`,
                "User-Agent": "better-auth",
              },
            });

            if (!profile.email && emails) {
              profile.email = (emails.find((e) => e.primary) ?? emails[0])
                ?.email as string;
            }
            const emailVerified =
              emails?.find((e) => e.email === profile.email)?.verified ?? false;

            return {
              id: profile.id,
              name: profile.name || profile.login,
              email: profile.email,
              image: profile.avatar_url,
              emailVerified,
            };
          },
          //   discoveryUrl:
          //     "https://github.com/login/oauth/.well-known/openid-configuration",
          disableImplicitSignUp: true,
          disableSignUp: true,
        },
      ],
    }),
  ],
});
