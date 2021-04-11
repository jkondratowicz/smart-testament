pragma solidity ^0.6.6;

import "@chainlink/contracts/src/v0.6/ChainlinkClient.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * SmartTestament contract for managing crypto "last will"
 * Uses custom ChainLink external adapter for fetching information on testator's most recent social media activity.
 */
contract SmartTestament is ChainlinkClient, Ownable {
    address private oracle;
    bytes32 private jobId;
    uint256 private fee;
    uint256 private releaseFundsAfterDays;
    mapping(string => uint256) private userLastSeenAlive;
    mapping(bytes32 => string) private requestToUsername;
    mapping(address => uint256) private depositBalance;
    mapping(string => address[]) private usernameToTestatorAddresses;
    mapping(address => address) private beneficiaries;
    string[] private usernames;

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
      releaseFundsAfterDays = 180;
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
     * @notice Set how many days after last activity funds should be released to beneficiary
     */
    function setGracePeriod(uint256 _days) public onlyOwner {
      require(_days > 0, "Must be more than 0 days");
      releaseFundsAfterDays = _days;
    }

    /**
     * @notice Allows the owner to request checking of all users
     */
    function requestDaysSinceLastTweet() public onlyOwner {
      for (uint i=0; i<usernames.length; i++) {
        requestDaysSinceLastTweetForUsername(usernames[i]);
      }
    }

    /**
     * @notice Allows the owner to request days since user was seen alive
     * @param _username Twitter screen name
     */
    function requestDaysSinceLastTweetForUsername(string memory _username) public onlyOwner returns (bytes32 requestId) {
      Chainlink.Request memory req = buildChainlinkRequest(jobId, address(this), this.fulfill.selector);
      req.add("username", _username);
      requestId = sendChainlinkRequestTo(oracle, req, fee);
      requestToUsername[requestId] = _username;
      return requestId;
    }

    /**
     * @notice Allows the owner to request
     * @param _username Twitter screen name
     */
    function getDaysSinceLastTweet(string memory _username) public view onlyOwner returns (uint256 daysSinceLastSeenAlive) {
        return userLastSeenAlive[_username];
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
    function fulfill(bytes32 _requestId, uint256 _data) public recordChainlinkFulfillment(_requestId) {
        string memory username = requestToUsername[_requestId];
        bytes memory usernameBytes = bytes(username);
        if (usernameBytes.length == 0) {
          return;
        }
        userLastSeenAlive[username] = _data;
        delete requestToUsername[_requestId];

        // @todo make this configurable
        if (_data > releaseFundsAfterDays) {
          for (uint i=0; i < usernameToTestatorAddresses[username].length; i++) {
            releaseTestatorsFunds(usernameToTestatorAddresses[username][i]);
          }
        }
    }

    /**
     * @notice Send funds to the beneficiary
     * @param _testator Address of testator
     */
    function releaseTestatorsFunds(address _testator) private {
      uint256 balance = depositBalance[_testator];
      address beneficiary = beneficiaries[_testator];
      if(beneficiary != address(0) && balance > 0) {
        IERC20(chainlinkTokenAddress()).transfer(beneficiary, balance);
        depositBalance[_testator] = 0;
      }
    }


    /**
     * @notice Deposit funds into Smart Testament
     * @param _amount Amount to be deposited
     * @param _username Twitter username to check
     * @param _beneficiary Address of the beneficiary (where to send deposited funds in case of death)
     */
    function deposit(uint256 _amount, string memory _username, address _beneficiary) public {
      // Require amount greater than 0
      require(_amount > 0, "Amount cannot be 0");
      bytes memory usernameBytes = bytes(_username);
      require(usernameBytes.length > 2, "Username must be at least 3 characters");
      require(_beneficiary != address(0), "You must provide a beneficiary");

      if (depositBalance[msg.sender] <= 0) {
        // First time deposit
        usernameToTestatorAddresses[_username].push(msg.sender);
        usernames.push(_username);
        beneficiaries[msg.sender] = _beneficiary;
      }

      depositBalance[msg.sender] = depositBalance[msg.sender] + _amount;
      IERC20(chainlinkTokenAddress()).transferFrom(msg.sender, address(this), _amount);
    }

    /**
     * @notice Withdraw all funds
     */
    function withdraw() public {
      uint256 balance = depositBalance[msg.sender];
      require(balance > 0, "Deposited balance cannot be 0");
      IERC20(chainlinkTokenAddress()).transfer(msg.sender, balance);

      // @todo remove from usernames array?
    }
}
