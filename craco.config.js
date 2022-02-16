module.exports = {
  webpack: {
    configure: {
      resolve: {
        fallback: {
          util: require.resolve("util"),
          crypto: require.resolve("crypto-browserify"),
          stream: require.resolve("stream-browserify"),
        },
      },
    },
  },
};
