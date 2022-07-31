import React, { useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
    LedgerWalletAdapter,
    PhantomWalletAdapter,
    SlopeWalletAdapter,
    SolflareWalletAdapter,
    SolletExtensionWalletAdapter,
    SolletWalletAdapter,
    TorusWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';

import Home from './pages/Home/Home';
import 'bootstrap/dist/css/bootstrap.min.css';
import './assets/css/main.css';
import Marketplace from './pages/Marketplace/Marketplace';
import Account from './pages/Account';
import Buy from './pages/Buy/Buy';
import Sell from './pages/Sell';
import Mint from './pages/Mint';
import Base from './components/Base/Base';
import { useStore } from './zustand';

// Default styles that can be overridden by your app
require('@solana/wallet-adapter-react-ui/styles.css');

const App = () => {
    // Can be set to 'devnet', 'testnet', or 'mainnet-beta'
    const network = process.env.REACT_APP_CLUSTER || WalletAdapterNetwork.Devnet;
    const { isExpended } = useStore();
    console.log(isExpended)

    // You can also provide a custom RPC endpoint
    // const endpoint = 'https://blue-delicate-wildflower.solana-mainnet.quiknode.pro/2f054b4c3a7d3f8841b584875204e3aa7c42d8ab/';
    // const endpoint = clusterApiUrl(network);
    // let endpoint = 'https://solana-api.projectserum.com';
    const endpoint = useMemo(() => clusterApiUrl(network), [network]);
    // @solana/wallet-adapter-wallets includes all the adapters but supports tree shaking --
    // Only the wallets you configure here will be compiled into your application
    const wallets = useMemo(
        () => [
            new PhantomWalletAdapter(),
            new SlopeWalletAdapter(),
            new SolflareWalletAdapter({ network }),
            new TorusWalletAdapter(),
            new LedgerWalletAdapter(),
            new SolletWalletAdapter({ network }),
            new SolletExtensionWalletAdapter({ network }),
        ],
        [network]
    );

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <Router>
                    <Base />
                    <div className={"main" + (isExpended ? '' : ' collapsed')}>
                        <Routes>
                            <Route exact path="/" element={<Home />} />
                            <Route exact path="/marketplace" element={<Marketplace />} />
                            <Route exact path="/account" element={<Account />} />
                            <Route exact path="/buy/:mint" element={<Buy />} />
                            <Route exact path="/sell/:mint" element={<Sell />} />
                            <Route exact path="/mint" element={<Mint />} />
                        </Routes>
                    </div>
                </Router>
            </WalletProvider>

            <div className="container-fluid bg-dark text-center py-2 footer">
                <span>Copyright &copy; 2022 PT Komodo Legends Interaktif</span>
            </div>

        </ConnectionProvider>
    );
};

export default App;