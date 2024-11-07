import { Button } from "antd";
import { useRouter } from "next/navigation";

const AccountActivation = () => {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push("/login"); // Redirects to the login page
  };
  return (
    <div className="font-poppins flex flex-col min-h-[75vh]">
      <div className="flex flex-col justify-center items-center flex-grow">
        <img src="/images/tick_green.svg" alt="Success" className="h-32" />
        <h2 className="text-2xl font-extrabold text-[#1F1F1F] text-center">
          Account Activated!
        </h2>
        <p className="text-base mt-4 text-[#1F1F1F] text-center max-w-[600px]">
          Awesome! Now you can start your journey with us
        </p>
        <div className="flex space-x-4 mt-8">
          <Button type="primary" onClick={handleGetStarted}>
            Get Started
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AccountActivation;
