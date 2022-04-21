import * as anchor from '@project-serum/anchor'
import { Marketplace as MarketplaceDefinition, IDL } from './types/marketplace'
import { MARKETPLACE_PROGRAM_ID } from './constant'
import { Keypair, PublicKey, TransactionInstruction } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { _getAssociatedTokenAddress, getNftVaultPDA, getSellOrderPDA, getEscrowPDA, getBuyOfferPDA } from './getPDAs'
import { getMetadata } from './metaplex'
import { programs } from '@metaplex/js'
import idl from './types/marketplace.json'
import { IdlAccounts, web3 } from "@project-serum/anchor";

const { Metadata } =
    programs.metadata

export class Collection {
    program: anchor.Program<MarketplaceDefinition>
    marketplacePDA: PublicKey
    collectionPDA: PublicKey

    private collectionCache?: IdlAccounts<MarketplaceDefinition>["collection"]

    constructor(
        provider: anchor.Provider,
        marketplacePDA: PublicKey,
        collectionPDA: PublicKey,
    ) {
        // @ts-ignore
        this.program = new anchor.Program(idl, MARKETPLACE_PROGRAM_ID, provider)

        this.marketplacePDA = marketplacePDA
        this.collectionPDA = collectionPDA
    }

    async sellAssetInstruction(
        nftMint: PublicKey,
        sellerNftAccount: PublicKey,
        sellerDestination: PublicKey,
        price: anchor.BN,
        amount: anchor.BN,
        seller: PublicKey,
    ): Promise<TransactionInstruction> {
        let programNftVaultPDA = await getNftVaultPDA(nftMint)
        let sellOrderPDA = await getSellOrderPDA(sellerNftAccount, price)

        let metadataPDA = await Metadata.getPDA(nftMint)
        return await this.program.methods.createSellOrder(price, amount, sellerDestination).accounts(
            {
                payer: seller,
                sellerNftTokenAccount: sellerNftAccount,
                marketplace: this.marketplacePDA,
                collection: this.collectionPDA,
                mint: nftMint,
                metadata: metadataPDA,
                vault: programNftVaultPDA,
                sellOrder: sellOrderPDA,
                systemProgram: anchor.web3.SystemProgram.programId,
                tokenProgram: TOKEN_PROGRAM_ID,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            }
        ).instruction()
    }

    async sellAsset(
        nftMint: PublicKey,
        sellerNftAccount: PublicKey,
        sellerDestination: PublicKey,
        price: anchor.BN,
        amount: anchor.BN,
        seller: PublicKey
    ): Promise<string> {
        let ix = await this.sellAssetInstruction(
            nftMint, sellerNftAccount, sellerDestination,
            price, amount, seller
        )
        return this._sendInstruction(ix, [])
    }

    async removeSellOrderInstruction(
        nftMint: PublicKey,
        sellerNftAccount: PublicKey,
        sellOrderPDA: PublicKey,
        amount: anchor.BN,
        seller: PublicKey,
    ): Promise<TransactionInstruction> {
        let programNftVaultPDA = await getNftVaultPDA(nftMint)
        return await this.program.methods.removeSellOrder(amount).accounts({
            authority: seller,
            sellerNftTokenAccount: sellerNftAccount,
            vault: programNftVaultPDA,
            sellOrder: sellOrderPDA,
            systemProgram: anchor.web3.SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        }).instruction()
    }

    async removeSellOrder(
        nftMint: PublicKey,
        sellerNftAccount: PublicKey,
        sellOrderPDA: PublicKey,
        amount: anchor.BN,
        seller: Keypair,
    ): Promise<string> {
        let ix = await this.removeSellOrderInstruction(
            nftMint,
            sellerNftAccount,
            sellOrderPDA,
            amount,
            seller.publicKey,
        )
        return this._sendInstruction(ix, [seller])
    }

