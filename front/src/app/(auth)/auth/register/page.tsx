import { RegisterForm } from "../../_component/register-form";
import { ReturnButton } from "../../_component/return-button";

const RegisterPage = () => {
  return (
    <div className="px-8 py-16 container mx-auto max-w-screen-lg space-y-8">
      <div className="space-y-4">
        <ReturnButton href="/" label="Home" />

        <RegisterForm />
      </div>
    </div>
  );
};

export default RegisterPage;
