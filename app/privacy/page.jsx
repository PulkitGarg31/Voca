import InfoPage, { InfoSection } from "@/components/landing/InfoPage";

export const metadata = { title: "Privacy Policy | VOCA" };

export default function PrivacyPage() {
  return (
    <InfoPage
      title="Privacy Policy"
      tagline="What we collect, why we collect it, and the control you keep over it."
      updated="July 25, 2026"
    >
      <InfoSection heading="1. What we collect">
        <p>
          Account details: your name, email address, and a securely hashed password.
          If you sign in with Google, we receive your name and verified email from
          Google instead of a password.
        </p>
        <p>
          Learning data: the words you save, practice sessions, mastery levels,
          streaks, and your daily goal.
        </p>
        <p>
          Chat data: the messages you exchange with the AI tutor, stored so your
          conversations can be reopened later.
        </p>
      </InfoSection>
      <InfoSection heading="2. How we use it">
        <p>
          Your data is used to run VOCA for you: scheduling reviews, tracking
          progress, remembering chat context, and personalising the experience. We do
          not sell your data or use it for advertising.
        </p>
      </InfoSection>
      <InfoSection heading="3. AI processing">
        <p>
          When you use the AI chat or word help, the relevant text is sent to our AI
          provider (Google Gemini) to generate a response. Only what is needed for
          the answer is sent, and it is not used by us for anything else.
        </p>
      </InfoSection>
      <InfoSection heading="4. Cookies and sessions">
        <p>
          We use a session cookie to keep you signed in, and your browser&apos;s local
          storage to remember preferences such as your theme. We do not use tracking
          or advertising cookies.
        </p>
      </InfoSection>
      <InfoSection heading="5. Storage and security">
        <p>
          Data is stored in a MongoDB database. Passwords are hashed with bcrypt and
          are never stored in plain text. Access to your data is scoped to your
          account.
        </p>
      </InfoSection>
      <InfoSection heading="6. Your control">
        <p>
          You can edit or delete any word, clear conversations, and delete your entire
          account from Settings. Deleting your account permanently removes your
          profile, words, practice history, and chat history.
        </p>
      </InfoSection>
      <InfoSection heading="7. Changes to this policy">
        <p>
          If we change how we handle your data, we will update this page and note the
          new date above.
        </p>
      </InfoSection>
      <InfoSection heading="8. Contact">
        <p>
          Privacy questions? Reach out through the project&apos;s GitHub page:{" "}
          <a
            href="https://github.com/PulkitGarg31"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            github.com/PulkitGarg31
          </a>
          .
        </p>
      </InfoSection>
    </InfoPage>
  );
}