    async addToSellOrderInstruction(
        nftMint: PublicKey,
        sellerNftAccount: PublicKey,
        sellOrderPDA: PublicKey,
        amount: anchor.BN,
        seller: PublicKey,
    ): Promise<TransactionInstruction> {
        let programNftVaultPDA = await getNftVaultPDA(nftMint)
        return await this.program.methods.addQuantityToSellOrder(amount).accounts({
            authority: seller,
            sellerNftTokenAccount: sellerNftAccount,
            vault: programNftVaultPDA,
            sellOrder: sellOrderPDA,
            systemProgram: anchor.web3.SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        }).instruction()
    }

    async addToSellOrder(
        nftMint: PublicKey,
        sellerNftAccount: PublicKey,
        sellOrderPDA: PublicKey,
        amount: anchor.BN,
        seller: Keypair,
    ): Promise<string> {
        let ix = await this.addToSellOrderInstruction(
            nftMint,
            sellerNftAccount,
            sellOrderPDA,
            amount,
            seller.publicKey,
        )
        return this._sendInstruction(ix, [seller])
    }

    async buyInstruction(
        nftMint: PublicKey,
        sellOrdersPDA: PublicKey[],
        buyerNftAccount: PublicKey,
        buyerPayingAccount: PublicKey,
        wanted_quantity: anchor.BN,
        buyer: PublicKey,
    ): Promise<TransactionInstruction> {
        let programNftVaultPDA = await getNftVaultPDA(nftMint)
        let marketplaceAccount = await this.program.account.marketplace.fetch(this.marketplacePDA)

        let metadata = await getMetadata(
            this.program?.provider.connection,
            nftMint,
        )


        console.log(metadata, "buyInstruction")
        // let metadataPDA = await Metadata.getPDA(nftMint)

        let collection = await this.getCollection()
        let creatorsAccounts = []

        if (!collection.ignoreCreatorFee) {
            for (let creator of metadata.data.creators) {
                let creatorAddress = new PublicKey(creator.address)
                let creatorATA = await _getAssociatedTokenAddress(creatorAddress, marketplaceAccount.mint)

                creatorsAccounts.push(
                    { pubkey: creatorATA, isWritable: true, isSigner: false },
                )
            }
        }

        let sellOrders = []
        for (let sellOrderPDA of sellOrdersPDA) {
            let so = await this.program.account.sellOrder.fetch(sellOrderPDA)
            sellOrders.push({ pubkey: sellOrderPDA, isWritable: true, isSigner: false })
            sellOrders.push({ pubkey: so.destination, isWritable: true, isSigner: false })
        }

        return await this.program.methods.buy(wanted_quantity).accounts({
            buyer: buyer,
            buyerNftTokenAccount: buyerNftAccount,
            buyerPayingTokenAccount: buyerPayingAccount,
            marketplace: this.marketplacePDA,
            marketplaceDestAccount: marketplaceAccount.feesDestination,
            collection: this.collectionPDA,
            // metadata: await Metadata.getPDA(metadata.mint),
            metadata: await Metadata.getPDA(nftMint),
            vault: programNftVaultPDA,
            systemProgram: anchor.web3.SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
        }).remainingAccounts([
            ...creatorsAccounts,
            ...sellOrders,
        ]).instruction()
    }

    async buy(
        nftMint: PublicKey,
        sellOrdersPDA: PublicKey[],
        buyerNftAccount: PublicKey,
        buyerPayingAccount: PublicKey,
        wanted_quantity: anchor.BN,
        buyer: PublicKey,
    ): Promise<string> {
        let ix = await this.buyInstruction(
            nftMint,
            sellOrdersPDA,
            buyerNftAccount,
            buyerPayingAccount,
            wanted_quantity,
            buyer,
        )

        return this._sendInstruction(ix, [])
    }

    async getCollection(): Promise<IdlAccounts<MarketplaceDefinition>["collection"]> {
        if (this.collectionCache) {
            return this.collectionCache
        }
        this.collectionCache = await this.program.account.collection.fetch(this.collectionPDA)
        return this.collectionCache
    }

