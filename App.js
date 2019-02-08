import React from 'react';
import { StyleSheet, Text, Button, View, AsyncStorage } from 'react-native';
import { BarCodeScanner, Permissions } from 'expo';
import { URL, URLSearchParams } from "whatwg-url";
global.URL = URL;
global.URLSearchParams = URLSearchParams;

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

import t from 'tcomb-form-native';

const Form = t.form.Form;

var Gender = t.enums({
  M: 'Male',
  F: 'Female'
});

const User = t.struct({
  firstname: t.String,
  lastname: t.String,
  age: t.Number,
  gender: Gender,
  terms: t.Boolean
});

const formStyles = {
  ...Form.stylesheet,
  formGroup: {
    normal: {
      marginBottom: 10
    },
  },
  controlLabel: {
    normal: {
      color: 'blue',
      fontSize: 18,
      marginBottom: 7,
      fontWeight: '600'
    },
    // the style applied when a validation error occours
    error: {
      color: 'red',
      fontSize: 18,
      marginBottom: 7,
      fontWeight: '600'
    }
  }
}

const options = {
  fields: {
    // email: {
    //   error: 'Without an email address how are you going to reset your password when you forget it?'
    // },
    firstname: {
      error: 'Enter real first name that matches your ID document.'
    },
    lastname: {
      error: 'Enter real first name that matches your ID document.'
    },
    age: {
      error: 'Enter real age that matches your ID document.'
    },
    gender: {
      error: 'Enter real gender that matches your ID document.'
    },
    terms: {
      label: 'Agree to Terms',
      error: 'You must agree.'
    },
  },
  stylesheet: formStyles,
};

const web3http = new Web3(
  new Web3.providers.HttpProvider(voxnetRpc),
);

export default class App extends React.Component {
  constructor() {
    super();
    this.state = {
      latestBlock: {},
      hasCameraPermission: null,
      scanningQR: false,
      firstname: null,
      lastname: null,
      age: 0,
      gender: null,
      terms: false
    }

    this.handleBarCodeScanned = this.handleBarCodeScanned.bind(this);
    this.openCamera = this.openCamera.bind(this);
  }

  _retrieveUserData = async (key, callback) => {
    try {
      const value = await AsyncStorage.getItem(key);
      console.log("getting from local", key, value)
      if (value !== null) {
        console.log('retrieved', key, value);
        callback(JSON.parse(value))
      }
    } catch (error) {
      console.error(error);
    }
  };

  _storeUserData = async (key, value) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error(error);
    }
  };

  async componentDidMount() {
    //await AsyncStorage.clear();
    const { status } = await Permissions.askAsync(Permissions.CAMERA);
    this.setState({ hasCameraPermission: status === 'granted' });

    
    web3http
      .eth.getBlock('latest')
      .then(latestBlock => {
        //console.log('latestBlock', latestBlock);
        this.setState({ latestBlock });
      });
  }

  async componentWillMount() {
    await this._retrieveUserData('userData', userdata => {
      this.setState(userdata);
      console.log('state', this.state)
    });

  }

  handleSubmit = async () => {
    const value = this._form.getValue();
    console.log('value: ', value);
    await this._storeUserData('userData', JSON.stringify(value));
    this.setState(value);
  }

  render() {
    const latestBlockNumber = this.state.latestBlock.number;

    if (!this.state.firstname) {
      return (<View style={styles.container}>
        <Form 
          ref={c => this._form = c}
          type={User} 
          options={options}
        />
        <Button
          title="Sign Up!"
          onPress={this.handleSubmit}
        />
      </View>)
    }
    if (!this.state.scanningQR) {
      return (
        <View style={styles.container}>
          <Text>Latest VOXNET block is: {latestBlockNumber}</Text>
          <Text>Firstname: {this.state.firstname}</Text>
          <Text>Lastname: {this.state.lastname}</Text>
          <Text>age: {this.state.age}</Text>
          <Text>gender: {this.state.gender}</Text>
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
    const web3 = await new Web3(new HDWalletProvider(walletMnemonic, voxnetRpc));

    let account = await this.createAccount(web3);
    await this.getLoginTokens(account);
    await this.sendLoginToken(web3, account);
    this.onSaveSessionEvent(() => this.saveUserData(web3, account));
  }

  async createAccount(web3) {
    let account = (await web3.eth.getAccounts())[0];
    console.log('walletAddress', account);
    return account;
  }

  async getLoginTokens(addressToTopUp) {
    let currentBalance = await this.getVssoTokenBalance(addressToTopUp);
    console.log('vsso token balance', currentBalance);
    if (parseInt(currentBalance) === 0) {
      console.log('Requesting new tokens');
      var baseUrl = vssoFaucetUrl;
      let url = baseUrl + '/?address=' + addressToTopUp;
      const getData = async (url) => {
        try {
          const response = await axios.get(url);
          const data = response.data;
          console.log(data);
        }
        catch (error) {
          console.log(error);
        }
      };
      // top up the account associated with mobile app
      await getData(url);
    }
    else {
      console.log('NOT requesting new tokens');
    }
  }

  async onSaveSessionEvent(action) {
    const web3ws = new Web3(new Web3.providers.WebsocketProvider(voxnetWs));
    let loginSessionContractWs = new web3ws.eth.Contract(loginSession.abi, loginSessionAddressFromQR);
      
    const options = {
      filter: {
        // _from:  process.env.WALLET_FROM,
        // _to: contractAddress,
        // _value: process.env.AMOUNT
      },
      fromBlock: 'latest'
    };
    loginSessionContractWs.once('SaveSessionEvent', options, async (error, event) => {
      if (error) {
        console.log(error);
        successCallback(false);
      }
      await action();
    });
  }

  async saveUserData(web3, account) {
    console.log ('saving data for account', account)
    let loginSessionContract = new web3.eth.Contract(loginSession.abi, loginSessionAddressFromQR);
    console.log(this.state.firstname, this.state.lastname, this.state.age.toString(), this.state.gender)
    await loginSessionContract.methods.SaveData(this.state.firstname, this.state.lastname, this.state.age.toString(), this.state.gender)
      .send({ from: account, gasPrice: 0, gas: 990000 })
      .on('receipt', receipt => {
        transactionHash = receipt.transactionHash;
      })
      .on('error', error => {
        console.log('error', error);
      })
      .then(console.log('sent user data to: ' + loginSessionAddressFromQR))
      .catch(console.error);
  }

  async sendLoginToken(web3, account) {
    let contract = new web3.eth.Contract(vssoToken.abi, vssoTokenAddress);
    await contract.methods.transfer(loginSessionAddressFromQR, web3.utils.toWei('0.001'))
      .send({ from: account, gasPrice: 0, gas: 1000000, })
      .on('receipt', receipt => {
        transactionHash = receipt.transactionHash;
      })
      .on('error', error => {
        console.log('error', error);
      })
      .then(console.log('sent 0.001 login tokens to:' + loginSessionAddressFromQR))
      .catch(console.error);
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
