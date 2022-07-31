import axios from 'axios'

const API_KEY = 'a225b6f6671086a9c2f540262212136243df4e25cc5058bf4878cab56a10b735';
export const getTransactions = async (start, end) => {
    const { data } = await axios.post('https://staging.komoverse.io/v1/get-transaction', {
        'api_key': API_KEY,
        'tx_type': 'nft',
        'date_start': start,
        'date_end': end
    });

    return data;
}

export const getUserInfoByWalletId = async (wallet) => {
    const { data } = await axios.post('https://staging.komoverse.io/v1/account-info/wallet', {
        'api_key': API_KEY,
        'wallet_pubkey': wallet
    })

    return data;
}

export const addTransaction = async (txid, from, to, type, amount, currency) => {
    const { data } = await axios.post('https://staging.komoverse.io/v1/add-transaction', {
        'api_key': API_KEY,
        'seller': from,
        'buyer': to,
        'tx_id': txid,
        'tx_type': type,
        'amount': amount,
        'currency': currency,
    })

    return data;
}