import { Article } from '@/components/article'
import { Step } from '@/components/step'
import { Callout } from '@/components/callout'
import { VideoSlot } from '@/components/video-slot'

export function SigningIn() {
  return (
    <Article
      title="Signing In"
      subtitle="How to access your EBMS Ecommerce account."
    >
      <p>
        EBMS Ecommerce uses email and password authentication. Your admin will
        create your account and provide you with credentials. Once you have them,
        follow the steps below to sign in.
      </p>

      <VideoSlot title="Signing in for the first time" />

      <h2>How to sign in</h2>

      <Step number={1} title="Open the application">
        Navigate to your company's EBMS Ecommerce URL in a web browser. The
        sign-in page displays a form with email and password fields. Chrome,
        Firefox, Safari, and Edge are all supported.
      </Step>

      <Step number={2} title="Enter your credentials">
        Type the email address associated with your account and the password your
        admin provided. Passwords are case-sensitive, so make sure caps lock is
        off.
      </Step>

      <Step number={3} title="Click Sign In">
        Press the <strong>Sign In</strong> button to authenticate. If your
        credentials are correct, you will be redirected to the dashboard. If you
        had a specific page bookmarked, you will be taken there instead.
      </Step>

      <Callout type="tip">
        If you do not have credentials yet, contact your system administrator.
        They can create a new user account for you from the Users management page
        in the admin settings.
      </Callout>

      <h2>Session management</h2>

      <p>
        After signing in, your session persists across browser tabs and survives
        page refreshes. The platform uses token-based authentication with
        automatic refresh, so you will stay signed in until you explicitly log
        out or your session expires after an extended period of inactivity.
      </p>

      <p>
        If your session does expire, you will be redirected to the sign-in page
        automatically. After entering your credentials again, you will be
        returned to the page you were trying to access.
      </p>

      <Callout type="info">
        Sessions are scoped per browser. If you sign in on a different device or
        in a private/incognito window, you will need to authenticate separately.
        Your session on other devices is not affected.
      </Callout>

      <h2>Signing out</h2>

      <p>
        To sign out, click your avatar or name in the bottom-left corner of the
        sidebar to open the user menu, then select <strong>Sign Out</strong>.
        This clears your session tokens and returns you to the sign-in page.
      </p>

      <Callout type="warning">
        If you are on a shared or public computer, always sign out when you are
        done. Closing the browser tab alone does not end your session.
      </Callout>
    </Article>
  )
}
