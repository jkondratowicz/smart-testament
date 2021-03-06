const { oracle } = require('@chainlink/test-helpers');
const { expectRevert, time } = require('@openzeppelin/test-helpers');

contract('SmartTestament', (accounts) => {
  const { LinkToken } = require('@chainlink/contracts/truffle/v0.4/LinkToken');
  const { Oracle } = require('@chainlink/contracts/truffle/v0.6/Oracle');
  const SmartTestament = artifacts.require('SmartTestament');

  const defaultAccount = accounts[0];
  const oracleNode = accounts[1];
  const stranger = accounts[2];
  const consumer = accounts[3];

  const jobId = web3.utils.toHex('818de5fad1514b3cb5f356c8200e265d');

  // Represents 1 LINK for testnet requests
  const payment = web3.utils.toWei('0.1');

  let link, oc, cc;

  beforeEach(async () => {
    link = await LinkToken.new({ from: defaultAccount });
    oc = await Oracle.new(link.address, { from: defaultAccount });
    cc = await SmartTestament.new(link.address, { from: consumer });
    await oc.setFulfillmentPermission(oracleNode, true, {
      from: defaultAccount,
    });
  });

  describe('#createRequest', () => {
    context('without LINK', () => {
      it('reverts', async () => {
        await expectRevert.unspecified(
          cc.createRequestTo(oc.address, jobId, payment, url, path, times, {
            from: consumer,
          })
        );
      });
    });

    context('with LINK', () => {
      let request;

      beforeEach(async () => {
        await link.transfer(cc.address, web3.utils.toWei('1', 'ether'), {
          from: defaultAccount,
        });
      });

      context('sending a request to a specific oracle contract address', () => {
        it('triggers a log event in the new Oracle contract', async () => {
          const tx = await cc.createRequestTo(
            oc.address,
            jobId,
            payment,
            url,
            path,
            times,
            { from: consumer }
          );
          request = oracle.decodeRunRequest(tx.receipt.rawLogs[3]);
          assert.equal(oc.address, tx.receipt.rawLogs[3].address);
          assert.equal(
            request.topic,
            web3.utils.keccak256(
              'OracleRequest(bytes32,address,bytes32,uint256,address,bytes4,uint256,uint256,bytes)'
            )
          );
        });
      });
    });
  });

  describe('#fulfill', () => {
    const expected = 50000;
    const response = web3.utils.padLeft(web3.utils.toHex(expected), 64);
    let request;

    beforeEach(async () => {
      await link.transfer(cc.address, web3.utils.toWei('1', 'ether'), {
        from: defaultAccount,
      });
      const tx = await cc.createRequestTo(
        oc.address,
        jobId,
        payment,
        url,
        path,
        times,
        { from: consumer }
      );
      request = oracle.decodeRunRequest(tx.receipt.rawLogs[3]);
      await oc.fulfillOracleRequest(
        ...oracle.convertFufillParams(request, response, {
          from: oracleNode,
          gas: 500000,
        })
      );
    });

    it('records the data given to it by the oracle', async () => {
      const currentPrice = await cc.data.call();
      assert.equal(
        web3.utils.padLeft(web3.utils.toHex(currentPrice), 64),
        web3.utils.padLeft(expected, 64)
      );
    });

    context('when my contract does not recognize the request ID', () => {
      const otherId = web3.utils.toHex('otherId');

      beforeEach(async () => {
        request.id = otherId;
      });

      it('does not accept the data provided', async () => {
        await expectRevert.unspecified(
          oc.fulfillOracleRequest(
            ...oracle.convertFufillParams(request, response, {
              from: oracleNode,
            })
          )
        );
      });
    });

    context('when called by anyone other than the oracle contract', () => {
      it('does not accept the data provided', async () => {
        await expectRevert.unspecified(
          cc.fulfill(request.requestId, response, { from: stranger })
        );
      });
    });
  });

  describe('#cancelRequest', () => {
    let request;

    beforeEach(async () => {
      await link.transfer(cc.address, web3.utils.toWei('1', 'ether'), {
        from: defaultAccount,
      });
      const tx = await cc.createRequestTo(
        oc.address,
        jobId,
        payment,
        url,
        path,
        times,
        { from: consumer }
      );
      request = oracle.decodeRunRequest(tx.receipt.rawLogs[3]);
    });

    context('before the expiration time', () => {
      it('cannot cancel a request', async () => {
        await expectRevert(
          cc.cancelRequest(
            request.requestId,
            request.payment,
            request.callbackFunc,
            request.expiration,
            { from: consumer }
          ),
          'Request is not expired'
        );
      });
    });

    context('after the expiration time', () => {
      beforeEach(async () => {
        await time.increase(300);
      });

      context('when called by a non-owner', () => {
        it('cannot cancel a request', async () => {
          await expectRevert.unspecified(
            cc.cancelRequest(
              request.requestId,
              request.payment,
              request.callbackFunc,
              request.expiration,
              { from: stranger }
            )
          );
        });
      });

      context('when called by an owner', () => {
        it('can cancel a request', async () => {
          await cc.cancelRequest(
            request.requestId,
            request.payment,
            request.callbackFunc,
            request.expiration,
            { from: consumer }
          );
        });
      });
    });
  });

  describe('#withdrawLink', () => {
    beforeEach(async () => {
      await link.transfer(cc.address, web3.utils.toWei('1', 'ether'), {
        from: defaultAccount,
      });
    });

    context('when called by a non-owner', () => {
      it('cannot withdraw', async () => {
        await expectRevert.unspecified(cc.withdrawLink({ from: stranger }));
      });
    });

    context('when called by the owner', () => {
      it('transfers LINK to the owner', async () => {
        const beforeBalance = await link.balanceOf(consumer);
        assert.equal(beforeBalance, '0');
        await cc.withdrawLink({ from: consumer });
        const afterBalance = await link.balanceOf(consumer);
        assert.equal(afterBalance, web3.utils.toWei('1', 'ether'));
      });
    });
  });
});
