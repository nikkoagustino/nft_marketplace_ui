import React, { useState, useMemo } from "react";
import { Link, useLocation } from 'react-router-dom';
import {
    ProSidebar,
    Menu,
    MenuItem,
    SidebarHeader,
    SidebarFooter,
    SidebarContent,
} from "react-pro-sidebar";

import { FaBoxOpen, FaTractor, FaUserCog } from "react-icons/fa";
import { FiHome, FiLogOut, FiArrowLeftCircle, FiArrowRightCircle, FiShoppingCart } from "react-icons/fi";

import {
    WalletIcon,
    WalletModalProvider,
    WalletMultiButton
} from '@solana/wallet-adapter-react-ui';

import "react-pro-sidebar/dist/css/styles.css";
import "./Base.css";
import Logo from "../../assets/img/logo.png";
import SmallLogo from "../../assets/img/logo2.png";
import { useWallet } from "@solana/wallet-adapter-react";
import { useStore } from "../../zustand";

const Base = () => {
    const location = useLocation();
    const { publicKey, wallet } = useWallet();
    //create initial menuCollapse state using useState hook
    const [menuCollapse, setMenuCollapse] = useState(false)

    const { setExpandOrCollapce } = useStore();

    const base58 = useMemo(() => publicKey === null || publicKey === void 0 ? void 0 : publicKey.toBase58(), [publicKey]);
    const content = useMemo(() => {
        if (!wallet || !base58)
            return null;
        return base58.slice(0, 4) + '..' + base58.slice(-4);
    }, [wallet, base58]);

    //create a custom function that will change menucollapse state from false to true and true to false
    const menuIconClick = () => {
        //condition checking to change state from true to false and vice versa
        menuCollapse ? setMenuCollapse(false) : setMenuCollapse(true);
        setExpandOrCollapce();
    };

    return (
        <>
            <div id="base" className={menuCollapse ? 'collapsed' : ''}>
                {/* collapsed props to change menu size using menucollapse state */}
                <ProSidebar collapsed={menuCollapse}>
                    <SidebarHeader>
                        <div className="logotext">
                            {/* small and big change using menucollapse state */}
                            <p>{menuCollapse ? <img src={SmallLogo} alt="Komoverse (Komodo Metaverse) Logo" /> : <img src={Logo} alt="Komoverse (Komodo Metaverse) Logo" />}</p>
                        </div>
                    </SidebarHeader>
                    <SidebarContent>
                        <Menu iconShape="square">
                            <MenuItem active={location.pathname === '/'} icon={<FiHome />} >
                                <Link className='nav-link' to={'/'}>Home</Link>
                            </MenuItem>
                            <MenuItem active={location.pathname === '/marketplace'} icon={<FiShoppingCart />}>
                                <Link className='nav-link' to={'/marketplace'}>Marketplace</Link>
                            </MenuItem>
                            <MenuItem active={location.pathname === '/komodo_express'} icon={<FaTractor />}>
                                <Link className='nav-link' to={'/komodo_express'}>Komodo Express</Link>
                            </MenuItem>
                            <WalletModalProvider>
                                <WalletMultiButton className='btn btn-primary'>
                                    {!publicKey ? (menuCollapse ? 'W' : 'Select Wallet') : (
                                        menuCollapse ? <img src={WalletIcon} alt="" /> : <>
                                            <img src={WalletIcon} alt="" />
                                            {content}
                                        </>
                                    )}
                                </WalletMultiButton>
                            </WalletModalProvider>
                            {
                                publicKey && (<>
                                    <MenuItem active={location.pathname === '/account'} icon={<FaUserCog />}>
                                        <Link className='nav-link' to={'/account'}>Account</Link>
                                    </MenuItem>
                                    <MenuItem active={location.pathname === '/inventory'} icon={<FaBoxOpen />}>
                                        <Link className='nav-link' to={'/inventory'}>Inventory</Link>
                                    </MenuItem>
                                </>)
                            }
                        </Menu>
                    </SidebarContent>
                    <SidebarFooter>
                        <Menu iconShape="square">
                            <MenuItem icon={<FiLogOut />}>Logout</MenuItem>
                        </Menu>
                    </SidebarFooter>
                </ProSidebar>
                <div className="closemenu" onClick={menuIconClick}>
                    {/* changing menu collapse icon on click */}
                    {menuCollapse ? (
                        <FiArrowRightCircle />
                    ) : (
                        <FiArrowLeftCircle />
                    )}
                </div>
            </div>
        </>
    );
};

export default Base;