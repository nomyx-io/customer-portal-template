import { toast } from "react-toastify";

export const copyToClipboard = (text: string, message: string) => {
  navigator.clipboard.writeText(text);
  toast.success(message);
};

export const truncateAddress = (address: string) => {
  if (address && address.length > 10) {
    return `${address.slice(0, 2)}...${address.slice(-4)}`;
  }
  return address;
};
