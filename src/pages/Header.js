import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    WalletModalProvider,
    WalletMultiButton
} from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { getUserInfoByWalletId } from '../api';
import { useStore } from 'zustand';
const Header = () => {
    const { publicKey } = useWallet();
    const { setUserInfo } = useStore();
    useEffect(() => {
        if (publicKey) {
            getUserInfoByWalletId(publicKey.toBase58()).then((data) => {
                console.log('userInfo: ', data);
                setUserInfo(data)
            });
        }
    }, [publicKey])
    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark ">
            <div className="container-fluid">
                <a className="navbar-brand p-0" href="#">
                    <img src="https://komoverse.io/assets/img/logo.png" alt="Komoverse (Komodo Metaverse) Logo" />
                </a>
                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarSupportedContent">
                    <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                        <li className="nav-item ms-3">
                            <Link className='nav-link' to={'/'}><i className="fas fa-layer-group"></i> &nbsp; Dashboard</Link>
                        </li>
                        <li className="nav-item ms-3">
                            <Link className='nav-link' to={'/marketplace'}><i className="fas fa-shopping-basket"></i> &nbsp; Marketplace</Link>
                        </li>
                    </ul>
                    <div className="d-flex">
                        <Link className='nav-link' to={'/account'}><i className="fas fa-user-cog"></i> &nbsp; Account</Link>
                        <WalletModalProvider>
                            <WalletMultiButton className='btn btn-primary' />
                        </WalletModalProvider>
                    </div>
                </div>
            </div>
        </nav>
    )
}
export default Header;