var sleep = require('sleep');
var solc = require('solc');
var Web3 = require('web3');

// example: 
//var web3 = new Web3(new Web3.providers.HttpProvider("http://52.16.72.86:8545"));

var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8989"));

var fs = require('fs');
var assert = require('assert');
var async = require('async');
var BigNumber = require('bignumber.js');

var abi;
var accounts;
var creator;
var client;
var client2;

var initialFoundersBalance;

var contractAddress;
var contract;

// init BigNumber
var unit = new BigNumber(Math.pow(10,18));

describe('Smart Contracts', function() {
     before("Initialize everything", function(done) {
          web3.eth.getAccounts(function(err, as) {
               if(err) {
                    done(err);
                    return;
               }

               accounts = as;

               creator = accounts[0];
               client  = accounts[1];
               client2 = accounts[2];

               done();
          });
     });

     after("Deinitialize everything", function(done) {
          done();
     });


     it('Should compile contract', function(done) {
          var file = './contracts/BitQy.sol';
          var contractName = 'BitQy';

          fs.readFile(file, function(err, result){
               assert.equal(err,null);

               var source = result.toString();
               assert.notEqual(source.length,0);

               var output = solc.compile(source, 1); // 1 activates the optimiser

               //console.log('OUTPUT: ');
               //console.log(output);

               abi = JSON.parse(output.contracts[contractName].interface);
               var bytecode = output.contracts[contractName].bytecode;
               var tempContract = web3.eth.contract(abi);

               var alreadyCalled = false;

               tempContract.new(
                    {
                         from: creator, 
                         gas: 3000000, 
                         data: bytecode
                    }, 
                    function(err, c){
                         assert.equal(err, null);

                         web3.eth.getTransactionReceipt(c.transactionHash, function(err, result){
                              assert.equal(err, null);

                              console.log('Contract address: ');
                              console.log(result.contractAddress);

                              contractAddress = result.contractAddress;
                              contract = web3.eth.contract(abi).at(result.contractAddress);

                              //console.log('Contract: ');
                              //console.log(contract);

                              if(!alreadyCalled){
                                   done();
                              }
                              alreadyCalled = true;
                         });
                    });
          });
     });

     it('should get correct initial total supply',function(done){
          contract.totalSupply(function(err, result){
               assert.equal(err, null);

               console.log('Initial token supply: ');
               console.log(result.toString(10));

               assert.equal(result.toString(10),10000000000);

               done();
          });
     });

     it('should fail if <stop> is not called by creator',function(done){
          contract.stop(
               true,
               {
                    from: client,
                    //gas: 3000000, 
                    //gasPrice: 2000000
               },
               function(err,result){
                    assert.notEqual(err,null);

                    done();
               }
          );
     });

     it('should not transfer 1 token from client to client2 because balance is zero',function(done){
          var value = 1;

          contract.transfer(
               client2,   // to
               value,    // amount of tokens

               {
                    from: client,
                    //gas: 3000000, 
                    //gasPrice: 2000000
               },
               function(err, result){
                    // no throw!
                    assert.equal(err, null);

                    // 1 - check the balance of creator
                    contract.balanceOf(client, function(err, result){
                         assert.equal(err, null);
                         assert.equal(result.toString(10),0);

                         // 2 - check the balance of client 
                         contract.balanceOf(client2, function(err, result){
                              assert.equal(err, null);
                              assert.equal(result.toString(10),0);
                              done();
                         });
                    });
               }
          );
     });

     it('should not fail if <stop> is called by creator',function(done){
          contract.stop(
               true,
               {
                    from: creator,
                    //gas: 3000000, 
                    //gasPrice: 2000000
               },
               function(err,result){
                    assert.equal(err,null);

                    done();
               }
          );
     });

     it('should transfer 1 token from creator to client1 even if stopped',function(done){
          var value = 1;

          contract.transfer(
               client,   // to
               value,    // amount of tokens

               {
                    from: creator,
                    //gas: 3000000, 
                    //gasPrice: 2000000
               },
               function(err, result){
                    assert.equal(err, null);

                    // 1 - check the balance of creator
                    contract.balanceOf(creator, function(err, result){
                         assert.equal(err, null);

                         assert.equal(result.toString(10),10000000000 - 1);

                         // 2 - check the balance of client 
                         contract.balanceOf(client, function(err, result){
                              assert.equal(err, null);

                              assert.equal(result.toString(10),1);
                              done();
                         });
                    });
               }
          );
     });

     it('should not transfer 1 token from client to client2 because stopped',function(done){
          var value = 1;

          contract.transfer(
               client2,   // to
               value,    // amount of tokens

               {
                    from: client,
                    //gas: 3000000, 
                    //gasPrice: 2000000
               },
               function(err, result){
                    // no throw!
                    assert.equal(err, null);

                    // 1 - check the balance of creator
                    contract.balanceOf(client, function(err, result){
                         assert.equal(err, null);
                         assert.equal(result.toString(10),1);

                         // 2 - check the balance of client 
                         contract.balanceOf(client2, function(err, result){
                              assert.equal(err, null);
                              assert.equal(result.toString(10),0);
                              done();
                         });
                    });
               }
          );
     });

     it('should get correct total supply',function(done){
          contract.totalSupply(function(err, result){
               assert.equal(err, null);

               console.log('Initial token supply: ');
               console.log(result.toString(10));

               assert.equal(result.toString(10),10000000000);

               done();
          });
     });

     it('should fail if <stop, false> is not called by creator',function(done){
          contract.stop(
               false,
               {
                    from: client,
                    //gas: 3000000, 
                    //gasPrice: 2000000
               },
               function(err,result){
                    assert.notEqual(err,null);

                    done();
               }
          );
     });

     it('should enable calls',function(done){
          contract.stop(
               false,
               {
                    from: creator,
                    //gas: 3000000, 
                    //gasPrice: 2000000
               },
               function(err,result){
                    assert.equal(err,null);

                    done();
               }
          );
     });

     /*
     it('should buy some tokens on behalf of buyer',function(done){
          var priceShouldBe = 200;

          // accounts[2]
          var amount = 0.015;
          var amountWas = 0.005;

          contract.buyTokensFor(
               buyer,
               {
                    from: founders,               // accounts[2],
                    value: web3.toWei(amount, 'ether'),
                    //gasPrice: 2000000
               },
               function(err, result){
                    assert.equal(err, null);

                    contract.balanceOf(buyer, function(err, result){
                         assert.equal(err, null);

                         assert.equal(result.equals(unit.times(new BigNumber(priceShouldBe)).times(new BigNumber(amount + amountWas))), true);


                         contract.balanceOf(accounts[2], function(err, result){
                              assert.equal(err, null);

                              assert.equal(result.equals(unit.times(new BigNumber(priceShouldBe)).times(new BigNumber(0))), true);
                              done();
                         });
                    });
               }
          );
     });

     it('buyers balance should be reduced',function(done){
          var balance = web3.eth.getBalance(buyer);

          console.log('Buyer balance: ');
          console.log(balance.toString(10));
          
          console.log('Diff: ');
          console.log(diff.toString(10));

          // diff includes Gas fees
          // 0.005 ETH
          assert.equal((diff.toString() >= 5000000000000000) && (diff.toString() <= 5000000100000000),true);

          done();
     });
     */
});

