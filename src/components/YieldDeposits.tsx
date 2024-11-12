import React, { useEffect, useState } from "react";

import { Table } from "antd/es";
import PubSub from "pubsub-js";

import { useGemforceApp } from "@/context/GemforceAppContext";
import { NomyxEvent } from "@/utils/Constants";

const columns = [
  //deposit columns
  {
    title: "Record Id",
    dataIndex: "objectId",
  },
  {
    title: "Deposit Id",
    dataIndex: ["deposit", "objectId"],
  },
  {
    title: "Deposit Amount",
    dataIndex: "amount",
  },
  {
    title: "Created Date",
    dataIndex: "createdAt",
  },
];

const YieldDeposits = ({ token }: any) => {
  const { appState }: any = useGemforceApp();
  const [deposits, setDeposits] = useState<any>(token.deposits);

  useEffect(() => {
    //fetch deposit data
    //check for deposits on token
    //if no token deposits, fetch tokens for deposit
    if (!deposits && appState) {
      const subscription = PubSub.subscribe(NomyxEvent.GemforceStateChange, function (event: any, data: any) {
        if (data.deposits) {
          setDeposits(data.deposits);
          PubSub.unsubscribe(subscription);
        }
      });

      appState.selectedToken = token;
      setDeposits(appState.deposits);
    }
  }, [appState, deposits, token]);

  return <Table rowKey="depositId" columns={columns} dataSource={deposits} pagination={false} scroll={{ y: 400 }}></Table>;
};

export default YieldDeposits;
