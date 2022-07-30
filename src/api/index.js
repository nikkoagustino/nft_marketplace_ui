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