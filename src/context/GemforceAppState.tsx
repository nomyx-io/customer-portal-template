import PubSub from "pubsub-js";

import KronosCustomerService from "@/services/KronosCustomerService";
import { NomyxEvent } from "@/utils/Constants";

export type Token = {
  tokenId: number;
  objectId: string;
  deposits: any;
  tokenWithdrawals: any;
  attributes: Array<[string, string, string]>;
};

class GemforceAppState {
  _session: any;
  _tokens: Token[] | undefined = undefined;
  _retiredTokens: Token[] | null = null;
  _deposits: any = null;
  _withdrawals: any = null;
  _userWithdrawals: any = null;
  _tokenWithdrawals: any = null;
  _portfolioPerformance: any[] | null = null;
  _events: any = null;
  _selectedToken: Token | null = null;
  _activity: any = null;
  _listings: any = null;
  _sales: any = null;
  _listingTokens: Token[] | null = null;
  _carouselStart: any = null;

  constructor(session: any) {
    this._session = session;
  }

  get tokens() {
    if (!this._tokens) {
      const user = this.session?.user;
      KronosCustomerService.getTokensForUser(user?.walletAddress).then(async (ts) => {
        PubSub.publish(NomyxEvent.GemforceStateChange, { tokens: ts });
        this._tokens = ts;
        return ts;
      });
    }

    return this._tokens;
  }

  async refreshTokens() {
    const user = this.session?.user;
    if (user) {
      // Force reload tokens by setting _tokens to null
      this._tokens = undefined;
      // Trigger loading of tokens
      const ts = await KronosCustomerService.getTokensForUser(user?.walletAddress);
      PubSub.publish(NomyxEvent.GemforceStateChange, { tokens: ts });
      this._tokens = ts;
    }
  }

  set tokens(tokens: any) {
    this._tokens = tokens;
  }

  get retiredTokens() {
    if (!this._retiredTokens) {
      const user = this.session?.user;
      KronosCustomerService.getRetiredTokensForUser(user?.walletAddress).then(async (ts) => {
        PubSub.publish(NomyxEvent.GemforceStateChange, { retiredTokens: ts });
        this._retiredTokens = ts;
        return ts;
      });
    }

    return this._retiredTokens;
  }

  set retiredTokens(tokens: any) {
    this._retiredTokens = tokens;
  }

  get deposits() {
    if (!this._selectedToken?.deposits) {
      if (!this._selectedToken) throw new Error("set the selectedToken in the appState to get deposits for it");
      KronosCustomerService.getDepositsForToken(this._selectedToken?.objectId).then((ds) => {
        PubSub.publish(NomyxEvent.GemforceStateChange, { deposits: ds });
        this._deposits = ds;
        if (this._selectedToken) this._selectedToken.deposits;

        return ds;
      });
    }

    return this._deposits;
  }

  set deposits(deposits: any) {
    this._deposits = deposits;
  }

  get withdrawals() {
    if (!this._withdrawals && this.tokens) {
      KronosCustomerService.getWithdrawals(this.tokens.map((t: any) => t.objectId)).then((ws: any) => {
        PubSub.publish(NomyxEvent.GemforceStateChange, { withdrawals: ws });
        this._withdrawals = ws;
        return ws;
      });
    }

    return this._withdrawals;
  }

  set withdrawals(withdrawals: any) {
    this._withdrawals = withdrawals;
  }

  get userWithdrawals() {
    debugger;
    if (!this._userWithdrawals) {
      const user = this.session?.user;
      KronosCustomerService.getWithdrawalsForUser(user?.walletAddress).then((ws: any) => {
        PubSub.publish(NomyxEvent.GemforceStateChange, { userWithdrawals: ws });
        this._userWithdrawals = ws;
        return ws;
      });
    }
    return this._userWithdrawals;
  }

  set userWithdrawals(withdrawals: any) {
    this._userWithdrawals = withdrawals;
  }

  get tokenWithdrawals() {
    if (!this._selectedToken?.tokenWithdrawals) {
      if (!this._selectedToken) throw new Error("set the selectedToken in the appState to get deposits for it");
      KronosCustomerService.getWithdrawalsForToken(this._selectedToken?.objectId).then((ws) => {
        PubSub.publish(NomyxEvent.GemforceStateChange, { tokenWithdrawals: ws });
        this._tokenWithdrawals = ws;
        if (this._selectedToken) this._selectedToken.tokenWithdrawals;
        return ws;
      });
    }

    return this._deposits;
  }

  set tokenWithdrawals(tokenWithdrawals: any) {
    this._tokenWithdrawals = tokenWithdrawals;
  }

  get portfolioPerformance() {
    const user = this.session?.user;

    if (user && this.tokens && !this._portfolioPerformance) {
      KronosCustomerService.getPortfolioPerformance(user.walletAddress).then((pps: any) => {
        PubSub.publish(NomyxEvent.GemforceStateChange, {
          portfolioPerformance: pps,
        });
        this._portfolioPerformance = pps;
        return pps;
      });
    }

    return this._portfolioPerformance;
  }

  set portfolioPerformance(portfolioPerformance: any) {
    this._portfolioPerformance = portfolioPerformance;
  }

  get listings() {
    if (!this._listings) {
      KronosCustomerService.getListings().then(async (ls) => {
        PubSub.publish(NomyxEvent.GemforceStateChange, { listings: ls });
        this._listings = ls;
        return ls;
      });
    }

    return this._listings;
  }

  set listings(listings: any) {
    this._listings = listings;
  }

  get sales() {
    const user = this.session?.user;
    if (user && !this._sales) {
      KronosCustomerService.getSales(user?.walletAddress).then(async (ss) => {
        PubSub.publish(NomyxEvent.GemforceStateChange, { sales: ss });
        this._sales = ss;
        return ss;
      });
    }

    return this._sales;
  }

  set sales(sales: any) {
    this._sales = sales;
  }

  get selectedToken(): Token | null {
    return this._selectedToken;
  }

  set selectedToken(token: Token) {
    this._selectedToken = token;
  }

  get session() {
    return this._session;
  }

  set session(session) {
    this._session = session;
  }

  get carouselStart() {
    return this._carouselStart;
  }

  set carouselStart(value: any) {
    this._carouselStart = value;
  }
}

export default GemforceAppState;
