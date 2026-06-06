// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AgentDrop is ERC721, Ownable {
    uint256 private _tokenId;
    mapping(uint256 => string) private _tokenURIs;

    constructor() ERC721("AgentDrop", "ADROP") Ownable() {}

    function batchMint(
        address[] calldata recipients,
        string[] calldata uris
    ) external onlyOwner {
        require(recipients.length == uris.length, "Length mismatch");
        for (uint i = 0; i < recipients.length; i++) {
            _tokenId++;
            _mint(recipients[i], _tokenId);
            _tokenURIs[_tokenId] = uris[i];
        }
    }

    function tokenURI(uint256 id) public view override returns (string memory) {
        return _tokenURIs[id];
    }
}