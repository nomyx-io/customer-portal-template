import { useEffect, useState } from "react";

import { Modal } from "antd";
import dynamic from "next/dynamic";
import Parse from "parse";

interface BridgePersonaVerificationModalProps {
  personaLink: string;
  onComplete: (data: any) => void;
}

const PersonaVerificationModal: React.FC<BridgePersonaVerificationModalProps> = ({ personaLink, onComplete }) => {
  const [inquiryTemplateId, setInquiryTemplateId] = useState<string | null>(null);
  const [environmentId, setEnvironmentId] = useState<string | null>(null);
  const [developerId, setDeveloperId] = useState<string | null>(null);
  const [iqtToken, setIqtToken] = useState<string | null>(null);
  const [referenceId, setReferenceId] = useState<string | null>(null);

  const Persona = dynamic(() => import("@/components/Persona"), {
    ssr: false,
  });

  useEffect(() => {
    const getKycLink = async () => {
      console.log("Getting KYC link status in PersonaVerificationModal");
      console.log("Persona Link in PersonaVerificationModal:", personaLink);
      try {
        const currentUser = Parse.User.current();

        console.log("Current User in PersonaVerificationModal:", currentUser);
        if (!currentUser) {
          throw new Error("User not found");
        }

        const kycLinkId = currentUser.get("kycId");
        console.log("KYC Link ID in PersonaVerificationModel:", kycLinkId);

        if (!kycLinkId) return;

        const response = await Parse.Cloud.run("getKycLinkStatus", {
          kyc_link_id: kycLinkId,
        });

        console.log("KYC Link Status in PersonaVerificationModel:", response);

        let modifiedKycLink = response.kyc_link.replace("/verify?", "/widget?");
        modifiedKycLink += `&iframe-origin=${encodeURIComponent(window.location.origin)}`;

        console.log("KYC Link:", modifiedKycLink);

        const personaLink = new URL(response.kyc_link);

        const templateId = personaLink.searchParams.get("inquiry-template-id");
        const environmentId = personaLink.searchParams.get("environment-id");
        const developerId = personaLink.searchParams.get("fields[developer_id]");
        const iqtToken = personaLink.searchParams.get("fields[iqt_token]");
        const referenceId = personaLink.searchParams.get("reference-id");

        console.log("Template ID:", templateId);
        console.log("Environment ID:", environmentId);
        console.log("Developer ID:", developerId);
        console.log("IQT Token:", iqtToken);
        console.log("Reference ID:", referenceId);

        if (templateId && developerId && iqtToken && referenceId) {
          console.log("Setting template ID:", templateId);
          setInquiryTemplateId(templateId);
          setEnvironmentId(environmentId);
          setDeveloperId(developerId);
          setIqtToken(iqtToken);
          setReferenceId(referenceId);
        }
      } catch (error) {
        console.error("Failed to get KYC link status:", error);
      }
    };

    getKycLink();
  }, [personaLink]);

  return (
    <div className="persona-container">
      <Modal
        open={true}
        footer={null}
        centered
        className="!p-0 id-verification-modal"
        style={{
          maxWidth: "90%",
          margin: "0 auto",
          height: "750px",
          overflowY: "auto",
        }}
        maskClosable={false}
        closable={false}
      >
        <div className="p-4">
          {inquiryTemplateId && developerId && iqtToken && referenceId && (
            <Persona
              templateId={inquiryTemplateId}
              environmentId={environmentId || ""}
              developerId={developerId}
              iqtToken={iqtToken}
              referenceId={referenceId}
              onComplete={onComplete}
            />
          )}
        </div>
      </Modal>
    </div>
  );
};

export default PersonaVerificationModal;
