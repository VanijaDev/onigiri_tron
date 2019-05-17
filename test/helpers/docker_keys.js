module.exports = {
    priv: ["da146374a75310b9666e834ee4ad0866d6f4035967bfc76217c5a495fff9f0d0", "5c7df2eeb96ab9ea12488c988cd0b4536aa9a7f228cfc5afa605dc89c2f367a9", "8bc446a5215765d704ee2ca91f60cd040c5bd0b2437702f5cd0ecd6f65c5c1c0", "04d9a853fe732f3b82517bc0677cdc48179f0d51c5874567b8288174a35c8e06", "9a9a0b97609e4f886d9380318362a226b641def07f5df13989d0b703d8a85471", "00555a2e4a7f769ea4079bc95fd086afb1728722cfb3b06ab0a01fb56714918b", "8077e7058a78dc19fac768319da0032fd51cdf65e92e0b5ec2dc6c11366655f6", "cdc239ed9a623ad87c51cf8348046dc33b985d748f876e7d8ab970a27b72108e", "ad03862cd9285f7a8d11e53d49ea27171d8f9ee83105c45e4ae78c49dc422380", "a556b064902e7fc078431584ddf76a3d600a39e67e12e9fa5b851cb7428ddbc4"],
    pub: ["TPL66VK2gCXNCD7EJg9pgJRfqcRazjhUZY", "TGYv1XCpyWn9YjAoyE6ZTMhvUHdLq1rZi8", "TBB8AyUHfgCoQL2mDZNcLfhjaRG2kXhdRE", "TXWBW1AZ9AhoVSez5sWmbjH7hGYSUDeC5j", "TLNc8X8Fk9V1EJCoB7TK5UkSSZk9iKnCFP", "TXTmihAbBYZEXnYQrNKa1FkXCLuWWechoW", "TRbU1QHy3EtoWQmchsRvb6Q3YRVuZY3k1E", "TFs1WuvN61KC4A4a2pFF9XPNcaFVeZeDHr", "TF5eGMJPRxTQdndUBYJbbVWCUnQriQ4Lzu", "TCGa7nPt6xegdnWpxamXv7Bvx1a1EX3tT5"]

    /**
     * Start docker:
      docker run -it \
      -p 9090:9090 \
      --rm \
      --name tron \
      -e "defaultBalance=10000000" \
      -e "useDefaultPrivateKey=true" \
      trontools/quickstart
     */
}