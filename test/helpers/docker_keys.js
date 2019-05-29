module.exports = {
    priv: ["da146374a75310b9666e834ee4ad0866d6f4035967bfc76217c5a495fff9f0d0", "249419de9358cba4b4763f8b978865f6a0dd5b8e9a6bfffdb4c14ad6c98c1034", "7511fb20d96f03160aa5af8f79d2c46afe7be7c4ecc21b783cb711143f74aad4", "bba03a13b8fb0aa58d7e269ef4c0a199f76437d8a3a2884febb38c0c14304a6a", "2d2cbcbf1eeed4c3bf06f34f4cc3b76914421665e4eadebcea789d51e1cd5eba", "a11b286f7305bb7cf89d412b1de91dffa24dd694d5071e9357540b577120d41a", "852f4c6a126224dde450d6a3f123d3149e9a97c74e030ef3d5b63ad5c646ef3a", "315c99b54a9da0913d1199bf482a065ca716a01113487de66d0a553447df680f", "8bb006cdb0136af239286153340f51da8fc5f4310bacb52bdce7aa1a5014ffd7", "c11501a529274dca80b3d92202bb5fc26215388eeba690bba9061bb58bf80704"],
    pub: ["TPL66VK2gCXNCD7EJg9pgJRfqcRazjhUZY", "TFeGHPRYFoCaPmhirFYuWZH1nC2CrpprNc", "TDbejAPhrCeNgS9mvNY4Xc8UMS3hSo4zq1", "TKviopboEV76WKmSU3e7dCPJh3vZZUWsVc", "TD4ALrz538rxxW2bAWvhPJ5tPzLiGKt9Hn", "TUPyR6RD7UdnuXkmfiKPJpj1wdKx4BfXuG", "TGYXQARaR5CNeq7AhnmGga32r8VSYtQMdF", "TXpWSpgR6kUxrgBx9zYuGnBvJe4tbHWc1K", "TS5bfmdpzP7hRDdMD38QjEhkXwuYdjQmwE", "TYUhArJ2JpdH3ca4YAogMx7T1kkvTzuWD1"]

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