import { SetupEmployeeIdForm } from "../_component/setup-employee-id-form";

const SetupEmployeeIdPage = () => {
  return (
    <div className="px-8 py-16 container mx-auto max-w-screen-lg space-y-8">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Profile</h1>
      </div>

      <SetupEmployeeIdForm />
    </div>
  );
};

export default SetupEmployeeIdPage;
