module.exports = {
    module: {
        rules: [
            {
                test: /\.js$/,
                enforce: "pre",
                use: ["source-map-loader"],
            },
        ],
    },
    ignoreWarnings: [/Failed to parse source map/],
    resolve: {
        fallback: {
            url: require.resolve('url'),
            assert: require.resolve('assert'),
            crypto: require.resolve('crypto-browserify'),
            http: require.resolve('stream-http'),
            https: require.resolve('https-browserify'),
            os: require.resolve('os-browserify/browser'),
            buffer: require.resolve('buffer'),
            stream: require.resolve('stream-browserify'),
        }
    }
};