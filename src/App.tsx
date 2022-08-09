import React from "react";
import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/ethereum-provider";
import { Contract, providers, utils } from "ethers";

// @ts-ignore
import logo from "./logo.svg";
import "./App.css";
import { formatAuthMessage } from "./utils";
import { DAI } from "./constants";

let REACT_APP_INFURA_ID = "87S6H45F20KHG753VB5Q";

function App() {
  const web3Modal = new Web3Modal({
    network: "mainnet",
    cacheProvider: true,
    providerOptions: {
      walletconnect: {
        package: WalletConnectProvider,
        options: {
          infuraId: REACT_APP_INFURA_ID,
        },
      },
    },
  });

  const [chainId, setChainId] = React.useState<number>(1);
  const [address, setAddress] = React.useState<string>("");
  const [provider, setProvider] = React.useState<providers.Web3Provider>();

  function accountsChanged(accounts: string[]) {
    console.log("accountsChanged", accounts);
    setAddress(accounts[0]);
  }

  function chainChanged(chainId: number) {
    console.log("chainChanged", chainId);
    setChainId(chainId);
  }

  function reset() {
    console.log("reset");
    setAddress("");
    setProvider(undefined);
    web3Modal.clearCachedProvider();
  }

  async function connect() {
    if (!REACT_APP_INFURA_ID) {
      throw new Error("Missing Infura Id");
    }
    const web3Provider = await web3Modal.connect();
    
    web3Provider.on("accountsChanged", accountsChanged);
    web3Provider.on("chainChanged", chainChanged);
    web3Provider.on("disconnect", reset);

    const accounts = (await web3Provider.enable()) as string[];
    setAddress(accounts[0]);
    setChainId(web3Provider.chainId);

    const provider = new providers.Web3Provider(web3Provider);
    setProvider(provider);
  }

  async function signMessage() {
    if (!provider) {
      throw new Error("Provider not connected");
    }
    const msg = formatAuthMessage(address, chainId);
    const sig = await provider.send("personal_sign", [msg, address]);
    console.log("Signature", sig);
    console.log("isValid", utils.verifyMessage(msg, sig) === utils.getAddress(address));
  }

  async function transferDai() {
    if (!provider) {
      throw new Error("Provider not connected");
    }
    const contract = new Contract(DAI.address, DAI.abi, provider.getSigner());
    const res = await contract.transfer(address, utils.parseEther("1"));
    console.log("res", res);
  }

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <div>{provider ? "Connected!" : "Not connected"}</div>
        {address ? (
          <>
            <div>{address}</div>
            <button onClick={signMessage}>Authenticate</button>
            <button onClick={transferDai}>Transfer DAI</button>
          </>
        ) : (
          <button onClick={connect}>Connect</button>
        )}
      </header>
    </div>
  );
}

export default App;
