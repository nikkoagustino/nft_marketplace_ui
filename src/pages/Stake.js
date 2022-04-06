import React, { useEffect, useCallback, useState } from 'react';
// import { isMobile } from 'react-device-detect';
import * as anchor from "@project-serum/anchor";
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
    Keypair,
    PublicKey,
    SystemProgram,
    SYSVAR_CLOCK_PUBKEY,
    LAMPORTS_PER_SOL
} from '@solana/web3.js';
import { useParams } from 'react-router-dom';

import * as borsh from 'borsh';
import axios from 'axios';
import {
    TOKEN_PROGRAM_ID,
    ACCOUNT_SIZE,
    getMinimumBalanceForRentExemptAccount,
    createInitializeAccountInstruction,
    getAssociatedTokenAddress,
    createAssociatedTokenAccountInstruction
} from "@solana/spl-token";
import { METADATA_SCHEMA, Metadata } from "../types.ts";
import idl from '../assets/nft_staking.json'
import {
    WalletModalProvider,
    WalletDisconnectButton,
    WalletMultiButton
} from '@solana/wallet-adapter-react-ui';
import {
    poolPublicKey,
    mintFeePublicKey,
    programId
} from "../config";
import { getCmPerTokenRewards, getPoolSigner, getStakeUserPubkey, getStakeUserStorePubkey, getVaultPubkey } from '../utils';
import { Link } from 'react-router-dom';

const opts = {
    preflightCommitment: "processed"
}

