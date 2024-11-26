import BlockchainService from "./BlockchainService";
import ParseClient from "./ParseService";

export const CarbonCreditService = () => {
  const retireCarbonCredits = async (tokenId: any, amount: any) => {
    await BlockchainService.retireCarbonCredits(tokenId, amount);
  };

  return {
    retireCarbonCredits,
  };
};
