import React, { useState } from 'react';
import { ethers } from 'ethers';
import { Row, Form, Button } from 'react-bootstrap';
import { create as ipfsHttpClient } from 'ipfs-http-client';

const client = ipfsHttpClient('https://ipfs.infura.io:5001/api/v0');

function Create({ marketplace, nft }) {
  const [image, setImage] = useState('');
  const [price, setPrice] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const uploadToIPFS = async (event) => {
    event.preventDefault();
    const file = event.target.files[0];

    if (typeof file !== 'undefined') {
      try {
        const result = await client.add(file);
        setImage(`https://ipfs.infura.io/ipfs/${result.path}`);
      } catch (error) {
        console.error("IPFS image upload error: ", error);
      }
    }
  };

  const createNFT = async () => {
    if (!image || !price || !name || !description) return;

    try {
      const result = await client.add(JSON.stringify({ image, price, name, description }));
      mintThenList(result);
    } catch (error) {
      console.error("IPFS URI upload error: ", error);
    }
  };

  const mintThenList = async (result) => {
    const uri = `https://ipfs.infura.io/ipfs/${result.path}`;

    // Mint the NFT
    await (await nft.mint(uri)).wait();

    // Get the tokenId of the new NFT
    const id = await nft.tokenCount();

    // Approve the marketplace to spend the NFT
    await (await nft.setApprovalForAll(marketplace.address, true)).wait();

    // Add the NFT to the marketplace
    const listingPrice = ethers.utils.parseEther(price.toString());
    await (await marketplace.makeItem(nft.address, id, listingPrice)).wait();
  };

  return (
    <div className="container-fluid mt-5">
      <div className="row">
        <main role="main" className="col-lg-12 mx-auto" style={{ maxWidth: '1000px' }}>
          <div className="content mx-auto">
            <Row className="g-4">
              <Form.Control
                type="file"
                required
                name="file"
                onChange={uploadToIPFS}
              />
              <Form.Control
                onChange={(e) => setName(e.target.value)}
                size="lg"
                required
                type="text"
                placeholder="Name"
              />
              <Form.Control
                onChange={(e) => setDescription(e.target.value)}
                size="lg"
                required
                as="textarea"
                placeholder="Description"
              />
              <Form.Control
                onChange={(e) => setPrice(e.target.value)}
                size="lg"
                required
                type="number"
                placeholder="Price in ETH"
              />
              <div className="d-grid px-0">
                <Button
                  onClick={createNFT}
                  variant="primary"
                  size="lg"
                >
                  Create & List NFT!
                </Button>
              </div>
            </Row>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Create;
