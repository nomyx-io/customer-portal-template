import React, { useState } from "react";

import persona from "persona";
import PubSub from "pubsub-js";

import KronosSpin from "@/components/KronosSpin";
import { NomyxEvent } from "@/utils/Constants";

interface PersonaProps {
  templateId: string; // Expecting templateId as a prop
}

export default function Persona({ templateId }: PersonaProps) {
  const [loading, setLoading] = useState(true);

  return (
    <div className="persona-container">
      <div
        className="w-[100%] h-[100%] overflow-hidden absolute top-0 left-0 flex justify-center items-center z-20"
        style={{ backgroundColor: "rgba(0,0,0,0.8)" }}
      >
        <KronosSpin style={{ visibility: loading ? "visible" : "hidden" }} />
      </div>

      <div
        style={{
          position: "relative",
          visibility: loading ? "hidden" : "visible",
        }}
        className="z-40"
      >
        <persona.Inquiry
          templateId={templateId}
          environmentId={process.env.NEXT_PUBLIC_PERSONA_ENVIRONMENT_ID}
          onLoad={() => {
            setLoading(false);
          }}
          onComplete={function (personaResult) {
            // Inquiry completed. Optionally tell your server about it.
            // console.log(`Sending finished inquiry ${inquiryId} to backend`);
            PubSub.publish(NomyxEvent.PersonaVerified, personaResult);
          }}
        />
      </div>
    </div>
  );
}
