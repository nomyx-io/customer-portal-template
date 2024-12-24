import { MoneyChange } from "iconsax-react";

interface NoHistoryViewProps {
  onTransferInOpen: () => void;
  onTransferOutOpen: () => void;
}

const NoHistoryView: React.FC<NoHistoryViewProps> = ({ onTransferInOpen, onTransferOutOpen }) => {
  return (
    <div className="flex flex-col items-center justify-center">
      <MoneyChange variant="Outline" className="w-60 h-60 text-nomyx-gray3-light dark:text-nomyx-gray3-dark" />
      <h2 className="text-[32px]/[48px] font-semibold mb-4 text-gray-800 dark:text-gray-200">No History to View</h2>
      <p className="text-nomyx-gray1-light dark:text-nomyx-gray1-dark mb-6">Transfer history will be shown here</p>
      <div className="flex gap-4 mt-6">
        <button onClick={onTransferInOpen} className="bg-nomyx-main1-light dark:bg-nomyx-main1-dark text-white text-xs px-4 py-2 rounded-md">
          Transfer In
        </button>
        <button onClick={onTransferOutOpen} className="bg-nomyx-main1-light dark:bg-nomyx-main1-dark text-white text-xs px-4 py-2 rounded-md">
          Transfer Out
        </button>
      </div>
    </div>
  );
};

export default NoHistoryView;
