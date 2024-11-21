// OnboardingComponent.tsx
import React from "react";
import { useEffect, useState } from "react";

import { Tabs, Card } from "antd";
import { InfoCircle, DocumentText, Personalcard, WalletAdd1, UserTick } from "iconsax-react";
import { useRouter } from "next/router";
import Parse from "parse";
import { toast } from "react-toastify";

import AboutUs from "@/components/onboarding/about-us";
import AccountActivation from "@/components/onboarding/account-activation";
import IDVerification from "@/components/onboarding/id-verification";
import TermsConditions from "@/components/onboarding/terms-conditions";
import WalletSetup from "@/components/onboarding/wallet-setup";
import { Registration } from "@/utils/Constants";

interface Tab {
  key: string;
  label: string;
  icon: JSX.Element;
  content: JSX.Element;
}

const OnboardingComponent = () => {
  const [activeTab, setActiveTab] = useState<string>("about");
  const router = useRouter();
  const { email } = router.query; // Retrieve the email from query params
  const [userEmail, setUserEmail] = useState<string | undefined>(undefined);
  const [registration, setRegistration] = useState<Registration>({
    termsAccepted: null,
  });
  const [agreed, setAgreed] = useState(false);
  useEffect(() => {
    // Only set userEmail if it exists in the query params
    if (email) {
      setUserEmail((email as string).toLowerCase()); // Convert email to lowercase first
    }
  }, [email]);

  const submitRegistration = async () => {
    try {
      const { recoveryKey, ...updatesWithoutRecoveryKey } = {
        ...registration,
        email: userEmail,
        username: userEmail,
      };

      setRegistration(updatesWithoutRecoveryKey);

      // Send the request to the server-side API route, including recoveryKey
      const response = await fetch("/api/submitRegistration", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userEmail,
          registration: updatesWithoutRecoveryKey,
          recoveryKey, // Include recoveryKey in the request body
        }),
      });

      const data = await response.json();

      if (response.ok && data.message) {
        setActiveTab("accountActivation"); // Set to the next tab key
      } else {
        toast.error("Failed to onboard");
      }
    } catch (error) {
      toast.error("Failed to onboard: " + error);
      console.error("Failed to onboard:", error);
    }
  };

  const setPersonaReferenceId = async (inquiryId: string) => {
    try {
      const response = await fetch("/api/updatePersonaReferenceId", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userEmail,
          inquiryId,
        }),
      });
      const data = await response.json();
    } catch (error) {
      toast.error("Failed to submit to Persona: " + error);
      console.error("Failed to onboard:", error);
    }
  };

  // Define an array of tab configuration
  const tabs: Tab[] = [
    {
      key: "about",
      label: "About Us",
      icon: <InfoCircle className="text-[#626262]" />,
      content: <AboutUs setActiveTab={setActiveTab} />, // Pass setActiveTab to AboutUs
    },
    {
      key: "terms",
      label: "Terms & Conditions",
      icon: <DocumentText className="text-[#626262]" />,
      content: (
        <TermsConditions
          setActiveTab={setActiveTab}
          setRegistration={setRegistration}
          agreed={agreed} // Pass down the agreed state
          setAgreed={setAgreed} // Pass down the function to update agreed state
        />
      ),
    },
    {
      key: "idVerification",
      label: "ID Verification",
      icon: <Personalcard className="text-[#626262]" />,
      content: (
        <IDVerification
          setActiveTab={setActiveTab}
          setRegistration={setRegistration}
          registration={registration}
          onPersonaVerified={setPersonaReferenceId}
        />
      ),
    },
    {
      key: "walletSetup",
      label: "Wallet Setup",
      icon: <WalletAdd1 className="text-[#626262]" />,
      content: <WalletSetup setActiveTab={setActiveTab} setRegistration={setRegistration} onSubmit={submitRegistration} email={userEmail} />,
    },
    {
      key: "accountActivation",
      label: "Account Activation",
      icon: <UserTick className="text-[#626262]" />,
      content: <AccountActivation />,
    },
  ];

  // Get the index of the active tab
  const activeTabIndex = tabs.findIndex((tab) => tab.key === activeTab);

  // Function to handle tab change
  const handleTabChange = (key: string) => {
    const newTabIndex = tabs.findIndex((tab) => tab.key === key);

    // Allow navigation only if moving backward or to the current tab
    if (newTabIndex <= activeTabIndex) {
      setActiveTab(key);
    }
  };

  return (
    <div
      className="relative w-full min-h-screen overflow-hidden flex flex-col items-center"
      style={{
        backgroundImage: "url('/images/nomyx_banner.svg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <Card className="h-[100px] w-[90%] max-w-[1400px] mt-5 onboarding-header-card bg-[#F1F5F9]">
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange} // Use the custom handler
          centered
          tabBarStyle={{ borderBottom: "none" }}
        >
          {tabs.map((tab) => (
            <Tabs.TabPane
              key={tab.key}
              tab={
                <div className="flex flex-col items-center relative">
                  {tab.icon}
                  <span className="text-[#626262]">{tab.label}</span>
                  {/* Show dot only if the tab is NOT active */}
                  {activeTab !== tab.key && <span className="dot absolute bottom-[-20px] text-3xl text-[#409C43]">•</span>}
                </div>
              }
            />
          ))}
        </Tabs>
      </Card>

      <Card className="flex-grow mt-5 w-[90%] max-w-[1400px] overflow-auto mb-5 bg-[#3E81C833]">
        <div>{tabs.find((tab) => tab.key === activeTab)?.content}</div>
      </Card>
    </div>
  );
};

export default OnboardingComponent;

OnboardingComponent.getLayout = (page: React.ReactElement) => {
  return <>{page}</>;
};
