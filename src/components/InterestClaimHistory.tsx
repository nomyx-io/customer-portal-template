import React, { useEffect, useState } from "react";

import { Table } from "antd";
import PubSub from "pubsub-js";

import { useGemforceApp } from "@/context/GemforceAppContext";
import { NomyxEvent } from "@/utils/Constants";

const columns = [
  { title: "Record Id", dataIndex: "objectId" },
  { title: "Date", dataIndex: "createdAt" },
  { title: "Amount", dataIndex: "amount" },
  { title: "Treasury Address", dataIndex: "treasuryAddress" },
];

const InterestClaimHistory = ({ token }: any) => {
  const { appState }: any = useGemforceApp();
  const [withdrawals, setWithdrawals] = useState<any>(token.tokenWithdrawals);

  useEffect(() => {
    if (!withdrawals && appState) {
      const subscription = PubSub.subscribe(NomyxEvent.GemforceStateChange, function (event: any, data: any) {
        if (data.tokenWithdrawals) {
          setWithdrawals(data.tokenWithdrawals);
          PubSub.unsubscribe(subscription);
        }
      });

      appState.selectedToken = token;
      setWithdrawals(appState.tokenWithdrawals);
    }
  }, [appState, token, withdrawals]);

  return <Table rowKey="objectId" columns={columns} dataSource={withdrawals} pagination={false} scroll={{ y: 400 }} />;
};

export default InterestClaimHistory;
