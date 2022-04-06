import React from 'react';
import DefaultPrevImg from "../assets/img/placeholder.jpg";
const Mint = () => {
    return (<div class="container">
        <div class="row">
            <div class="col-12 pt-4 px-0">
                <h1>Create New Item</h1>
            </div>
            <div class="col-12 col-lg-6">
                <span class="d-block">Image</span>
                <input type="file" accept="image/*" class="form-control" />
                <img src={DefaultPrevImg} class="my-2" alt="Komoverse #9950" />
            </div>
            <div class="col-12 col-lg-6">
                <span class="d-block">Item Name</span>
                <input type="text" class="form-control" />
                <span class="d-block mt-3">Description</span>
                <textarea class="form-control" rows="4"></textarea>
                <span class="d-block mt-3">Total Supply</span>
                <input type="number" class="form-control" />
                <span class="d-block mt-3">Listing Price (SOL)</span>
                <input type="number" class="form-control" />
                <span class="d-block mt-3">Listing Price (KOMO)</span>
                <input type="number" class="form-control" />
                <button class="mt-3 btn btn-filter btn-lg btn-primary">GENERATE NFT AND SELL NOW</button>
            </div>
        </div>
    </div>)
}
export default Mint;