import React, { useState, useEffect } from 'react';
import SolanaCoinImg from "../assets/img/solana-coin.webp"
import KomoCoinImg from "../assets/img/komo-coin.webp"
import KomoNftImg from "../assets/img/nft/9950.png"
import { Link } from 'react-router-dom';

import { getListedNfts } from "../app/api/index";

import * as anchor from "@project-serum/anchor";
import { useConnection, useWallet } from '@solana/wallet-adapter-react';

const opts = {
    preflightCommitment: "processed"
}

const Marketplace = () => {

    const { connection } = useConnection();
    const { publicKey, signTransaction } = useWallet();
    const wallet = useWallet();

    async function getProvider() {
        const provider = new anchor.Provider(
            connection, wallet, opts.preflightCommitment,
        );
        return provider;
    }

    const [nftList, setNftList] = useState([]);


    const [activeTab, setActiveTab] = useState(0);
    const [selectedSpecies, setSpecies] = useState(0);
    const [selectedGender, setGender] = useState(0);
    const [gameNftFilterType, setGameNftFilterType] = useState(0);
    const [filterMinPrice, setFilterMinPrice] = useState(0);
    const [filterMaxPrice, setFilterMaxPrice] = useState(0);
    const [breedCount, setBreedCount] = useState(-1);
    const [nfts, setNfts] = useState([]);
    const [gameNfts, setGameNfts] = useState([]);
    const [filterCurrency, setFilterCurrency] = useState("sol");

    const applyFilter = () => {
        if (activeTab === 0) {

        } else {

        }
    }

    const resetFilter = () => {
        if (activeTab === 0) {
            setGender(0)
            setSpecies(0)
            setBreedCount(0)
        } else {
            setFilterMinPrice(0)
            setFilterMaxPrice(0)
            setFilterCurrency('sol')
            setGameNftFilterType(0)
        }
    }

    useEffect(() => {
        setNfts([{
            name: 'Komoverse #9950',
            breedCount: 0,
            img: KomoNftImg,
            solPrice: 4.5,
            komoPrice: 200,
            mint: "222222222"
        }])
        setGameNfts([{
            name: 'Komoverse #9950',
            breedCount: 0,
            img: KomoNftImg,
            solPrice: 4.5,
            komoPrice: 200,
            description: 'When player use this item, grant extra 1 card draw from the deck. This item can be used once per match.'
        }])
    }, [])


    useEffect(async () => {
        if (publicKey) {
            console.log("artwork effect")
            let cProvider = await getProvider();
            let sellOrders = await getListedNfts(cProvider);
            if (sellOrders.length) {
                setNftList(sellOrders)
            }
        }
    }, [publicKey])

    return (<div className="container-fluid">
        <div className="row">
            <div className="col-12 pt-4 px-0">
                <div className="col-12 pt-4 px-0">
                    <ul className="nav nav-pills border-bottom" id="pills-tab" role="tablist">
                        <li className="nav-item ms-3" role="presentation">
                            <button className={"nav-link fw-bold" + (activeTab === 0 ? " active" : "")} id="pills-nft-tab" onClick={() => setActiveTab(0)}>Komoverse NFTs</button>
                        </li>
                        <li className="nav-item" role="presentation">
                            <button className={"nav-link fw-bold" + (activeTab === 1 ? " active" : "")} id="pills-items-tab" onClick={() => setActiveTab(1)}>In-Game Items</button>
                        </li>
                    </ul>
                    <div className="tab-content" id="pills-tabContent">
                        <div className={"tab-pane fade" + (activeTab === 0 ? '  show active' : '')} id="pills-nft">
                            <div className="row m-0">
                                <div className="col-lg-2 p-3 min-vh-100 border-end">
                                    <span className="fw-bold fs-4 d-block mb-3">Filter</span>
                                    <span className="fw-bold">Species</span>
                                    <div className="row row-cols-lg-2 mb-3">
                                        <div className="col p-1">
                                            <button className={"btn btn-filter" + (selectedSpecies === 0 ? " btn-active" : " btn-secondary")} onClick={() => setSpecies(0)}>Lizard</button>
                                        </div>
                                        <div className="col p-1">
                                            <button className={"btn btn-filter" + (selectedSpecies === 1 ? " btn-active" : " btn-secondary")} onClick={() => setSpecies(1)}>Chameleon</button>
                                        </div>
                                        <div className="col p-1">
                                            <button className={"btn btn-filter" + (selectedSpecies === 2 ? " btn-active" : " btn-secondary")} onClick={() => setSpecies(2)}>Komodo</button>
                                        </div>
                                        <div className="col p-1">
                                            <button className={"btn btn-filter" + (selectedSpecies === 3 ? " btn-active" : " btn-secondary")} onClick={() => setSpecies(3)}>Dragon</button>
                                        </div>
                                    </div>
                                    <span className="fw-bold">Gender</span>
                                    <div className="row row-cols-lg-3 mb-3">
                                        <div className="col p-0 pe-1"><button className={"btn btn-filter" + (selectedGender === 0 ? " btn-active" : " btn-secondary")} onClick={() => setGender(0)}>Male</button></div>
                                        <div className="col p-0 pe-1"><button className={"btn btn-filter" + (selectedGender === 1 ? " btn-active" : " btn-secondary")} onClick={() => setGender(1)}>Female</button></div>
                                        <div className="col p-0 pe-1"><button className={"btn btn-filter" + (selectedGender === 2 ? " btn-active" : " btn-secondary")} onClick={() => setGender(2)}>Child</button></div>
                                    </div>

                                    <span className="fw-bold">Breed Count</span>
                                    <div className="row row-cols-lg-3 mb-3">
                                        <input type="range" className="form-range" min="-1" max="7" step="1" value={breedCount} onChange={(e) => setBreedCount(e.target.value)} />
                                    </div>

                                    <div className="row">
                                        <div className="col-12"><button className="btn btn-filter btn-lg btn-primary fw-bold fs-6" onClick={() => applyFilter()}>Apply Filter</button></div>
                                        <div className="col-12"><button className="btn btn-filter btn-lg btn-primary fw-bold fs-6" onClick={() => resetFilter()}>Reset Filter</button></div>
                                    </div>
                                </div>
                                <div className="col-lg-10 p-3">
                                    <div className="row">
                                        <div className="col-6 col-lg-8">
                                            <h3 className="fw-bold">{nftList.length} NFTs</h3>
                                        </div>
                                        <div className="d-none p-0 d-lg-inline-block col-lg-1 align-baseline">
                                            Sort by :
                                        </div>
                                        <div className="col-6 col-lg-3">
                                            <select name="" id="" className="form-select">
                                                <option value="">Price: Low to High</option>
                                                <option value="">Price: High to Low</option>
                                                <option value="">Name: Ascending</option>
                                                <option value="">Name: Descending</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="row mt-4">
                                        {
                                            nftList.map((nft, ind) => <div className="col-12 col-md-4 col-lg-3" key={ind}><Link to={"/buy/" + nft.mint}>
                                                <div className="listing-box mb-3 p-3">
                                                    <span className="title">{nft.data.name}</span>
                                                    <img src={nft.data.image} className="my-2" alt={nft.data.name ? nft.data.name : ""} />
                                                    <span className="breed">Breed Count: {"0"}</span>
                                                    <div className="row fw-bold">
                                                        <div className="col-6">
                                                            <img src={SolanaCoinImg} alt="SOL" className="currency" />
                                                            {nft.account.solPrice.toString() / (10 ** 9)} SOL
                                                        </div>
                                                        <div className="col-6">
                                                            <img src={KomoCoinImg} alt="KOMO" className="currency" />
                                                            {nft.account.tokenPrice.toString() / (10 ** 9)} KOMO
                                                        </div>
                                                    </div>
                                                </div>
                                            </Link>
                                            </div>)
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className={"tab-pane fade" + (activeTab === 1 ? '  show active' : '')} id="pills-items">
                            <div className="row m-0">
                                <div className="col-lg-2 p-3 min-vh-100 border-end">
                                    <span className="fw-bold fs-4 d-block mb-3">Filter</span>
                                    <span className="fw-bold">Item Type</span>
                                    <div className="row row-cols-lg-2 mb-3">
                                        <div className="col p-1">
                                            <button className={"btn btn-filter " + (gameNftFilterType === 0 ? "btn-active" : "btn-secondary")} onClick={() => setGameNftFilterType(0)}>Skins</button>
                                        </div>
                                        <div className="col p-1">
                                            <button className={"btn btn-filter " + (gameNftFilterType === 1 ? "btn-active" : "btn-secondary")} onClick={() => setGameNftFilterType(1)}>Consumable</button>
                                        </div>
                                        <div className="col p-1">
                                            <button className={"btn btn-filter " + (gameNftFilterType === 2 ? "btn-active" : "btn-secondary")} onClick={() => setGameNftFilterType(2)}>Land</button>
                                        </div>
                                    </div>

                                    <span className="fw-bold">Price</span>
                                    <div className="row mb-3">
                                        <div className="col">
                                            Min
                                            <input type="number" className="form-control" value={filterMinPrice} onChange={(e) => setFilterMinPrice(parseFloat(e.target.value))} />
                                            Max
                                            <input type="number" className="form-control" value={filterMaxPrice} onChange={(e) => setFilterMaxPrice(parseFloat(e.target.value))} />
                                            <div className="form-check form-check-inline">
                                                <input className="form-check-input" type="radio" name="inlineRadioOptions" id="inlineRadio1" value="sol" onChange={() => setFilterCurrency('sol')} checked={filterCurrency === 'sol'} />
                                                <label className="form-check-label" htmlFor="inlineRadio1">SOL</label>
                                            </div>
                                            <div className="form-check form-check-inline">
                                                <input className="form-check-input" type="radio" name="inlineRadioOptions" id="inlineRadio2" value="komo" onChange={() => setFilterCurrency('komo')} checked={filterCurrency === 'komo'} />
                                                <label className="form-check-label" htmlFor="inlineRadio2">KOMO</label>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="row">
                                        <div className="col-12"><button className="btn btn-filter btn-lg btn-primary fw-bold fs-6" onClick={() => applyFilter()}>Apply Filter</button></div>
                                        <div className="col-12"><button className="btn btn-filter btn-lg btn-primary fw-bold fs-6" onClick={() => resetFilter()}>Reset Filter</button></div>
                                    </div>
                                </div>
                                <div className="col-lg-10 p-3">
                                    <div className="row">
                                        <div className="col-6 col-lg-8">
                                            <h3 className="fw-bold">{gameNfts.length} Items</h3>
                                        </div>
                                        <div className="d-none p-0 d-lg-inline-block col-lg-1 align-baseline">
                                            Sort by :
                                        </div>
                                        <div className="col-6 col-lg-3">
                                            <select name="" id="" className="form-select">
                                                <option value="">Price: Low to High</option>
                                                <option value="">Price: High to Low</option>
                                                <option value="">Name: Ascending</option>
                                                <option value="">Name: Descending</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="col-12 col-md-4 col-lg-3">
                                        {
                                            gameNfts.map((gameNft, ind) => <div className="listing-box mb-3 p-3" key={ind}>
                                                <span className="title">{gameNft.name}</span>
                                                <img src={gameNft.img} className="my-2" alt={gameNft.name} />
                                                <div className="row">
                                                    <div className="col-12">{gameNft.description}</div>
                                                </div>
                                                <div className="row mt-2 fw-bold">
                                                    <div className="col-6">
                                                        <img src={SolanaCoinImg} alt="SOL" className="currency" />
                                                        {gameNft.solPrice} SOL
                                                    </div>
                                                    <div className="col-6">
                                                        <img src={KomoCoinImg} alt="KOMO" className="currency" />
                                                        {gameNft.komoPrice} KOMO
                                                    </div>
                                                </div>
                                            </div>)
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>)
}
export default Marketplace;