import axios from 'axios'

import { Wallet, Provider, Program, web3, BN } from '@project-serum/anchor';
import {
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
    getAssociatedTokenAddress,
    createAssociatedTokenAccountInstruction
} from "@solana/spl-token";

import { Connection, clusterApiUrl, LAMPORTS_PER_SOL, Keypair, PublicKey } from "@solana/web3.js";
import { getParsedNftAccountsByOwner, isValidSolanaAddress, createConnectionConfig, } from "@nfteyez/sol-rayz";

import { mintPubkey, marketplacePDA, adminPubkey, collectionPubkey } from './config'

import { Marketplace } from './js/marketplace';
import { Collection } from "./js/collection";
import { getCollectionPDA, getSellOrderPDA, getMarketplacePDA, getEscrowPDA } from './js/getPDAs'

import * as borsh from 'borsh';
import { METADATA_SCHEMA, Metadata } from './metadata';

import idl from './js/types/marketplace.json'
import { MARKETPLACE_PROGRAM_ID } from './js/constant'

//create a connection of devnet
const createConnection = () => {
    return new Connection(clusterApiUrl("devnet"));
};

//check solana on window. This is useful to fetch address of your wallet.
const getProvider = () => {
    if ("solana" in window) {
        const provider = window.solana;
        if (provider.isPhantom) {
            return provider;
        }
    }
};

const getAllNftData = async (address) => {
    try {
        const connect = createConnectionConfig(clusterApiUrl("devnet"));
        const nfts = await getParsedNftAccountsByOwner({
            publicAddress: address,
            connection: connect,
            serialization: true,
        });
        return nfts;
    } catch (error) {
        console.log(error);
    }
};

export const getMetadata = async (mint) => {
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

const METADATA_REPLACE = new RegExp('\u0000', 'g');
export const decodeMetadata = (buffer) => {
    const metadata = borsh.deserializeUnchecked(
        METADATA_SCHEMA,
        Metadata,
        buffer,
    );
    metadata.data.name = metadata.data.name.replace(METADATA_REPLACE, '');
    metadata.data.uri = metadata.data.uri.replace(METADATA_REPLACE, '');
    metadata.data.symbol = metadata.data.symbol.replace(METADATA_REPLACE, '');
    return metadata;
    // return borsh.deserializeUnchecked(METADATA_SCHEMA, Metadata, buffer);
}


export const FilterWalletNfts = async (address) => {

    try {
        let nftData = await getAllNftData(address);
        var data = Object.keys(nftData).map((key) => nftData[key]); let arr = [];
        let n = data.length;
        for (let i = 0; i < n; i++) {
            // console.log(data[i]);
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
                console.log(err, "err777")
            }
            val.mint = data[i].mint;
            val.staked = data[i].staked;
            val.creator = data[i].data.creators[0].address;
            val.creators = data[i].data.creators;
            val.storeId = data[i].storeId;
            arr.push(val);
        }
        return arr;
    } catch (error) {
        console.log(error);
    }

    // store.dispatch(setWalletNfts(newNfts))

}

export const sell = async (provider, seller, nftDt, solPrice, tokenPrice) => {

    let sellerTokenAccount = await getAssociatedTokenAddress(mintPubkey, seller);

    let sellerAccountInfo = await provider.connection.getAccountInfo(sellerTokenAccount)
    if (sellerAccountInfo === null) {

        let program = new Program(idl, MARKETPLACE_PROGRAM_ID, provider);
        let tx = new web3.Transaction();
        tx.add(createAssociatedTokenAccountInstruction(seller, sellerTokenAccount, seller, mintPubkey))

        await program.provider.send(tx, []);
    }

    let mint = new PublicKey(nftDt.mint);
    let sellerNftAssociatedTokenAccount = await getAssociatedTokenAddress(mint, seller)

    let marketplace = new Marketplace(provider, marketplacePDA);
    let collectionPDA = await getCollectionPDA(marketplace.marketplacePDA, collectionPubkey)
    let collection = new Collection(provider, marketplace.marketplacePDA, collectionPDA)

    try {
        await collection.sellAsset(
            mint,
            sellerNftAssociatedTokenAccount,
            sellerTokenAccount,
            new BN(solPrice * (10 ** 9)),
            new BN(tokenPrice * (10 ** 9)),
            new BN(1),
            seller
        )
        alert("Selling is a success.");
        return true;
    } catch (error) {
        console.log(error, "SellAsset is failure.");
        alert("Selling is a failure.");
        return false;
    }

}

