pragma solidity ^0.6.6;

import "@chainlink/contracts/src/v0.6/ChainlinkClient.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * SmartTestament contract for managing crypto "last will"
 * Uses custom ChainLink external adapter for fetching information on testator's most recent social media activity.
 * of MyContract is an example contract which requests data from
 * the Chainlink network
 * @dev This contract is designed to work on multiple networks, including
 * local test networks
 */
contract SmartTestament is ChainlinkClient, Ownable {
    address private oracle;
    bytes32 private jobId;
    uint256 private fee;
    uint256 public data;

    /**
     * @notice Deploys contract
     */
    constructor(address _link) public {
        if (_link == address(0)) {
            setPublicChainlinkToken();
        } else {
            setChainlinkToken(_link);
        }
      fee = 0.1 * 10 ** 18;
    }

    /**
     * @notice Allows the owner to set up oracle address and job ID
     */
    function setOracleParams(address _oracle, bytes32 _jobId) public onlyOwner {
        require(_oracle != address(0), "An oracle address must be provided");
        oracle = _oracle;
        require(_jobId[0] != 0, "A jobId must be provided");
        jobId = _jobId;
    }

  /**
   * @notice Allows the owner to request
   * @param _username Twitter screen name
   */
    function getDaysSinceLastTweet(
        string memory _username
    )
    public
    onlyOwner
    returns (bytes32 requestId)
    {
        Chainlink.Request memory req = buildChainlinkRequest(jobId, address(this), this.fulfill.selector);
        req.add("username", _username);
        requestId = sendChainlinkRequestTo(oracle, req, fee);
    }

    /**
     * @notice Allows the owner to withdraw any LINK balance on the contract
     */
    function withdrawLink() public onlyOwner {
        LinkTokenInterface link = LinkTokenInterface(chainlinkTokenAddress());
        require(link.transfer(msg.sender, link.balanceOf(address(this))), "Unable to transfer");
    }

    /**
     * @notice Call this method if no response is received within 5 minutes
     * @param _requestId The ID that was generated for the request to cancel
     * @param _payment The payment specified for the request to cancel
     * @param _callbackFunctionId The bytes4 callback function ID specified for
     * the request to cancel
     * @param _expiration The expiration generated for the request to cancel
     */
    function cancelRequest(
        bytes32 _requestId,
        uint256 _payment,
        bytes4 _callbackFunctionId,
        uint256 _expiration
    )
    public
    onlyOwner
    {
        cancelChainlinkRequest(_requestId, _payment, _callbackFunctionId, _expiration);
    }

    /**
     * @notice The fulfill method from requests created by this contract
     * @dev The recordChainlinkFulfillment protects this function from being called
     * by anyone other than the oracle address that the request was sent to
     * @param _requestId The ID that was generated for the request
     * @param _data The answer provided by the oracle
     */
    function fulfill(bytes32 _requestId, uint256 _data)
    public
    recordChainlinkFulfillment(_requestId)
    {
        data = _data;
    }
}
