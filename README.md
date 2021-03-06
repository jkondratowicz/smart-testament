# Smart Testmanent

### Note
This is an incomplete submission for ChainLink 2021 Hackathon. Unfortunately I run out of time wasn't able to finish my submission. The biggest missing piece is the UI. The smart contract itself as well as the external adapter are functional, but in a rough shape.


### Problem
In case of traditional financial institutions like banks there are regulations in place to ensure that in case a person dies, their assets are distributed among family or beneficiaries mentioned in testator's last will.

With blockchain-related technologies slowly going mainstream, a growing number of people now have substantial value locked in crypto assets. While regulated centralized exchanges might fall under local laws related to inheritance, in case of private wallets there is no easy way of making sure that one's crypto holdings will be transferred to a person of their choosing in case they die.

### Solution
With smart contracts we can programmatically ensure that tokens stored in the smart contract will be automatically released if some conditions are met. While there is currently no foolproof way of determining if a person is alive, we can use a mechanism called a dead man's switch. The mechanism of action is as follows:
1. Testator transfers his funds to the smart contract
2. At any point the testator may request a withdrawal back to the wallet used to fund it
3. The smart contract checks in regular intervals what is the most recent activity on testator's social media accounts [note: periodic check not implemented, only checks Twitter]
4. In case testator has not been active for a period exceeding what's expected, he's assumed dead
5. Funds are automatically released to the address chosen as beneficiary by the testator

The whole logic is executed by a smart contract on Ethereum network. Step (3) uses a custom ChainLink external adapter to call social media API to check for user's latest activity.

### Project structure
- `contracts/SmartTestament.sol` - main smart contract
- `twitter_adapter/` - external adapter that needs to be run separately
- `frontend/` - UI for using metamask to deposit etc. (TODO)

### To do:

- contract tests
- add UI
- instead of public function callable by owner, use Chainlink Alarm Clock or maybe Keeper (?) to periodically check status
