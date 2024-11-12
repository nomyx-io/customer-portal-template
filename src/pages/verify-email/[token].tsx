"use client";

import React, { useEffect, useRef } from "react";

import { useRouter } from "next/navigation";
import Parse from "parse";
import { toast } from "react-toastify";

import NotificationCard from "../../components/global/NotificationCard";

const VerifyEmailPage = ({ token }: { token: string }) => {
  const router = useRouter();
  const hasRun = useRef(false); // Prevent multiple calls

  useEffect(() => {
    if (!hasRun.current) {
      hasRun.current = true; // Mark that this block has run once
      Parse.Cloud.run("retrieveEmailFromToken", { token })
        .then((emailResponse: any) => {
          if (emailResponse.success && emailResponse.email) {
            // Call the verifyEmail cloud function after retrieving the email
            const email = emailResponse.email;
            Parse.Cloud.run("verifyEmail", { token })
              .then((verifyResponse: any) => {
                if (verifyResponse.success) {
                  toast.success("Email verified successfully!");
                  // Pass email as a query param to the onboarding component
                  const onboardingUrl = `/onboarding?email=${encodeURIComponent(email)}`;
                  // Redirect to onboarding after a short delay
                  setTimeout(() => {
                    router.push(onboardingUrl);
                  }, 3000);
                } else {
                  toast.error(verifyResponse.message || "Verification failed.");
                  // Redirect to the homepage after a delay
                  setTimeout(() => {
                    router.push("/");
                  }, 3000);
                }
              })
              .catch((error: any) => {
                console.error("Verification error:", error);
                toast.error("An error occurred during verification.");
                // Redirect to the homepage after a delay
                setTimeout(() => {
                  router.push("/");
                }, 3000);
              });
          } else {
            toast.error(emailResponse.message || "Email retrieval failed.");
            // Redirect to the homepage after a delay
            setTimeout(() => {
              router.push("/");
            }, 3000);
          }
        })
        .catch((error: any) => {
          console.error("Error retrieving email:", error);
          toast.error("An error occurred while retrieving the email.");
          // Redirect to the homepage after a delay
          setTimeout(() => {
            router.push("/");
          }, 3000);
        });
    }
  }, [token, router]);

  return (
    <NotificationCard title="Verifying Email...">
      <p className="mb-4 text-center text-nomyxWhite font-normal text-base">Please wait while we verify your email.</p>
    </NotificationCard>
  );
};

export default VerifyEmailPage;

// Define getServerSideProps
export const getServerSideProps = async (context: { params: { token: string } }) => {
  const { params } = context;

  // Check if params exists and has the token property
  if (params && typeof params.token === "string") {
    return {
      props: { token: params.token }, // Pass it as props to the page
    };
  }

  // Handle the case where token is not available
  return {
    notFound: true, // This will trigger a 404 page
  };
};
