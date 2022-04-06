import React from 'react';
import { useParams } from 'react-router-dom';

import NftImage from "../assets/img/nft/9950.png"
const Buy = () => {
    const { mint } = useParams();
    return (<div class="container">
        <div class="row">
            <div class="col-12 pt-4 px-0">
                <h1>Buy Items</h1>
                <h2>Komoverse #9950</h2>
            </div>
            <div class="col-12 col-lg-6">
                <img src={NftImage} class="my-2" alt="Komoverse #9950" />
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
                        <span class="ms-2 fs-5">4.5 SOL</span>
                        <button class="mt-3 btn btn-filter btn-lg btn-primary">BUY NOW (SOL)</button>
                    </div>
                    <div class="col-6">
                        <img src="assets/img/komo-coin.webp" class="buy-currency" alt="" />
                        <span class="ms-2 fs-5">225 KOMO</span>
                        <button class="mt-3 btn btn-filter btn-lg btn-primary">BUY NOW (KOMO)</button>
                    </div>
                </div>
            </div>
        </div>
    </div>)
}

export default Buy;