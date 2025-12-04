import { auth } from '@/lib/auth';

export async function GET(req: Request) {
    console.log('headers', req.headers);
    // NOTE: unable to return response object from signInWithOAuth2 with proper cookies
    const redirectInfo = await auth.api.signInWithOAuth2({
      body: {
        providerId: 'github2',
        callbackURL: 'http://localhost:3000/dashboard',
      },
      headers: req.headers,
    });
    console.log('headers after sign in', req.headers);

    return Response.redirect(redirectInfo.url);
}
