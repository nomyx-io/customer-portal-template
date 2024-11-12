import React, { forwardRef, useImperativeHandle, useRef } from "react";

import { jsPDF } from "jspdf";

// Define a custom type for the ref
export interface UserRecoveryKitRef {
  generatePDF: () => Promise<void>;
}

// Define the props for the component
interface UserRecoveryKitProps {
  username: string;
  credentialId: string;
  secret: string;
}

// Create a ref-forwarding component
const GenerateUserRecoveryKit = forwardRef<UserRecoveryKitRef, UserRecoveryKitProps>(({ username, credentialId, secret }, ref) => {
  const pdfRef = useRef<HTMLDivElement>(null);

  const generatePDF = async () => {
    const element = pdfRef.current;

    if (element) {
      const pdf = new jsPDF("p", "mm", "a4");

      // Set file title (used as the default name if the user saves the document)
      pdf.setProperties({ title: "User Recovery Kit" });

      pdf.html(element, {
        callback: function (doc) {
          doc.autoPrint();
          window.open(doc.output("bloburl"), "_blank");
        },
        x: 10,
        y: 10,
        width: 190,
        windowWidth: element.scrollWidth,
      });
    }
  };

  // Expose the generatePDF function to the parent component
  useImperativeHandle(ref, () => ({
    generatePDF,
  }));

  return (
    <div
      ref={pdfRef}
      style={{
        maxWidth: "28rem",
        margin: "1rem auto",
        padding: "1.5rem",
        backgroundColor: "white",
        borderRadius: "0.5rem",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        border: "1px solid #E5E7EB",
      }}
    >
      <h2
        style={{
          fontSize: "1.25rem",
          fontWeight: "bold",
          color: "#1F2937",
          marginBottom: "1rem",
        }}
      >
        User Recovery Kit
      </h2>
      <p
        style={{
          fontSize: "0.875rem",
          color: "#6B7280",
          marginBottom: "1rem",
        }}
      >
        <span style={{ fontWeight: "600" }}>Created on:</span> {new Date().toLocaleDateString()}
      </p>
      <div style={{ marginBottom: "1rem" }}>
        <label
          style={{
            display: "block",
            fontWeight: "600",
            color: "#374151",
          }}
        >
          Username:
        </label>
        <p style={{ color: "#111827" }}>{username}</p>
      </div>
      <div>
        <label
          style={{
            display: "block",
            fontWeight: "600",
            color: "#374151",
          }}
        >
          Recovery Code:
        </label>
        <p style={{ color: "#111827" }}>{credentialId}</p>
      </div>
      <div>
        <label
          style={{
            display: "block",
            fontWeight: "600",
            color: "#374151",
          }}
        >
          Recovery Key ID:
        </label>
        <p style={{ color: "#111827" }}>{secret}</p>
      </div>
    </div>
  );
});

GenerateUserRecoveryKit.displayName = "GenerateUserRecoveryKit";

export default GenerateUserRecoveryKit;
