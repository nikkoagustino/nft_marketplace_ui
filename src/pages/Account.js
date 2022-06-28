import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import CardDrawImg from "../assets/img/items/card-draw.png";

import axios from "axios";

import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { collectionPubkey, itemCollectionPubkey } from "../app/api/config";

import {
    getParsedNftAccountsByOwner,
    isValidSolanaAddress,
} from "@nfteyez/sol-rayz";

const opts = {
    preflightCommitment: "processed"
}


const Account = () => {

    const { connection } = useConnection();
    const { publicKey, signTransaction } = useWallet();
    const wallet = useWallet();

    const [nftData, setNftData] = useState([]);
    const [itemList, setItemList] = useState([]);

    const [activeTab, setActiveTab] = useState(0);
    const [activeInventory, setActiveInventory] = useState(0);

    useEffect(() => {
        if (publicKey) {
            setNftTokenData(publicKey)
        }
    }, [publicKey])


    const getAllNftData = async (walletPubKey) => {
        try {
            const allTokenAccounts = await connection.getParsedTokenAccountsByOwner(walletPubKey, {
                programId: TOKEN_PROGRAM_ID,
            })

            const nfts = allTokenAccounts.value.filter(nft => nft.account.data.parsed.info.tokenAmount.decimals === 0 &&
                nft.account.data.parsed.info.tokenAmount.uiAmount == 1);
            return nfts;
        } catch (error) {
            console.log(error);
        }
    };

    const _getAllNftData = async (walletPubKey) => {
        try {
            const nfts = await getParsedNftAccountsByOwner({
                publicAddress: walletPubKey,
                connection: connection,
                serialization: true,
            });

            return nfts;
        } catch (error) {
            console.log(error);
        }
    };

    const setNftTokenData = async (walletPubKey) => {
        try {
            let nftsubData = [];
            nftsubData = await _getAllNftData(walletPubKey);
            console.log(nftsubData, 'nftsubData');
            let data = Object.keys(nftsubData).map((key) => nftsubData[key]);
            let arr = [];
            let items = [];

            // var stakedNFTs = await getStakedNFTs();
            // for (let i = 0; i < stakedNFTs.length; i++) {
            //     data.push(stakedNFTs[i]);
            // }

            let n = data.length;
            // let n = 10;
            console.log(data, "over here")
            for (let i = 0; i < n; i++) {

                // if (nfts.indexOf(data[i].mint) === -1) {
                // 	continue;
                // }
                let val = {};
                try {
                    val = await axios.get(data[i].data.uri);
                } catch (err) {
                    val = {
                        data: {
                            name: "",
                            count: 0,
                            image: "",
                        }
                    }
                }

                console.log(val, "val")

                if (data[i].staked !== true) data[i].staked = false;
                val.mint = data[i].mint;
                val.staked = data[i].staked;
                val.creator = data[i].data.creators[0].address;
                val.creators = data[i].data.creators;
                val.storeId = data[i].storeId;

                if (data[i].data.creators[0].address === collectionPubkey.toBase58()) {
                    arr.push(val);
                }

                if (data[i].data.creators[0].address === itemCollectionPubkey.toBase58()) {
                    items.push(val);
                }

            }

            console.log(arr, "arr11111")
            console.log(items, "items")

            setNftData(arr)
            setItemList(items)

        } catch (error) {
            console.log(error);
        }
    }

    return (<div className="container-fluid">
        <div className="row border-bottom">
            <div className="col-12">
                <ul className="nav pt-4">
                    <li className="nav-item" onClick={() => setActiveTab(0)}>
                        <span className={"nav-link" + (activeTab === 0 ? " active" : "")}>Account Management</span>
                    </li>
                    <li className="nav-item" onClick={() => setActiveTab(1)}>
                        <span className={"nav-link" + (activeTab === 1 ? " active" : "")}>Inventory</span>
                    </li>
                </ul>
            </div>
        </div>
        {
            activeTab === 0 ?
                <div className="container">
                    <div className="row">
                        <div className="col-12 pt-4 px-0">
                            <h1>Account Management</h1>
                        </div>

                        <div className="col-12 px-5 mt-3">
                            <h2>KOMO Account</h2>
                            <table className="table table-borderless text-light">
                                <tr>
                                    <td width="30%">KOMO Username</td>
                                    <td><b>Aviabee</b></td>
                                </tr>
                                <tr>
                                    <td>Email</td>
                                    <td><b>aviabee.id@gmail.com</b> <span className="border border-success p-1"><i className="fas fa-check text-success"></i> Verified</span></td>
                                </tr>
                                <tr>
                                    <td>Solana Wallet</td>
                                    <td>BwkQW4MWv6iVpJt9vZXwWxD9gRbDyfxZQGTLTCnmprW7</td>
                                </tr>
                                <tr>
                                    <td>Member Since</td>
                                    <td>5 March 2022</td>
                                </tr>
                                <tr colspan="2">
                                    <td><button className="btn btn-filter btn-primary">Change Email and Password</button></td>
                                </tr>
                            </table>
                        </div>
                        <div className="col-12 px-5 mt-5">
                            <h2>Game Account</h2>
                            <table className="table table-borderless text-light">
                                <tr>
                                    <td width="30%">Game ID</td>
                                    <td><b>5479BDEAC1471431</b></td>
                                </tr>
                                <tr>
                                    <td>Game Display Name</td>
                                    <td><b>[PBR.gg] Aviabee</b></td>
                                </tr>
                                <tr colspan="2">
                                    <td><button className="btn btn-filter btn-primary">Change Game Display Name</button></td>
                                </tr>
                            </table>
                        </div>

                    </div>
                </div>
                :
                <div className="container">
                    <div className="row">
                        <div className="col-12 pt-4 px-0">
                            <ul className="nav nav-pills border-bottom" id="pills-tab" role="tablist">
                                <li className="nav-item ms-3" role="presentation">
                                    <button className={"nav-link fw-bold" + (activeInventory === 0 ? " active" : "")} id="pills-nft-tab" onClick={() => setActiveInventory(0)}>Komoverse NFTs</button>
                                </li>
                                <li className="nav-item" role="presentation">
                                    <button className={"nav-link fw-bold" + (activeInventory === 1 ? " active" : "")} id="pills-items-tab" onClick={() => setActiveInventory(1)}>In-Game Items</button>
                                </li>
                            </ul>
                            <div className="tab-content" id="pills-tabContent">
                                <div className={"tab-pane fade" + (activeInventory === 0 ? " show active" : "")} id="pills-nft">
                                    <div className="row m-0">
                                        <div className="col-lg-12 p-3">
                                            <div className="row mt-4">
                                                {nftData.map((nft, i) => {
                                                    return (
                                                        <div key={i} className="col-12 col-md-4 col-lg-3">
                                                            <div className="listing-box mb-3 p-3">
                                                                <span className="title">{nft.data.name}</span>
                                                                <img src={nft.data.image} className="my-2" alt="Komoverse #9950" />
                                                                <p>Breed Count: 0</p>
                                                                <p>Attributes:</p>
                                                                <ul>
                                                                    <li>Head: Chameleon Purle</li>
                                                                    <li>Body: Wizard</li>
                                                                    <li>Weapon: Desert Eagle</li>
                                                                    <li>Headgear: Magician Hat</li>
                                                                    <li>Background: Cloud Stroke Yellow</li>
                                                                </ul>
                                                                <Link to={`/sell/${nft.mint}`} className="btn btn-filter btn-primary">SELL</Link>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className={"tab-pane fade" + (activeInventory === 1 ? " show active" : "")} id="pills-items">
                                    <div className="row m-0">
                                        <div className="col-lg-12 p-3">
                                            <div className="row mt-4">
                                                {itemList.map((item, i) => {
                                                    return (
                                                        <div key={i} className="col-12 col-md-4 col-lg-3">
                                                            <div className="listing-box mb-3 p-3">
                                                                <span className="title">{item.data.name}</span>
                                                                <img src={item.data.image} className="my-2" alt="Komoverse #9950" />
                                                                <div className="row">
                                                                    <div className="col-12">
                                                                        When player use this item, grant extra 1 card draw from the deck. This item can be used once per match.
                                                                        <Link to={`/sell/${item.mint}`} className="btn btn-filter btn-primary">SELL</Link>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
        }
    </div>)
}
export default Account;