    async createNftOffer(
        nftMint: PublicKey,
        buyerNftTokenAccount: PublicKey,
        buyerTokenAccount: PublicKey,
        buyer: PublicKey,
        price: anchor.BN,
    ): Promise<string> {
        let metadataPDA = await Metadata.getPDA(nftMint)
        let marketplaceAccount = await this.program.account.marketplace.fetch(this.marketplacePDA)
        let escrowPDA = await getEscrowPDA(this.marketplacePDA, marketplaceAccount.mint)
        let buyOfferPDA = await getBuyOfferPDA(this.marketplacePDA, buyer, nftMint, price);

        let ix = await this.program.methods.createBuyOffer(new anchor.BN(price.toString())).accounts({
            payer: buyer,
            nftMint: nftMint,
            metadata: metadataPDA,
            marketplace: this.marketplacePDA,
            collection: this.collectionPDA,
            escrow: escrowPDA,
            buyerPayingAccount: buyerTokenAccount,
            buyerNftAccount: buyerNftTokenAccount,
            buyOffer: buyOfferPDA,
            systemProgram: anchor.web3.SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        }).instruction();

        return this._sendInstruction(ix, [])
    }

    async excuteNftOffer(
        nftMint: PublicKey,
        buyerNftTokenAccount: PublicKey,
        adminTokenAccount: PublicKey,
        sellerTokenAccount: PublicKey,
        sellerNftAssociatedTokenAccount: PublicKey,
        buyer: PublicKey,
        seller: PublicKey,
        price: anchor.BN,
    ): Promise<string> {
        let metadataPDA = await Metadata.getPDA(nftMint)
        let marketplaceAccount = await this.program.account.marketplace.fetch(this.marketplacePDA)
        let escrowPDA = await getEscrowPDA(this.marketplacePDA, marketplaceAccount.mint)
        let buyOfferPDA = await getBuyOfferPDA(this.marketplacePDA, buyer, nftMint, price);

        let ix = await this.program.methods.executeOffer().accounts({
            seller: seller,
            buyer: buyer,
            marketplace: this.marketplacePDA,
            collection: this.collectionPDA,
            marketplaceDestAccount: adminTokenAccount,
            escrow: escrowPDA,
            sellerFundsDestAccount: sellerTokenAccount,
            destination: buyerNftTokenAccount,
            sellerNftAccount: sellerNftAssociatedTokenAccount,
            buyOffer: buyOfferPDA,
            metadata: metadataPDA,
            systemProgram: anchor.web3.SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        }).remainingAccounts([{ pubkey: adminTokenAccount, isWritable: true, isSigner: false }]).instruction();

        return this._sendInstruction(ix, [])
    }

    async removeNftOffer(
        nftMint: PublicKey,
        buyerTokenAccount: PublicKey,
        buyer: PublicKey,
        price: anchor.BN,
    ) {
        // let metadataPDA = await Metadata.getPDA(nftMint)
        let marketplaceAccount = await this.program.account.marketplace.fetch(this.marketplacePDA)
        let escrowPDA = await getEscrowPDA(this.marketplacePDA, marketplaceAccount.mint)
        let buyOfferPDA = await getBuyOfferPDA(this.marketplacePDA, buyer, nftMint, price);

        let ix = await this.program.methods.removeBuyOffer().accounts({
            buyer: buyer,
            buyerPayingAccount: buyerTokenAccount,
            marketplace: this.marketplacePDA,
            escrow: escrowPDA,
            buyOffer: buyOfferPDA,
            systemProgram: anchor.web3.SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        }).instruction();

        return this._sendInstruction(ix, [])
    }

    _sendInstruction(ix: TransactionInstruction, signers: Keypair[]): Promise<string> {
        let tx = new web3.Transaction()
        tx.add(ix)
        return this.program.provider.send(tx, signers)
    }

}