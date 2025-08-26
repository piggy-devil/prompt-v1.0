import { LoginForm } from "../../_component/login-form";
// import { ReturnButton } from "../../_component/return-button";

const LoginPage = () => {
  return (
    <div className="px-8 py-16 container mx-auto max-w-screen-lg space-y-8">
      <div className="space-y-4">
        {/* <ReturnButton href="/" label="Home" /> */}

        <LoginForm />
      </div>
    </div>
  );
};

export default LoginPage;
