import axios from 'axios'

import { Wallet, Provider, Program, web3, BN } from '@project-serum/anchor';
import {
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
    getAssociatedTokenAddress,
    createAssociatedTokenAccountInstruction
} from "@solana/spl-token";

import { Connection, clusterApiUrl, LAMPORTS_PER_SOL, Keypair, PublicKey } from "@solana/web3.js";

import { mintPubkey, marketplacePDA, adminPubkey } from './config'

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
        const connection = createConnection();
        const allTokenAccounts = await connection.getParsedTokenAccountsByOwner(address, {
            programId: TOKEN_PROGRAM_ID,
        })

        const nfts = allTokenAccounts.value.filter(nft => nft.account.data.parsed.info.tokenAmount.decimals === 0 &&
            nft.account.data.parsed.info.tokenAmount.uiAmount == 1);
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

export const sell = async (provider, seller, nftDt, price) => {

    let sellerTokenAccount = await getAssociatedTokenAddress(mintPubkey, seller);

    let sellerAccountInfo = await provider.connection.getAccountInfo(sellerTokenAccount)
    if (sellerAccountInfo === null) {
        alert("Your fee token account is not exist.");
        return;
    }

    let mint = new PublicKey(nftDt.mint);
    let sellerNftAssociatedTokenAccount = await getAssociatedTokenAddress(mint, seller)

    let marketplace = new Marketplace(provider, marketplacePDA);
    let collectionPDA = await getCollectionPDA(marketplace.marketplacePDA, "Willie")
    let collection = new Collection(provider, marketplace.marketplacePDA, collectionPDA)

    try {
        await collection.sellAsset(
            mint,
            sellerNftAssociatedTokenAccount,
            sellerTokenAccount,
            new BN(price),
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

export const buy = async (provider, buyer, nftInfo) => {

    let buyerTokenATA = await getAssociatedTokenAddress(mintPubkey, buyer)
    let buyerTokenInfo = await provider.connection.getAccountInfo(buyerTokenATA);
    if (buyerTokenInfo === null) {
        alert("Your fee token account is not exist.");
        return;
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

    let collectionPDA = await getCollectionPDA(marketplace.marketplacePDA, "Willie")
    let collection = new Collection(provider, marketplace.marketplacePDA, collectionPDA)

    let sellerNftAssociatedTokenAccount = await getAssociatedTokenAddress(nftMint, nftInfo.account.authority)

    try {
        await collection.buy(
            nftMint,
            [
                await getSellOrderPDA(sellerNftAssociatedTokenAccount, new BN(nftInfo.account.price)),
            ],
            buyerNftATA,
            buyerTokenATA,
            new BN(1),
            buyer,
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

export const removeSellOrder = async (provider, seller, nftDt) => {

    // let mint = new PublicKey(nftDt.account.mint);
    // let nftMint = new Token(provider.connection, mint, TOKEN_PROGRAM_ID, provider.wallet.payer)
    // let sellerNftAssociatedTokenAccount = (await nftMint.getOrCreateAssociatedAccountInfo(seller)).address

    // let marketplace = new Marketplace(provider, marketplacePDA);

    // let filterSellOrder = await marketplace.filterSellOrderByMint(nftDt.account.mint.toBase58());
    // let price = filterSellOrder[0].account.price;

    // let sellOrderPDA = await getSellOrderPDA(sellerNftAssociatedTokenAccount, new BN(price));

    // let collectionPDA = await getCollectionPDA(marketplace.marketplacePDA, "Willie")
    // let collection = new Collection(provider, marketplace.marketplacePDA, collectionPDA);

    // try {
    //     await collection.removeSellOrder(
    //         nftMint.publicKey,
    //         sellerNftAssociatedTokenAccount,
    //         sellOrderPDA,
    //         new BN(1),
    //         seller
    //     )
    //     alert("Success.");
    // } catch (error) {
    //     console.log(error, "Failure.");
    //     alert("Failure.");
    // }
}

export const createNftOffer = async (provider, buyer, nftInfo, price) => {

    // let admin = Keypair.fromSecretKey(new Uint8Array(adminWallet));

    // const marketplaceMint = new splToken.Token(
    //     provider.connection,
    //     mintPubkey,
    //     splToken.TOKEN_PROGRAM_ID,
    //     provider.wallet.payer
    // );

    // let buyerTokenAccount = await Token.getAssociatedTokenAddress(splToken.ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, marketplaceMint.publicKey, buyer)
    // const buyerTokenInfo = await provider.connection.getAccountInfo(buyerTokenAccount);
    // if (buyerTokenInfo === null) {
    //     alert("Your fee token account is not exist.");
    //     return;
    // }

    // console.log(nftInfo, "createNftOffer ======= nftInfo")

    // let mint = new PublicKey(nftInfo.account.mint);
    // let nftMint = new Token(provider.connection, mint, TOKEN_PROGRAM_ID, admin)
    // let buyerNftTokenAccount = await nftMint.createAssociatedTokenAccount(new PublicKey(buyer))
    // // let buyerNftTokenAccount = (await nftMint.getOrCreateAssociatedAccountInfo(new PublicKey(buyer))).address

    // console.log(buyerNftTokenAccount.toBase58(), "createNftOffer ======= buyerNftTokenAccount")

    // let marketplace = new Marketplace(provider, marketplacePDA);
    // let collectionPDA = await getCollectionPDA(marketplace.marketplacePDA, "Willie")
    // let collection = new Collection(provider, marketplace.marketplacePDA, collectionPDA);

    // try {
    //     await collection.createNftOffer(
    //         nftMint.publicKey,
    //         buyerNftTokenAccount,
    //         buyerTokenAccount,
    //         buyer,
    //         new BN(price)
    //     )
    //     alert("Success.");
    // } catch (error) {
    //     console.log(error, "Failure.");
    //     alert("Failure.");
    // }
}

export const getAllOffers = async (provider, seller) => {
    // let marketplace = new Marketplace(provider, marketplacePDA);
    // let buyOffers = await marketplace.getAllOffers();

    // console.log(buyOffers, "getAllOffers === ");

    // let datas = [];

    // for (let i = 0; i < buyOffers.length; i++) {
    //     const offer = buyOffers[i];
    //     if (marketplacePDA.toBase58() === offer.account.marketplace.toBase58()) {

    //         let obj = {};

    //         let metaPubkey = await getMetadata(new PublicKey(offer.account.mint));
    //         let metadataObj = await provider.connection.getAccountInfo(metaPubkey);

    //         let decoded = await decodeMetadata(Buffer.from(metadataObj.data));
    //         try {
    //             obj = await axios.get(decoded.data.uri);
    //         } catch (error) {
    //             console.log("Error")
    //             console.log(error, "Getting Nft Metadatas.")
    //         }
    //         obj.mint = offer.publicKey.toBase58();
    //         obj.uri = decoded.data.uri;
    //         obj.account = offer.account;

    //         let filterSellOrder = await marketplace.filterSellOrderByMint(offer.account.mint.toBase58());
    //         obj.account.seller = filterSellOrder[0].account.authority;

    //         if(obj.account.seller.toBase58() === seller.toBase58()) {
    //             datas.push(obj);
    //         }
    //     }
    // }
    // console.log(datas, "getAllOffers")

    // return datas;
}

export const excuteNftOffer = async (provider, buyer, nftInfo) => {

    // let admin = Keypair.fromSecretKey(new Uint8Array(adminWallet));

    // console.log(nftInfo, "111")

    // let mint = new PublicKey(nftInfo.account.mint);
    // console.log("444")

    // let nftMint = new Token(provider.connection, mint, TOKEN_PROGRAM_ID, admin)
    // console.log(buyer, "444")

    // // let buyerNftTokenAccount = (await nftMint.getOrCreateAssociatedAccountInfo(new PublicKey(buyer))).address;
    // let buyerNftTokenAccount = await nftMint.createAssociatedTokenAccount(new PublicKey(buyer))

    // console.log(buyerNftTokenAccount, "buyerNftTokenAccount")
    // let marketplaceMint = new Token(
    //     provider.connection,
    //     mintPubkey,
    //     TOKEN_PROGRAM_ID,
    //     admin
    // );
    // console.log(marketplaceMint, "2222")


    // let adminTokenAccount = await Token.getAssociatedTokenAddress(splToken.ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, marketplaceMint.publicKey, adminPubkey);

    // console.log(adminTokenAccount.toBase58(), "3333")

    // let adminAccountInfo = await provider.connection.getAccountInfo(adminTokenAccount)

    // console.log(adminAccountInfo, "7777")

    // if (adminAccountInfo === null) {
    //     await marketplaceMint.createAssociatedTokenAccount(
    //         adminPubkey,
    //     );
    // } else {
    //     console.log("already created.")
    // }

    // console.log("3333")

    // let seller = nftInfo.account.seller;

    // let sellerTokenAccount = await Token.getAssociatedTokenAddress(splToken.ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, mintPubkey, seller);

    // console.log(seller.toBase58(), "seller")
    // console.log(sellerTokenAccount.toBase58(), "sellerTokenAccount")

    // let sellerNftAssociatedTokenAccount = (await nftMint.getOrCreateAssociatedAccountInfo(seller)).address


    // console.log(sellerNftAssociatedTokenAccount.toBase58, "sellerNftAssociatedTokenAccount");

    // let marketplace = new Marketplace(provider, marketplacePDA);
    // let collectionPDA = await getCollectionPDA(marketplace.marketplacePDA, "Willie")
    // let collection = new Collection(provider, marketplace.marketplacePDA, collectionPDA);

    // console.log(new BN(nftInfo.account.proposedPrice).toBase58())

    // try {
    //     await collection.excuteNftOffer(
    //         nftMint.publicKey,
    //         buyerNftTokenAccount,
    //         adminTokenAccount,
    //         sellerTokenAccount,
    //         sellerNftAssociatedTokenAccount,
    //         buyer,
    //         seller,
    //         new BN(nftInfo.account.proposedPrice)
    //     )
    //     alert("Success.");
    // } catch (error) {
    //     console.log(error, "Failure.");
    //     alert("Failure.");
    // }
}

export const removeNftOffer = async (provider) => {
    // let marketplace = new Marketplace(provider, marketplacePDA);
    // let collectionPDA = await getCollectionPDA(marketplace.marketplacePDA, "Willie")
    // let collection = new Collection(provider, marketplace.marketplacePDA, collectionPDA);

    // try {
    //     await collection.removeNftOffer(
    //         nftMint.publicKey,
    //         buyerTokenAccount,
    //         buyer,
    //         new BN(nftDt.account.price)
    //     )
    //     alert("Success.");
    // } catch (error) {
    //     console.log(error, "Failure.");
    //     alert("Failure.");
    // }
}