export const getListedNfts = async (provider) => {
    let marketplace = new Marketplace(provider, marketplacePDA);
    let sellOrders = await marketplace.getAllAccounts();

    let datas = [];

    for (let i = 0; i < sellOrders.length; i++) {
        const order = sellOrders[i];
        if (marketplacePDA.toBase58() === order.account.marketplace.toBase58()) {
            let obj = {};

            let metaPubkey = await getMetadata(new PublicKey(order.account.mint));
            let metadataObj = await provider.connection.getAccountInfo(metaPubkey);

            let decoded = await decodeMetadata(Buffer.from(metadataObj.data));

            try {
                obj = await axios.get(decoded.data.uri);
            } catch (error) {
                console.log("Error")
                console.log(error, "Getting Nft Metadatas.")
            }
            obj.mint = order.publicKey.toBase58();
            obj.uri = decoded.data.uri;
            obj.account = order.account;

            if (order.account.quantity.toString() !== "0") {
                datas.push(obj);
            }
        }
    }

    return datas;
}

export const getNFTInfoBySellOrder = async (provider, sellOrderPDA) => {

    let marketplace = new Marketplace(provider, marketplacePDA);
    let order = await marketplace.getAccountByPDA(new PublicKey(sellOrderPDA));

    let obj = {};

    let metaPubkey = await getMetadata(new PublicKey(order.mint));
    let metadataObj = await provider.connection.getAccountInfo(metaPubkey);

    let decoded = await decodeMetadata(Buffer.from(metadataObj.data));

    try {
        obj = await axios.get(decoded.data.uri);
    } catch (error) {
        console.log("Error")
        console.log(error, "Getting Nft Metadatas.")
    }
    // obj.mint = order.publicKey.toBase58();
    obj.uri = decoded.data.uri;
    obj.account = order;

    return obj;
}

export const buy = async (provider, buyer, nftInfo, payType) => {

    let buyerTokenATA = await getAssociatedTokenAddress(mintPubkey, buyer)
    let buyerTokenInfo = await provider.connection.getAccountInfo(buyerTokenATA);
    if (buyerTokenInfo === null) {

        let program = new Program(idl, MARKETPLACE_PROGRAM_ID, provider);
        let tx = new web3.Transaction();
        tx.add(createAssociatedTokenAccountInstruction(buyer, buyerTokenATA, buyer, mintPubkey))

        await program.provider.send(tx, []);
    }

    let nftMint = new PublicKey(nftInfo.account.mint);

    let buyerNftATA = await getAssociatedTokenAddress(nftMint, buyer);

    let buyerNftInfo = await provider.connection.getAccountInfo(buyerNftATA);
    if (buyerNftInfo === null) {
        let program = new Program(idl, MARKETPLACE_PROGRAM_ID, provider);
        let tx = new web3.Transaction();
        tx.add(createAssociatedTokenAccountInstruction(buyer, buyerNftATA, buyer, nftMint))

        await program.provider.send(tx, [])
    }

    let marketplace = new Marketplace(provider, marketplacePDA);

    let collectionPDA = await getCollectionPDA(marketplace.marketplacePDA, collectionPubkey)
    let collection = new Collection(provider, marketplace.marketplacePDA, collectionPDA)

    let seller = new PublicKey(nftInfo.account.authority);
    let sellerNftAssociatedTokenAccount = await getAssociatedTokenAddress(nftMint, seller)

    let sellerNfInfo = await provider.connection.getAccountInfo(sellerNftAssociatedTokenAccount);
    if (sellerNfInfo === null) {
        let program = new Program(idl, MARKETPLACE_PROGRAM_ID, provider);
        let tx = new web3.Transaction();
        tx.add(createAssociatedTokenAccountInstruction(buyer, sellerNftAssociatedTokenAccount, seller, nftMint))

        await program.provider.send(tx, [])
    }

    try {
        await collection.buy(
            nftMint,
            seller,
            [
                await getSellOrderPDA(sellerNftAssociatedTokenAccount, new BN(nftInfo.account.solPrice), new BN(nftInfo.account.tokenPrice)),
            ],
            buyerNftATA,
            buyerTokenATA,
            new BN(1),
            buyer,
            payType,
        )
    
        console.log("success")
        alert("Success")
        return true;
        // let buyerNftAccountAfterSell = await nftMint.getAccountInfo(buyerNftATA)
        // assert.equal(buyerNftAccountAfterSell.amount.toNumber(), 1)
    
    } catch (error) {
        console.log(error, "Transaction error in buy.");
        alert("Failure")
        return false;
    }
}


