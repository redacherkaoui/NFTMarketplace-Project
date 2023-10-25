// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "./Marketplace.sol";

contract NFT is ERC721URIStorage {
    uint public tokenCount;
    Marketplace public marketplace; // Reference to the marketplace contract

    constructor(address _marketplace) ERC721("DApp NFT", "DAPP") {
        marketplace = Marketplace(_marketplace);
    }

    function mint(string memory _tokenURI, uint _price) external returns (uint) {
        tokenCount++;
        _safeMint(msg.sender, tokenCount);
        _setTokenURI(tokenCount, _tokenURI);

        // List the minted NFT on the marketplace
        IERC721 nftContract = IERC721(address(this));
        marketplace.makeItem(nftContract, tokenCount, _price);

        return tokenCount;
    }
}
