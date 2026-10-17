import AuthForm from "../components/AuthForm";

export const metadata = {
  title: "Log in — AutoFlow",
  description: "Log in to AutoFlow to see your own workflows.",
};

export default function LoginPage() {
  return <AuthForm mode="login" />;
}
