const { expect } = require("chai");

describe("NFT and Marketplace Contracts", function () {
  let NFT;
  let nft;
  let Marketplace;
  let marketplace;
  let deployer;
  let addr1;
  let addr2;
  let addrs;
  let feePercent = 1;
  let URI = "sample URI";

  beforeEach(async function () {
    NFT = await ethers.getContractFactory("NFT");
    Marketplace = await ethers.getContractFactory("Marketplace");
    [deployer, addr1, addr2, ...addrs] = await ethers.getSigners();

    nft = await NFT.deploy();
    marketplace = await Marketplace.deploy(feePercent, { value: 1000 }); // 1000 wei for testing
  });

  describe("Deployment", function () {
    it("Should deploy NFT with the correct name and symbol", async function () {
      expect(await nft.name()).to.equal("DApp NFT");
      expect(await nft.symbol()).to.equal("DAPP");
    });

    it("Should deploy Marketplace with the correct fee account and fee percent", async function () {
      expect(await marketplace.feeAccount()).to.equal(deployer.address);
      expect(await marketplace.feePercent()).to.equal(feePercent);
    });
  });

  describe("Minting NFTs", function () {
    it("Should mint NFTs for different addresses and validate token count, balance, and URI", async function () {
      // Mint NFT for addr1
      await nft.connect(addr1).mint(URI, 100);
      expect(await nft.tokenCount()).to.equal(1);
      expect(await nft.balanceOf(addr1.address)).to.equal(1);
      expect(await nft.tokenURI(1)).to.equal(URI);

      // Mint NFT for addr2
      await nft.connect(addr2).mint(URI, 200);
      expect(await nft.tokenCount()).to.equal(2);
      expect(await nft.balanceOf(addr2.address)).to.equal(1);
      expect(await nft.tokenURI(2)).to.equal(URI);
    });
  });

  describe("Making Marketplace Items", function () {
    it("Should create a marketplace item by offering an NFT for sale", async function () {
      await nft.connect(addr1).mint(URI, 100);
      await nft.connect(addr1).setApprovalForAll(marketplace.address, true);

      await expect(marketplace.connect(addr1).makeItem(nft.address, 1, 200))
        .to.emit(marketplace, "Offered")
        .withArgs(1, nft.address, 1, 200, addr1.address);

      expect(await nft.ownerOf(1)).to.equal(marketplace.address);
      expect(await marketplace.itemCount()).to.equal(1);

      const item = await marketplace.items(1);
      expect(item.itemId).to.equal(1);
      expect(item.nft).to.equal(nft.address);
      expect(item.tokenId).to.equal(1);
      expect(item.price).to.equal(200);
      expect(item.sold).to.equal(false);
    });

    it("Should fail if the price is set to zero", async function () {
      await nft.connect(addr1).mint(URI, 100);
      await nft.connect(addr1).setApprovalForAll(marketplace.address, true);

      await expect(
        marketplace.connect(addr1).makeItem(nft.address, 1, 0)
      ).to.be.revertedWith("Price must be greater than zero");
    });
  });

  describe("Purchasing Marketplace Items", function () {
    it("Should purchase a marketplace item, transferring ownership of the NFT to the buyer", async function () {
      await nft.connect(addr1).mint(URI, 100);
      await nft.connect(addr1).setApprovalForAll(marketplace.address, true);

      await marketplace.connect(addr1).makeItem(nft.address, 1, 200);

      const sellerInitialBalance = await addr1.getBalance();
      const feeAccountInitialBalance = await deployer.getBalance();

      const totalPrice = await marketplace.getTotalPrice(1);
      await expect(marketplace.connect(addr2).purchaseItem(1, { value: totalPrice }))
        .to.emit(marketplace, "Bought")
        .withArgs(1, nft.address, 1, 200, addr1.address, addr2.address);

      const sellerFinalBalance = await addr1.getBalance();
      const feeAccountFinalBalance = await deployer.getBalance();

      expect(await nft.ownerOf(1)).to.equal(addr2.address);

      expect(+sellerFinalBalance).to.equal(+sellerInitialBalance + 200);
      expect(+feeAccountFinalBalance).to.equal(+feeAccountInitialBalance + 1); // 1% fee
    });

    it("Should fail for invalid item IDs, already sold items, and insufficient Ether payment", async function () {
      await nft.connect(addr1).mint(URI, 100);
      await nft.connect(addr1).setApprovalForAll(marketplace.address, true);
      await marketplace.connect(addr1).makeItem(nft.address, 1, 200);

      await marketplace.connect(addr1).purchaseItem(1, { value: 200 });

      await expect(marketplace.connect(addr2).purchaseItem(2, { value: 200 })).to.be.revertedWith("Item doesn't exist");
      await expect(marketplace.connect(addr2).purchaseItem(0, { value: 200 })).to.be.revertedWith("Item doesn't exist");
      await expect(marketplace.connect(addr2).purchaseItem(1, { value: 100 })).to.be.revertedWith("Not enough ether to cover item price and market fee");
      await expect(marketplace.connect(addr3).purchaseItem(1, { value: 200 })).to.be.revertedWith("Item already sold");
    });
  });
});
