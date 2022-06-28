import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from "axios";

import { getNFTInfoBySellOrder, buy } from "../../app/api/index";

import * as anchor from "@project-serum/anchor";
import { useConnection, useWallet } from '@solana/wallet-adapter-react';

const opts = {
    preflightCommitment: "processed"
}

const Buy = () => {
    const { mint } = useParams();
    const navigate = useNavigate();

    const { connection } = useConnection();
    const { publicKey, signTransaction } = useWallet();
    const wallet = useWallet();

    const [nftInfo, setNftInfo] = useState({
        data: {},
        account: {}
    });

    async function getProvider() {
        const provider = new anchor.Provider(
            connection, wallet, opts.preflightCommitment,
        );
        return provider;
    }

    useEffect(async () => {
        if (mint) {
            let cProvider = await getProvider();
            let nftData = await getNFTInfoBySellOrder(cProvider, mint);
            if (nftData) {
                setNftInfo(nftData);
            }
            // await getNftMetadata(cProvider, mint);
        }
    }, [publicKey])

    const handleBuy = async (type) => {

        console.log(type, "handleBuy")
        let cProvider = await getProvider();
        if (cProvider) {
            // let nftDt = await nftData.find(n => n.mint === selectedNFT);
            let result = await buy(cProvider, publicKey, nftInfo, type);
            if (result) {
                navigate("/account")
            }
        }
    }

    return (<div class="container">
        <div class="row" style={{ padding: "0 20px" }}>
            <div class="col-12 pt-4 px-0">
                {/* <h1>Buy Items</h1> */}
                <h2>{nftInfo.data.name ? nftInfo.data.name : ""}</h2>
            </div>
            <div class="col-12 col-lg-6">
                <img src={nftInfo.data.image ? nftInfo.data.image : ""} class="my-2" alt={nftInfo.data.name ? nftInfo.data.name : ""} />
            </div>
            <div class="col-12 col-lg-6">
                <p>Breed Count: 0</p>
                <p>Attributes:</p>
                <ul>
                    <li>Head: Chameleon Purle</li>
                    <li>Body: Wizard</li>
                    <li>Weapon: Desert Eagle</li>
                    <li>Headgear: Magician Hat</li>
                    <li>Background: Cloud Stroke Yellow</li>
                </ul>
                <div class="row">
                    <div class="col-6">
                        <img src="assets/img/solana-coin.webp" class="buy-currency" alt="" />
                        <span class="ms-2 fs-5">{nftInfo.account.solPrice ? nftInfo.account.solPrice.toString() / (10 ** 9) : 0} SOL</span>
                        <button class="mt-3 btn btn-filter btn-lg btn-primary" onClick={() => handleBuy(1)}>BUY NOW (SOL)</button>
                    </div>
                    <div class="col-6">
                        <img src="assets/img/komo-coin.webp" class="buy-currency" alt="" />
                        <span class="ms-2 fs-5">{nftInfo.account.tokenPrice ? nftInfo.account.tokenPrice.toString() / (10 ** 9) : 0} KOMO</span>
                        <button class="mt-3 btn btn-filter btn-lg btn-primary" onClick={() => handleBuy(2)}>BUY NOW (KOMO)</button>
                    </div>
                </div>
            </div>
        </div>
    </div>)
}

export default Buy;