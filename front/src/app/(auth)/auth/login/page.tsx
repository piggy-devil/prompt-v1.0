import AuthShell from "../../_component/auth-shell";
import { LoginForm } from "../../_component/login-form";

const LoginPage = () => {
  return (
    <AuthShell>
      <LoginForm />
    </AuthShell>
  );
};

export default LoginPage;
