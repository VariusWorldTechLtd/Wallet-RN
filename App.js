import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
const vssoToken = require('./VssoToken.json');
const vssoTokenAddress = '0x92fCc43e8FEda3CF74BF2A1A70fC456008Bd5b3C';
const voxnetRpc = 'https://voxwallet.vwtbet.com:8545'

const loginSessionAddressFromQR = '0x5A306838DdD010bA9A3B1C111A9dbee47a3cC658'

import './global';

const Web3 = require('web3');
const HDWalletProvider = require('truffle-hdwallet-provider');
const axios = require('axios')

const walletMnemonic = 'stick obtain head panther quantum frost enroll amateur liquid speak country remember'
const walletAccount0Address = '0x89Bc1BeE1cB73B563b8552aD80718744E3C334D3'

// const web3 = new Web3(
//   new Web3.providers.HttpProvider('https://voxwallet.vwtbet.com:8545/'),
// );

export default class App extends React.Component {
  constructor() {
    super();
    this.state = {
      latestBlock: {},
    }
  }

  async componentWillMount() {
    web3.eth.getBlock('latest')
      .then(latestBlock => {
        console.log(latestBlock);
        this.setState({ latestBlock });
      });
    
      const addressToTopUp = walletAccount0Address;
      var baseUrl = 'https://voxwallet.vwtbet.com:8080';
      let url = baseUrl + '/?address=' + addressToTopUp

      const getData = async url => {
        try {
          const response = await axios.get(url)
          const data = response.data;
          console.log(data);
        } catch (error) {
          console.log(error);
        }
      };

      // top up the account associated with mobile app
      await getData(url);

      const web3 = new Web3(new HDWalletProvider(walletMnemonic, voxnetRpc));

      let accounts = await web3.eth.getAccounts();
      console.log('walletAddress', accounts[0])
      let contract = new web3.eth.Contract(vssoToken.abi, vssoTokenAddress);

      await contract.methods.transfer(loginSessionAddressFromQR, web3.utils.toWei('0.001'))
          .send({from: accounts[0], gasPrice:0, gas: 1000000,})
          .on('receipt', receipt => {
              transactionHash = receipt.transactionHash;
          })
          .on('error', error => {
              res.send(error)
          })
          //.then(console.log)
          .catch(console.error);
  }

  render() {
    const latestBlockNumber = this.state.latestBlock.number;

    return (
      <View style={styles.container}>
        <Text>Latest ethereum block is: {latestBlockNumber}</Text>
        <Text>Check your console!</Text>
        <Text>You should find extra info on the latest ethereum block.</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    flex: 1,
    justifyContent: 'center',
    margin: 20,
  },
});
