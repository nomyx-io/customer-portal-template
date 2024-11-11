import React, { useState } from "react";
import { Layout } from "antd";
import { useRouter } from "next/router";
import { toast } from "react-toastify"; // Assuming you are using react-toastify
import SignUpForm from "../components/signup/sign-up-form";
import PasswordForm from "../components/signup/password-form";
import ConfirmMessage from "../components/signup/confirm-message";
import Header from "../components/global/auth_header";
import Parse from "parse";

const { Content } = Layout;

const SignUp = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showConfirmMessage, setShowConfirmMessage] = useState(false);
  const router = useRouter();

  // Handle next step to show the password form
  const handleNext = (data: any) => {
    setFormData(data);
    setShowPasswordForm(true);
  };

  // Handle going back from password form to sign-up form
  const handleBack = () => {
    setShowPasswordForm(false);
    setShowConfirmMessage(false);
  };

  // Handle the final submit when the password form is submitted
  const handleSubmit = async (data: any) => {
    try {
      toast.promise(
        async () => {
          // Log out the user if logged in (Parse-specific)
          await Parse.User.logOut();

          // Make API call to register the user
          const response = await Parse.Cloud.run("registerUser", {
            firstName: formData.firstName,
            lastName: formData.lastName,
            username: formData.email,
            password: data.password, // Password from password form
            email: formData.email.toLowerCase(),
            company: formData.company,
          });

          // Handle the API response
          if (response.success) {
            setShowConfirmMessage(true); // Show confirmation message
          } else {
            throw new Error(response.message || "User registration failed.");
          }
        },
        {
          pending: "Registering...",
          success: "Registration successful!",
          error: "Registration failed.",
        }
      );
    } catch (e: any) {
      // Display the error in a toast
      toast.error(e.message || "There was an error registering the user");
    }
  };

  return (
    <Layout
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Header />

      <Content
        style={{
          flexGrow: 1, // Take up remaining space
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#f0f2f5",
          overflow: "hidden", // Prevent scroll
        }}
      >
        {showConfirmMessage ? (
          <ConfirmMessage email={formData.email} />
        ) : showPasswordForm ? (
          <PasswordForm onBack={handleBack} onSubmit={handleSubmit} />
        ) : (
          <SignUpForm onNext={handleNext} formData={formData} />
        )}
      </Content>
    </Layout>
  );
};

export default SignUp;

SignUp.getLayout = (page: React.ReactElement) => {
  return <>{page}</>;
};