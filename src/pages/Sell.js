import React, { useState, useEffect } from 'react';
import NftImg from "../assets/img/nft/9950.png";

import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { getMetadata, decodeMetadata, sell } from "../app/api/index";

import * as anchor from "@project-serum/anchor";
import { useConnection, useWallet } from '@solana/wallet-adapter-react';

import { Connection, clusterApiUrl, LAMPORTS_PER_SOL, Keypair, PublicKey } from "@solana/web3.js";

const opts = {
    preflightCommitment: "processed"
}

const Sell = () => {
    const { mint } = useParams();
    const navigate = useNavigate();

    const { connection } = useConnection();
    const { publicKey, signTransaction } = useWallet();
    const wallet = useWallet();

    const [provider, setProvider] = useState(null);
    const [nftInfo, setNftInfo] = useState({
        data: {}
    });
    const [tokenPrice, setTokenPrice] = useState(0);
    const [solPrice, setSolPrice] = useState(0);


    async function getProvider() {
        const provider = new anchor.Provider(
            connection, wallet, opts.preflightCommitment,
        );
        return provider;
    }

    useEffect(async () => {
        if (mint) {
            let cProvider = await getProvider();
            await getNftMetadata(cProvider, mint);
        }
    }, [publicKey])

    const getNftMetadata = async (provider, mint) => {
        let obj = {};

        let metaPubkey = await getMetadata(new PublicKey(mint));
        let metadataObj = await provider.connection.getAccountInfo(metaPubkey);

        let decoded = await decodeMetadata(Buffer.from(metadataObj.data));

        try {
            obj = await axios.get(decoded.data.uri);
        } catch (error) {
            console.log("Error")
            console.log(error, "Getting Nft Metadatas.")
        }

        obj.mint = mint;
        obj.uri = decoded.data.uri;
        obj.creator = new PublicKey(decoded.data.creators[0].address).toBase58();
        obj.creators = obj.data.properties.creators;

        setNftInfo(obj);
    }

    const handleSell = async () => {
        console.log(tokenPrice, solPrice)

        if (tokenPrice <= 0) {
            alert("please enter the token price correctly.")
            return;
        }

        if (solPrice <= 0) {
            alert("please enter the sol price correctly.")
            return;
        }


        let cProvider = await getProvider();

        if (cProvider) {
            console.log("sellNFT")
            let result = await sell(cProvider, publicKey, nftInfo, solPrice, tokenPrice);
            if (result) {
                navigate("/marketplace");
            }
        }
    }

    return (<div class="container">
        <div class="row">
            <div class="col-12 pt-4 px-0">
                {/* <h1>Sell Items</h1> */}
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
                <span class="d-block">Listing Price (SOL)</span>
                <input
                    type="number"
                    class="form-control"
                    value={solPrice}
                    onChange={e => setSolPrice(e.target.value)}
                />
                <span class="d-block mt-3">Listing Price (KOMO)</span>
                <input
                    type="number"
                    class="form-control"
                    value={tokenPrice}
                    onChange={(e) => setTokenPrice(e.target.value)}
                />
                <button
                    class="mt-3 btn btn-filter btn-lg btn-primary"
                    onClick={handleSell}
                >
                    SELL NOW
                </button>
            </div>
        </div>
    </div>)
}

export default Sell;