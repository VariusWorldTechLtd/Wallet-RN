import React from 'react';
import { StyleSheet, Text, Button, View } from 'react-native';
import { BarCodeScanner, Permissions } from 'expo';
const vssoToken = require('./VssoToken.json');
const loginSession = require('./LoginSession.json');
const vssoTokenAddress = '0x92fCc43e8FEda3CF74BF2A1A70fC456008Bd5b3C';
const voxnetRpc = 'https://voxwallet2.vwtbet.com:8545'
const voxnetWs = 'wss://voxwallet2.vwtbet.com:8546'
const vssoFaucetUrl = 'https://voxwallet2.vwtbet.com:8080'

import './global';

const Web3 = require('web3');
const HDWalletProvider = require('truffle-hdwallet-provider');
const axios = require('axios')

const walletMnemonic = 'stick obtain head panther quantum frost enroll amateur liquid speak country remember'
const walletAccount0Address = '0x89Bc1BeE1cB73B563b8552aD80718744E3C334D3'

const web3http = new Web3(
  new Web3.providers.HttpProvider(voxnetRpc),
);

export default class App extends React.Component {
  constructor() {
    super();
    this.state = {
      latestBlock: {},
      hasCameraPermission: null,
      scanningQR: false
    }

    this.handleBarCodeScanned = this.handleBarCodeScanned.bind(this);
    this.openCamera = this.openCamera.bind(this);
  }

  async componentDidMount() {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);
    this.setState({ hasCameraPermission: status === 'granted' });

    web3http
      .eth.getBlock('latest')
      .then(latestBlock => {
        console.log('latestBlock', latestBlock);
        this.setState({ latestBlock });
      });
  }

  async componentWillMount() {

  }

  render() {
    const latestBlockNumber = this.state.latestBlock.number;

    if (!this.state.scanningQR) {
      return (
        <View style={styles.container}>
          {/* <Text>Latest VOXNET block is: {latestBlockNumber}</Text> */}
          <Button
            raised
            icon={{ name: 'qr' }}
            onPress={this.openCamera}
            title="Login using QR"

            accessibilityLabel="Login by scanning QR on web"
            type="outline"
            raised="true"

          />
        </View>
      );
    }
    else (this.state.scanningQR)
    {
      const { hasCameraPermission } = this.state;
      if (hasCameraPermission === null) {
        return (
          <View style={styles.container}>
            <Text>Requesting for camera permission</Text>
          </View>
        );
      }
      if (hasCameraPermission === false) {
        return (
          <View style={styles.container}>
            <Text>No access to camera</Text>
          </View>
        );
      }

      return (
        <View style={{ flex: 1 }}>
          <BarCodeScanner
            onBarCodeScanned={this.handleBarCodeScanned}
            style={[StyleSheet.absoluteFill, styles.container]}>
            <View style={styles.layerTop} />
            <View style={styles.layerCenter}>
              <View style={styles.layerLeft} />
              <View style={styles.focused} />
              <View style={styles.layerRight} />
            </View>
            <View style={styles.layerBottom} />
          </BarCodeScanner>
        </View>
      );
    }
  } // end render


  async getVssoTokenBalance(address) {
    const web3 = new Web3(new HDWalletProvider(walletMnemonic, voxnetRpc));
    let contract = new web3.eth.Contract(vssoToken.abi, vssoTokenAddress);
    return await contract.methods.balanceOf(address)
      .call()
  }

  openCamera({ type, data }) {
    console.log("scanning QR")
    this.setState({ scanningQR: true })
  }

  async handleBarCodeScanned({ type, data }) {
    this.setState({ scanningQR: false });
    loginSessionAddressFromQR = data;
    console.log('loginSessionAddressFromQR', loginSessionAddressFromQR)

    let currentBalance = await this.getVssoTokenBalance(walletAccount0Address);
    console.log('vsso token balance', currentBalance)

    if (parseInt(currentBalance) === 0) {
      console.log('Requesting new tokens')
      const addressToTopUp = walletAccount0Address;
      var baseUrl = vssoFaucetUrl;
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
    }
    else {
      console.log('NOT requesting new tokens')
    }

    const web3 = new Web3(new HDWalletProvider(walletMnemonic, voxnetRpc));

    let accounts = await web3.eth.getAccounts();
    console.log('walletAddress', accounts[0])
    let contract = new web3.eth.Contract(vssoToken.abi, vssoTokenAddress);

    await contract.methods.transfer(loginSessionAddressFromQR, web3.utils.toWei('0.001'))
      .send({ from: accounts[0], gasPrice: 0, gas: 1000000, })
      .on('receipt', receipt => {
        transactionHash = receipt.transactionHash;
      })
      .on('error', error => {
        console.log('error', error)
      })
      .then(console.log('sent 0.001 login tokens to:' + loginSessionAddressFromQR))
      .catch(console.error);


    const web3ws = new Web3(new Web3.providers.WebsocketProvider(voxnetWs));
    let loginSessionContractWs = new web3ws.eth.Contract(loginSession.abi, loginSessionAddressFromQR, (error, result) => { if (error) console.log(error) });

    const options = {
      filter: {
        // _from:  process.env.WALLET_FROM,
        // _to: contractAddress,
        // _value: process.env.AMOUNT
      },
      fromBlock: 'latest'
    };


    loginSessionContractWs.once('SaveSessionEvent', options, async (error, event) => {
      console.log(event);

      if (error) {
        console.log(error);
        successCallback(false);
      }

      let loginSessionContract = new web3.eth.Contract(loginSession.abi, loginSessionAddressFromQR);

      await loginSessionContract.methods.SaveData('Andy', 'Dennis', '33', 'Male')
        .send({ from: accounts[0], gasPrice: 0, gas: 990000 })
        .on('receipt', receipt => {
          transactionHash = receipt.transactionHash;
        })
        .on('error', error => {
          console.log('error', error)
        })
        .then(console.log('sent user data to: ' + loginSessionAddressFromQR))
        .catch(console.error);
    });
  }
} // end app component

const opacity = 'rgba(0, 0, 0, .6)';
const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    flex: 1,
    justifyContent: 'center',
    margin: 0,

    flex: 1,
    flexDirection: 'column'
  },
});
