import React from 'react';
import NftImg from "../assets/img/nft/9950.png";
const Sell = () => {
    return (<div class="container">
        <div class="row">
            <div class="col-12 pt-4 px-0">
                <h1>Sell Items</h1>
                <h2>Komoverse #9950</h2>
            </div>
            <div class="col-12 col-lg-6">
                <img src={NftImg} class="my-2" alt="Komoverse #9950" />
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
                <input type="number" class="form-control" />
                <span class="d-block mt-3">Listing Price (KOMO)</span>
                <input type="number" class="form-control" />
                <button class="mt-3 btn btn-filter btn-lg btn-primary">SELL NOW</button>
            </div>
        </div>
    </div>)
}

export default Sell;