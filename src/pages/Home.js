import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SolanaCoinImg from "../assets/img/solana-coin.webp"
import KomoCoinImg from "../assets/img/komo-coin.webp"
import KomoNftImg from "../assets/img/komo-nft.webp"

import * as anchor from "@project-serum/anchor";
import { useConnection, useWallet } from '@solana/wallet-adapter-react';

import axios from 'axios'
import { getStorePDA, getEscrowPDA } from '../app/api/js/getPDAs'
import { marketplacePDA, mintPubkey } from '../app/api/config'

const Home = () => {

    const { connection } = useConnection();

    const [activeTab, setActiveTab] = useState(0);
    const [coinInfos, setCoinInfos] = useState({
        totalSales: 0,
        totalSolVolume: 0,
        totalKomoVolume: 0,
        nftSold: 0
    })
    const [buyList, setBuyList] = useState([]);
    const [recentTransactions, setRecentTransactions] = useState([]);

    const [totalSales, setTotalSales] = useState(0);
    const [soldKomo, setSoldKomo] = useState(0);


    const getAllTransactionCount = async () => {
        let count = 0;
        try {
            count = await axios.get('https://api.komoverse.io/v1/transaction/all')
        } catch (error) {
            console.log(error);
        }

        // console.log(count, "count");
        setTotalSales(count.data);
    }
    const getNFTTransactionCount = async () => {
        let count = 0;
        try {
            count = await axios.get('https://api.komoverse.io/v1/transaction/nft')
        } catch (error) {
            console.log(error);
        }

        // console.log(count, "nft count");
        setSoldKomo(count.data);
    }
    const getItemsTransactionCount = async () => {
        let count = 0;
        try {
            count = await axios.get('https://api.komoverse.io/v1/transaction/items')
        } catch (error) {
            console.log(error);
        }

        // console.log(count, "items count");
        // setSoldKomo(count.data);
    }

    const getAllBalances = async () => {
        const [storePubkey, storeNonce] = await getStorePDA(marketplacePDA);
        console.log(storePubkey.toBase58(), "storePubkey");
        console.log(connection, "connection");
        try {
            let storeBalance = await connection.getBalance(storePubkey);
            console.log(storeBalance, "storeBalance")
        } catch (error) {
            console.log(error, "error")            
        }
    }

    useEffect(() => {
        setCoinInfos((prevState) => ({
            ...prevState
        }))

        return () => {

        }
    }, [activeTab])

    useEffect(() => {
        console.log("jkl")

        getAllTransactionCount();
        getNFTTransactionCount();
        getItemsTransactionCount();

        getAllBalances();

        setBuyList([
            {
                mint: "111111"
            }
        ])
        setRecentTransactions([
            {
                seller: 'Aviabee',
                buyer: 'Kazky',
                sellerAddr: 'BwkQ...prW7',
                buyerAddr: 'XS83...Ds2S',
                tradeTime: '4 mins ago',
                price: '4.5 SOL'
            }
        ])


    }, [])

    return (
        <div className="main">
            <div className="container">
                <div className="row mt-5">
                    <div className="col-12 py-3 px-0 white-box">
                        <ul className="nav nav-pills mb-3 border-bottom" id="pills-tab" role="tablist">
                            <li className="nav-item ms-3" role="presentation">
                                <button className={"nav-link" + (activeTab === 0 ? ' active' : '')} id="pills-24h-tab" onClick={() => setActiveTab(0)}>Last 24h</button>
                            </li>
                            <li className="nav-item" role="presentation">
                                <button className={"nav-link" + (activeTab === 1 ? ' active' : '')} id="pills-7-tab" onClick={() => setActiveTab(1)}>7 days</button>
                            </li>
                            <li className="nav-item" role="presentation">
                                <button className={"nav-link" + (activeTab === 2 ? ' active' : '')} id="pills-30-tab" onClick={() => setActiveTab(2)}>30 days</button>
                            </li>
                            <li className="nav-item" role="presentation">
                                <button className={"nav-link" + (activeTab === 3 ? ' active' : '')} id="pills-365-tab" onClick={() => setActiveTab(3)}>365 days</button>
                            </li>
                        </ul>
                        <div className="tab-content py-3 px-4" id="pills-tabContent">
                            <div className="tab-pane fade show active" id="pills-24h">
                                <div className="row">
                                    <div className="col-12 col-md-6 col-lg-3">
                                        <div className="row">
                                            <div className="col-4">
                                                <i className="fas fa-chart-line dash-circle"></i>
                                            </div>
                                            <div className="col-8">
                                                <span className="dash-sm">Total Sales</span>
                                                <span className="dash-lg">{totalSales}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-12 col-md-6 col-lg-3">
                                        <div className="row">
                                            <div className="col-4">
                                                <img src={SolanaCoinImg} alt="Komoverse (Komodo Metaverse) Solana Coin Logo" />
                                            </div>
                                            <div className="col-8">
                                                <span className="dash-sm">Total Volume (SOL)</span>
                                                <span className="dash-lg">{coinInfos.totalSolVolume}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-12 col-md-6 col-lg-3">
                                        <div className="row">
                                            <div className="col-4">
                                                <img src={KomoCoinImg} alt="Komoverse (Komodo Metaverse) Coin Logo" />
                                            </div>
                                            <div className="col-8">
                                                <span className="dash-sm">Total Volume (KOMO)</span>
                                                <span className="dash-lg">{coinInfos.totalKomoVolume}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-12 col-md-6 col-lg-3">
                                        <div className="row">
                                            <div className="col-4">
                                                <img src={KomoNftImg} alt="Komoverse (Komodo Metaverse) NFT Logo" />
                                            </div>
                                            <div className="col-8">
                                                <span className="dash-sm">Komodo Sold</span>
                                                <span className="dash-lg">{soldKomo}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="container mb-5">
                <div className="row mt-3">
                    <div className="col-12 col-lg-6">
                        <h4>Recently Listed</h4>
                        <div className="white-box">
                            {
                                buyList.map((buyItem, ind) => <Link to={'/buy/' + buyItem.mint} key={ind}><div className="row py-2 px-0 mx-0 listed-box">
                                    <div className="col-lg-2">
                                        <img src={KomoNftImg} alt="Komoverse (Komodo Metaverse) NFT" />
                                    </div>
                                    <div className="col-lg-3">
                                        <span className="form-control border-success badge bg-success p-0">
                                            <b>#9985</b>
                                        </span>
                                        <span className="listed-sm">Breed Count: 0</span>
                                    </div>
                                    <div className="col-lg-4 p-0">
                                        <div className="row m-0">
                                            <div className="col p-1">
                                                <img src={KomoCoinImg} alt="Komoverse (Komodo Metaverse) NFT Attributes" className="mini-icon" />
                                            </div>
                                            <div className="col p-1">
                                                <img src={KomoCoinImg} alt="Komoverse (Komodo Metaverse) NFT Attributes" className="mini-icon" />
                                            </div>
                                            <div className="col p-1">
                                                <img src={KomoCoinImg} alt="Komoverse (Komodo Metaverse) NFT Attributes" className="mini-icon" />
                                            </div>
                                            <div className="col p-1">
                                                <img src={KomoCoinImg} alt="Komoverse (Komodo Metaverse) NFT Attributes" className="mini-icon" />
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <span className="listed-sm">Listed: less than 1 min ago</span>
                                        </div>
                                    </div>
                                    <div className="col-lg-3">
                                        <div className="row">
                                            <div className="col-3 p-1">
                                                <img src={SolanaCoinImg} alt="" />
                                            </div>
                                            <div className="col-9 p-1">
                                                <span className="listed-price">4.5 SOL</span>
                                            </div>
                                        </div>
                                        <div className="row">
                                            <div className="col-3 p-1">
                                                <img src={KomoCoinImg} alt="" />
                                            </div>
                                            <div className="col-9 p-1">
                                                <span className="listed-price">225 KOMO</span>
                                            </div>
                                        </div>
                                    </div>
                                </div></Link>)
                            }
                        </div>
                    </div>
                    <div className="col-12 col-lg-6">
                        <h4>Recent Transaction</h4>
                        <div className="white-box">
                            {
                                recentTransactions.map((recentTransaction, ind) =>
                                    <div className="row py-2 px-0 mx-0 listed-box" key={ind}>
                                        <div className="col-lg-2">
                                            <img src={KomoNftImg} alt="Komoverse (Komodo Metaverse) NFT" />
                                        </div>
                                        <div className="col-lg-10">
                                            <div className="row">
                                                <div className="col-lg-3 p-0">
                                                    <span className="form-control border-success badge bg-success p-0">
                                                        <b>#9985</b>
                                                    </span>
                                                </div>
                                                <div className="col-lg-6 px-1">
                                                    <div className="row">
                                                        <div className="col-5">Seller</div>
                                                        <div className="col-1 p-0"></div>
                                                        <div className="col-6">Buyer</div>
                                                    </div>
                                                    <div className="row">
                                                        <div className="col-5">Aviabee</div>
                                                        <div className="col-1 p-0">&gt;</div>
                                                        <div className="col-6">Kazky</div>
                                                    </div>
                                                </div>
                                                <div className="col-lg-3">
                                                    <div className="row">
                                                        <div className="col-3 p-1">
                                                            <img src={SolanaCoinImg} alt="" />
                                                        </div>
                                                        <div className="col-9 p-1">
                                                            <span className="listed-price">4.5 SOL</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="row listed-sm">
                                                <div className="col-lg-3 p-0">
                                                    <span>Breed Count: 0</span>
                                                </div>
                                                <div className="col-lg-6 px-1">
                                                    <div className="row">
                                                        <div className="col-5">BwkQ...prW7</div>
                                                        <div className="col-1 p-0"></div>
                                                        <div className="col-6">XS83...Ds2S</div>
                                                    </div>
                                                </div>
                                                <div className="col-lg-3">
                                                    4 mins ago
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;