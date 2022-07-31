import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

import axios from "axios";

import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { collectionPubkey, itemCollectionPubkey } from "../app/api/config";

import * as borsh from 'borsh';

import { METADATA_SCHEMA, Metadata } from '../app/api/metadata';
import { PublicKey } from '@solana/web3.js';

const Account = () => {

    const { connection } = useConnection();
    const { publicKey } = useWallet();

    const [nftData, setNftData] = useState([]);
    const [itemList, setItemList] = useState([]);
    const [nfts, setNfts] = useState([]);

    const [activeTab, setActiveTab] = useState(0);
    const [activeInventory, setActiveInventory] = useState(0);

    useEffect(() => {
        if (publicKey) {
            getAllNftData(publicKey)
        }
    }, [publicKey])

    useEffect(() => {
        getParsedNftData();
    }, [nfts]);


    const getAllNftData = async (walletPubKey) => {
        try {
            const allTokenAccounts = await connection.getParsedTokenAccountsByOwner(walletPubKey, {
                programId: TOKEN_PROGRAM_ID,
            })

            const nfts = allTokenAccounts.value.filter(nft => nft.account.data.parsed.info.tokenAmount.decimals === 0 &&
                nft.account.data.parsed.info.tokenAmount.uiAmount === 1);
            setNfts(nfts);
            return nfts;
        } catch (error) {
            console.log(error);
        }
    };

    const decodeMetadata = (buffer) => {
        return borsh.deserializeUnchecked(METADATA_SCHEMA, Metadata, buffer);
    }

    const getMetadata = async (mint) => {
        const TOKEN_METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');
        return (
            await PublicKey.findProgramAddress(
                [
                    Buffer.from('metadata'),
                    TOKEN_METADATA_PROGRAM_ID.toBuffer(),
                    mint.toBuffer(),
                ],
                TOKEN_METADATA_PROGRAM_ID,
            )
        )[0];
    };

    const getParsedNftData = async () => {
        try {
            let result = [];
            let arr = [];
            let items = [];
            for (let i = 0; i < nfts.length; i++) {
                const mint = new PublicKey(nfts[i].account.data.parsed.info.mint);
                // eslint-disable-next-line no-loop-func
                getMetadata(mint).then(metaPubkey => {
                    connection.getAccountInfo(metaPubkey).then(metadataObj => {
                        const metadataDecoded = decodeMetadata(
                            Buffer.from(metadataObj.data),
                        );
                        axios.get(metadataDecoded.data.uri).then(({ data }) => {
                            let parsedNft = result.find((nft) => nft.mint === mint.toBase58())
                            parsedNft.creators = metadataDecoded.data.creators;
                            parsedNft = {
                                ...parsedNft,
                                ...data
                            }

                            const creator = new PublicKey(parsedNft.creators[0].address);
                            if (creator.toBase58() === collectionPubkey.toBase58()) {
                                arr.push(parsedNft);
                            }

                            if (creator.toBase58() === itemCollectionPubkey.toBase58()) {
                                items.push(parsedNft);
                            }

                            parsedNft.attributesObject = {};
                            parsedNft.attributes.map(attr => {
                                parsedNft.attributesObject[attr.trait_type] = attr.value;
                            });

                            console.log(parsedNft)

                            setItemList([...items]);
                            setNftData([...arr])
                        }).catch(e => {
                            console.log(e)
                            result = result.filter((nft) => nft.mint !== mint.toBase58())
                            setItemList([...items]);
                            setNftData([...arr])
                        });
                    });
                });

                result.push({
                    mint: mint.toBase58(),
                });
            }

            setItemList(items);
            setNftData(arr)
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
                                                                <span className="title">{nft.name}</span>
                                                                <img src={nft.image} className="my-2" alt={nft.name} />
                                                                <p>Breed Count: 0</p>
                                                                <p>Attributes:</p>
                                                                <ul>
                                                                    {
                                                                        Object.keys(nft.attributesObject).map(key => <li>{key}: {nft.attributesObject[key]}</li>)
                                                                    }
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
                                                                <span className="title">{item.name}</span>
                                                                <img src={item.image} className="my-2" alt={item.name} />
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