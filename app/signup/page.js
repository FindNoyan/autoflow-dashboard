import AuthForm from "../components/AuthForm";

export const metadata = {
  title: "Sign up — AutoFlow",
  description: "Create an AutoFlow account to save your own workflows.",
};

export default function SignupPage() {
  return <AuthForm mode="signup" />;
}
