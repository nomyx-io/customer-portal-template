import { LinkSquare } from "iconsax-react";

interface WelcomeScreenProps {
  onOpenModal: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onOpenModal }) => (
  <div className="flex flex-col text-nomyx-text-light dark:text-nomyx-text-dark h-[80%] text-xl items-center justify-center w-full grow">
    <LinkSquare variant="Outline" className="w-60 h-60 text-nomyx-gray3-light dark:text-nomyx-gray3-dark" />
    <h2 className="text-[32px]/[48px] font-semibold mb-4 text-gray-800 dark:text-gray-200">Welcome!</h2>
    <p className="text-nomyx-gray1-light dark:text-nomyx-gray1-dark mb-6">
      In order to benefit from our Bridge Transfer service, please create an account through the KYC process.
    </p>
    <button className="bg-nomyx-main1-light dark:bg-nomyx-main1-dark text-white text-xs px-4 py-2 rounded-md" onClick={onOpenModal}>
      Create Account
    </button>
  </div>
);

export default WelcomeScreen;
