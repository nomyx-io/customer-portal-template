import { ChangeEvent } from "react";

import { SearchNormal1 } from "iconsax-react";

interface SearchAndFilterSectionProps {
  searchTerm: string;
  onSearchChange: (event: ChangeEvent<HTMLInputElement>) => void;
  filterStatus: string;
  onFilterChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  onTransferInOpen: () => void;
  onTransferOutOpen: () => void;
}
const SearchAndFilterSection: React.FC<SearchAndFilterSectionProps> = ({
  searchTerm,
  onSearchChange,
  filterStatus,
  onFilterChange,
  onTransferInOpen,
  onTransferOutOpen,
}) => (
  <div className="flex flex-wrap gap-2 justify-between items-center p-2 rounded-lg bg-nomyx-dark2-light dark:bg-nomyx-dark2-dark text-nomyx-text-light dark:text-nomyx-text-dark">
    {/* Search Bar and Dropdown */}
    <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
      <div className="flex items-center w-full lg:w-64 bg-nomyx-dark1-light dark:bg-nomyx-dark1-dark rounded-sm px-2 py-1">
        <SearchNormal1 size="24" />
        <input
          type="text"
          placeholder="Search Transfers"
          className="bg-nomyx-dark1-light dark:bg-nomyx-dark1-dark ml-2 w-full focus:outline-none"
          onChange={onSearchChange}
          value={searchTerm}
        />
      </div>

      <select
        className="bg-nomyx-dark1-light dark:bg-nomyx-dark1-dark text-nomyx-text-light dark:text-nomyx-text-dark px-2 py-1 rounded-sm w-full lg:w-48"
        onChange={onFilterChange}
        value={filterStatus}
      >
        <option value="all">All Status</option>
        <option value="awaiting_funds">Awaiting Funds</option>
        <option value="funds_received">Funds Recieved</option>
        <option value="payment_submitted">Payment Submitted</option>
        <option value="payment_processed">Payment Processed</option>
        <option value="in_review">In Review</option>
        <option value="returned">Returned</option>
        <option value="refunded">Refunded</option>
        <option value="canceled">Canceled</option>
        <option value="error">Error</option>
      </select>
    </div>

    {/* Transfer Buttons */}
    <div className="flex flex-wrap gap-2 mt-2 lg:mt-0">
      <button
        onClick={onTransferInOpen}
        className="bg-nomyx-main1-light dark:bg-nomyx-main1-dark text-white text-xs px-4 py-2 rounded-md w-full sm:w-auto"
      >
        Transfer In
      </button>
      <button
        onClick={onTransferOutOpen}
        className="bg-nomyx-main1-light dark:bg-nomyx-main1-dark text-white text-xs px-4 py-2 rounded-md w-full sm:w-auto"
      >
        Transfer Out
      </button>
    </div>
  </div>
);

export default SearchAndFilterSection;