const Stake = () => {
    const [nfts, setNfts] = useState([]);
    const [parsedNfts, setParsedNfts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [stakedNfts, setStakedNfts] = useState([]);

    let { stakeType } = useParams();
    stakeType = parseInt(stakeType);

    const { connection } = useConnection();
    const { publicKey, signTransaction } = useWallet();
    const wallet = useWallet();
    const provider = new anchor.Provider(
        connection, wallet, opts.preflightCommitment,
    );
    const program = new anchor.Program(idl, programId, provider);

    const getAllNfts = async () => {
        setTimeout(() => {
            getStakedNFTs();
        }, 1000);
        try {
            const allTokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
                programId: TOKEN_PROGRAM_ID,
            })
            const nfts = allTokenAccounts.value.filter(nft => nft.account.data.parsed.info.tokenAmount.decimals === 0 &&
                nft.account.data.parsed.info.tokenAmount.uiAmount == 1);
            console.log(nfts)
            setNfts(nfts);
            setParsedNfts([]);
        } catch (error) {
            console.log(error);
        }
    };

    const getStakedNFTs = async () => {
        try {
            var stakedNfts = [];

            const [userPubkey] = await getStakeUserPubkey(publicKey);

            const userObject = await program.account.user.fetch(userPubkey);
            for (let i = 0; i < userObject.stores; i++) {
                const [storePubkey] = await getStakeUserStorePubkey(publicKey, i + 1);
                const storeObject = await program.account.userStore.fetch(storePubkey);
                for (let j = 0; j < storeObject.nftMints.length; j++) {
                    var mDataKey = await getMetadata(storeObject.nftMints[j]);

                    const metadataObj = await connection.getAccountInfo(
                        mDataKey,
                    );
                    const metadataDecoded = decodeMetadata(
                        Buffer.from(metadataObj.data),
                    );

                    metadataDecoded['staked'] = true;
                    metadataDecoded['mint'] = storeObject.nftMints[j].toBase58();
                    metadataDecoded['storeId'] = storeObject.storeId;

                    stakedNfts.push(metadataDecoded);
                }
            }
            console.log(stakedNfts)
            getParsedStakedNftData(stakedNfts);
        } catch (err) {
            console.log(err)
            return []
        }

    }

    const getPendingRewardsFunc = async () => {

    }

    const stakeNFT = async (metaNFT) => {
        if (loading) return;
        const [vaultPublicKey] = await getVaultPubkey();

        const vaultObject = await program.account.vault.fetch(vaultPublicKey);
        const nftCreator = vaultObject.candyMachines.find((cm) => cm.toBase58() === metaNFT.creator);

        if (!nftCreator) {
            alert("No match candy machine. Pool has not candymachine id. " + metaNFT.creator);
            return;
        }

        setLoading(true);

        const poolObject = await program.account.pool.fetch(poolPublicKey);

        var mintPubKey = new PublicKey(metaNFT.mint);

        const walletPubkey = publicKey;
        const [
            userPubkey,
            userNonce
        ] = await getStakeUserPubkey(walletPubkey);

        let instructions = [];
        var accountFalg = false;
        var userObject;
        try {
            userObject = await program.account.user.fetch(userPubkey);
            accountFalg = true;
        } catch (err) {
            console.log(err)
        }

        const [_storePubkey, _storeNonce] = await getStakeUserStorePubkey(walletPubkey, 1);
        let storePubkey = _storePubkey;
        let storeNonce = _storeNonce;
        if (accountFalg === false) {
            console.log("Create User Staking Account");
            instructions.push(await program.instruction.createUser(userNonce, storeNonce, {
                accounts: {
                    pool: poolPublicKey,
                    user: userPubkey,
                    userStore: storePubkey,
                    owner: walletPubkey,
                    systemProgram: SystemProgram.programId,
                },
            }));
        } else {
            const [_storePubkey, _storeNonce] = await getStakeUserStorePubkey(walletPubkey, userObject.stores);
            storePubkey = _storePubkey;
            storeNonce = _storeNonce;
            const userStoreObject = await program.account.userStore.fetch(storePubkey);
            if (userStoreObject.nftMints.length >= 300) {
                const [newStorePubkey, newStoreNonce] = await getStakeUserStorePubkey(walletPubkey, userObject.stores + 1);
                storePubkey = newStorePubkey;
                storeNonce = newStoreNonce;
                instructions.push(await program.instruction.createUserStore(newStoreNonce, {
                    accounts: {
                        pool: poolPublicKey,
                        user: userPubkey,
                        userStore: newStorePubkey,
                        owner: walletPubkey,
                        systemProgram: SystemProgram.programId,
                    },
                }));
            }

        }
        console.log("Stake NFT");
        const nftOwnerAccounts = await connection.getTokenAccountsByOwner(walletPubkey, { mint: mintPubKey });
        let nftAccount;
        if (nftOwnerAccounts.value.length == 0) {
            alert("This nft is not your nft.");
            setLoading(false);
            return;
        }
        else {
            nftAccount = nftOwnerAccounts.value[0].pubkey;
            const nftBalance = await connection.getTokenAccountBalance(nftAccount);
            if (nftBalance.value.uiAmount === 0) {
                alert("This nft is not your nft.");
            }
        }

        let metadata = await getMetadata(mintPubKey);
        const [poolSigner] = await getPoolSigner();
        const nftAccounts = await connection.getTokenAccountsByOwner(poolSigner, { mint: mintPubKey });
        let toTokenAccount;
        if (nftAccounts.value.length == 0) {
            const keypair = Keypair.generate();
            try {
                const lamports = await getMinimumBalanceForRentExemptAccount(connection);
                instructions.push(
                    SystemProgram.createAccount({
                        fromPubkey: publicKey,
                        newAccountPubkey: keypair.publicKey,
                        space: ACCOUNT_SIZE,
                        lamports,
                        programId: TOKEN_PROGRAM_ID,
                    })
                );

                instructions.push(createInitializeAccountInstruction(keypair.publicKey, mintPubKey, poolSigner, TOKEN_PROGRAM_ID));
                instructions[instructions.length - 1].keypair = keypair;
                toTokenAccount = keypair.publicKey;
            } catch (error) {
                if (error.message === 'TokenAccountNotFoundError' || error.message === 'TokenInvalidAccountOwnerError') {
                    alert("Need to create stake account.");
                    setLoading(false);
                    return;
                } else {
                    console.log(error)
                }
            }
        }
        else {
            toTokenAccount = nftAccounts.value[0].pubkey;
        }

        const feeDepositor = await getAssociatedTokenAddress(mintFeePublicKey, publicKey);
        const balance = await connection.getTokenAccountBalance(feeDepositor);
        const lockFee = poolObject['feeAmount' + (stakeType + 1)].toNumber();

        if (balance.value.uiAmount < lockFee / LAMPORTS_PER_SOL) {
            alert("Your balance is not enough.");
            setLoading(false);
            return;
        }

        try {
            instructions.push(await program.instruction.stake(stakeType,
                {
                    accounts: {
                        // Stake instance.
                        pool: poolPublicKey,
                        vault: vaultPublicKey,
                        stakeToAccount: toTokenAccount,
                        // User.
                        user: userPubkey,
                        userStore: storePubkey,
                        owner: walletPubkey,
                        stakeFromAccount: nftAccount,
                        feeVault: poolObject.feeVault,
                        feeDepositor: feeDepositor,
                        // Program signers.
                        poolSigner,
                        tokenProgram: TOKEN_PROGRAM_ID,
                        metadataInfo: metadata
                    },
                }
            ))
            await confirmTransaction(instructions)
            console.log("Success!");
            setLoading(false);
            getAllNfts();
        } catch (err) {
            console.log(err)
            alert("Something went wrong! Please try again.");
            setLoading(false);
        }
    }

    const unStakeNFT = async (mintObj) => {
        if (loading) return;
        const [userPubkey] = await getStakeUserPubkey(publicKey);
        const [storePubkey] = await getStakeUserStorePubkey(publicKey, mintObj.storeId);
        const poolObject = await program.account.pool.fetch(poolPublicKey);

        const storeObject = await program.account.userStore.fetch(storePubkey);
        const stakedTime = storeObject.stakedTimes.find((time, ind) => storeObject.nftMints[ind].toBase58() === mintObj.mint);
        const stakedType = storeObject.types.find((ty, ind) => storeObject.nftMints[ind].toBase58() === mintObj.mint);
        const diffDays = ((new Date()).getTime() / 1000 - stakedTime.toNumber()) / (24 * 3600);
        const stakeTypeDays = poolObject['stakePeriod' + (stakedType + 1)];
        if (diffDays < stakeTypeDays) {
            alert("You need to wait " + parseInt(stakeTypeDays - diffDays + 1) + " days.");
            return;
        }

        setLoading(true);

        var mintPubKey = new PublicKey(mintObj.mint);

        let metadata = await getMetadata(mintPubKey);

        const [vaultPublicKey] = await getVaultPubkey();
        const [poolSigner] = await getPoolSigner();

        let nftAccounts = await connection.getTokenAccountsByOwner(poolSigner, {
            mint: mintPubKey
        })
        let nftAccount = nftAccounts.value[0].pubkey;

        let instructions = [];

        const toTokenAccount = await getAssociatedTokenAddress(
            mintPubKey,
            publicKey
        );

        const toTokenAccountInfo = await connection.getAccountInfo(toTokenAccount);
        if (toTokenAccountInfo === null) {
            instructions.push(
                createAssociatedTokenAccountInstruction(
                    publicKey,
                    toTokenAccount,
                    publicKey,
                    mintPubKey,
                )
            )
        }

        const feeDepositor = await getAssociatedTokenAddress(mintFeePublicKey, publicKey);

        try {
            instructions.push(await program.instruction.unstake(
                {
                    accounts: {
                        // Stake instance.
                        pool: poolPublicKey,
                        vault: vaultPublicKey,
                        stakeToAccount: nftAccount,
                        // User.
                        user: userPubkey,
                        userStore: storePubkey,
                        owner: publicKey,
                        stakeFromAccount: toTokenAccount,
                        feeVault: poolObject.feeVault,
                        feeDepositor,
                        // Program signers.
                        poolSigner,
                        // Misc.
                        clock: SYSVAR_CLOCK_PUBKEY,
                        tokenProgram: TOKEN_PROGRAM_ID,
                        metadataInfo: metadata
                    },
                }))
            await confirmTransaction(instructions)
            console.log("Success!");
            getAllNfts();
            setLoading(false);
        } catch (e) {
            alert("Something when wrong. Try again");
            console.log(e)
            setLoading(false);
        }
    }

    const getMetadata = async (mint) => {
        const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey(
            'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s',
        );
        return (
            await anchor.web3.PublicKey.findProgramAddress(
                [
                    Buffer.from('metadata'),
                    TOKEN_METADATA_PROGRAM_ID.toBuffer(),
                    mint.toBuffer(),
                ],
                TOKEN_METADATA_PROGRAM_ID,
            )
        )[0];
    };

    const confirmTransaction = async (instructions) => {
        if (instructions.length === 0) {
            return;
        }
        const transaction = new anchor.web3.Transaction().add(...instructions);
        const blockHash = await connection.getRecentBlockhash()
        transaction.feePayer = await publicKey
        transaction.recentBlockhash = await blockHash.blockhash
        for (let i = 0; i < instructions.length; i++) {
            if (instructions[i].keypair) {
                transaction.partialSign(instructions[i].keypair)
            }
        }
        const signed = await signTransaction(transaction)
        const signature = await connection.sendRawTransaction(signed.serialize())
        await connection.confirmTransaction(signature)
    }

    const decodeMetadata = (buffer) => {
        return borsh.deserializeUnchecked(METADATA_SCHEMA, Metadata, buffer);
    }

    const getParsedStakedNftData = async (nfts) => {
        try {
            let result = [];
            for (let i = 0; i < nfts.length; i++) {
                const mint = new PublicKey(nfts[i].mint);
                getMetadata(mint).then(metaPubkey => {
                    connection.getAccountInfo(metaPubkey).then(metadataObj => {
                        const metadataDecoded = decodeMetadata(
                            Buffer.from(metadataObj.data),
                        );
                        axios.get(metadataDecoded.data.uri).then(({ data }) => {
                            let parsedNft = result.find((nft) => nft.mint === mint.toBase58())
                            parsedNft.creators = metadataDecoded.data.creators.map((c) => new PublicKey(c.address));
                            parsedNft.creator = parsedNft.creators[0].toBase58();
                            parsedNft = {
                                ...parsedNft,
                                ...data
                            }

                            result = result.map((nft) => {
                                if (nft.mint === mint.toBase58()) {
                                    return parsedNft;
                                } else {
                                    return nft;
                                }
                            })
                            console.log(result)
                            setStakedNfts([...result]);
                        }).catch(e => {
                            console.log(e)
                            result = result.filter((nft) => nft.mint !== mint.toBase58())
                            setStakedNfts([...result]);
                        });
                    });
                });

                result.push({
                    mint: mint.toBase58(),
                    storeId: nfts[i].storeId,
                });
            }

            setStakedNfts(result);
        } catch (error) {
            console.log(error);
        }
    }
    const getParsedNftData = async (nfts) => {
        try {
            let result = [];
            for (let i = 0; i < nfts.length; i++) {
                const mint = new PublicKey(nfts[i].account.data.parsed.info.mint);
                getMetadata(mint).then(metaPubkey => {
                    connection.getAccountInfo(metaPubkey).then(metadataObj => {
                        const metadataDecoded = decodeMetadata(
                            Buffer.from(metadataObj.data),
                        );
                        axios.get(metadataDecoded.data.uri).then(({ data }) => {
                            let parsedNft = { mint }
                            parsedNft.creators = metadataDecoded.data.creators.map((c) => new PublicKey(c.address));
                            parsedNft.creator = parsedNft.creators[0].toBase58();
                            if (parsedNft.creator !== 'AGtNnt15RRX52RTzSmuPufGpy5gDCioQKR6Nr3EUeGaF') {
                                return;
                            }
                            parsedNft = {
                                ...parsedNft,
                                ...data
                            }

                            result.push(parsedNft);

                            console.log(result)
                            setParsedNfts([...result]);
                        }).catch(e => {
                            console.log(e)
                            // result = result.filter((nft) => nft.mint !== mint.toBase58())
                            // setParsedNfts([...result]);
                        });
                    });
                });
            }

            setParsedNfts(result);
        } catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
        if (publicKey) {
            getAllNfts()
        }
    }, [publicKey])

    useEffect(() => {
        getParsedNftData(nfts);
    }, [nfts])

    return (
        <div className='container stake'>
            <div className='header'>
                <div className='space'></div>
                <WalletModalProvider>
                    {
                        publicKey ?
                            <>
                                <WalletDisconnectButton className='connect' />
                                <WalletMultiButton className='connect'>Wallet Info</WalletMultiButton>
                            </> :
                            <WalletMultiButton className='connect' />
                    }
                </WalletModalProvider>
            </div>
            <div className='stake-title'>Stake Your Eunoia</div>
            <div className='row nfts-wrapper'>
                {
                    parsedNfts.map((nft, i) => nft.creator === 'AGtNnt15RRX52RTzSmuPufGpy5gDCioQKR6Nr3EUeGaF' ?
                        <div className='nft-card' key={i}>
                            <div className='nft-image'>
                                <img loading='lazy' src={nft.image} />
                            </div>
                            <div className='nft-metadata'>
                                <div className='row'>
                                    <div className='col'>Name: </div>
                                    <div className='col'>{nft.name}</div>
                                </div>
                            </div>
                            <div className='stake-button'>
                                <button onClick={(e) => stakeNFT(nft)}>Stake</button>
                            </div>
                        </div> : null
                    )
                }
            </div>
            <div className='stake-title'>Unstake Your Eunoia</div>
            <div className='row nfts-wrapper'>
                {
                    stakedNfts.map((nft, i) =>
                        <div className='nft-card' key={i}>
                            <div className='nft-image'>
                                <img loading='lazy' src={nft.image} />
                            </div>
                            <div className='nft-metadata'>
                                <div className='row'>
                                    <div className='col'>Name: </div>
                                    <div className='col'>{nft.name}</div>
                                </div>
                            </div>
                            <div className='stake-button'>
                                <button onClick={(e) => unStakeNFT(nft)}>Unstake</button>
                            </div>
                        </div>
                    )
                }
            </div>
        </div>
    )
}
export default Stake;