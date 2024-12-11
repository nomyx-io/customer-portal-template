import React, { useState } from "react";

import persona from "persona";
import PubSub from "pubsub-js";

import KronosSpin from "@/components/KronosSpin";
import { NomyxEvent } from "@/utils/Constants";

interface PersonaProps {
  templateId: string;
  environmentId?: string;
  developerId?: string;
  iqtToken?: string;
  referenceId?: string;
  onComplete?: (result: any) => void;
}

export default function Persona({ templateId, environmentId, developerId, iqtToken, referenceId, onComplete }: PersonaProps) {
  const [loading, setLoading] = useState(true);

  const effectiveEnvironmentId = environmentId || process.env.NEXT_PUBLIC_PERSONA_ENVIRONMENT_ID;

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
          environmentId={effectiveEnvironmentId}
          fields={{
            ...(developerId && { developer_id: developerId }),
            ...(iqtToken && { iqt_token: iqtToken }),
          }}
          referenceId={referenceId}
          onLoad={() => {
            setLoading(false);
          }}
          onComplete={function (personaResult) {
            if (onComplete) {
              onComplete(personaResult);
            } else {
              PubSub.publish(NomyxEvent.PersonaVerified, personaResult);
            }
          }}
        />
      </div>
    </div>
  );
}
