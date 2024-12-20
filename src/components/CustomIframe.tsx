import React, { useEffect } from "react";

interface CustomIframeProps {
  src: string;
  onComplete: (data: any) => void;
}

const CustomIframe: React.FC<CustomIframeProps> = ({ src, onComplete }) => {
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== new URL(src).origin) {
        return;
      }

      if (event.data && event.data.signedAgreementId) {
        onComplete(event.data);
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [src, onComplete]);

  return (
    <iframe
      src={src}
      title="Custom Iframe"
      className="w-full h-[500px] border rounded-lg"
      sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
    ></iframe>
  );
};

export default CustomIframe;
