[![Build Status](https://travis-ci.org/ptoner/freedom-for-data.svg?branch=ci-setup)](https://travis-ci.org/ptoner/freedom-for-data)

# freedom-for-data
An easy to use javascript library to read and write Ethereum and IPFS data. Can be used with Node.js or in a DApp-enabled browser.

## About
**freedom-for-data** uses a simple, reusable pattern to tie data in an Ethereum smart contract to data stored in IPFS.  Transactional data is stored in Ethereum while everything else is stored in IPFS. 

The goal is to help DApp developers abstract these details away and create a simple mechanism to programmaticaly store and access large amounts of data. It makes communicating with a DApp feel like using other REST endpoint. 

Over time the Ethereum/IPFS implementation details can evolve and all the CRUD DApps we build won't be coupled so tightly to the rapidly changing implementation details.

# Installation

### Clone repo and install 
```console
git clone https://github.com/ptoner/freedom-for-data.git

cd freedom-for-data

npm install -g
```


### Install truffle
```console
npm install -g truffle@5.0.0 
```

### Install ganache
This is fake blockchain you run on your own machine. This is optional but makes development faster.

[Instructions](https://truffleframework.com/ganache)

### Start ganache
This will depend on your system. See the instructions in the link above.

### Install IPFS
This is where your JSON data will be stored.

[Instructions](https://docs.ipfs.io/introduction/install/)

### Run IPFS daemon
```console
ipfs daemon
```

### Run tests
Inside the freedom-for-data root directory:
```console
npm run test
```

# How to use

## Using the distributable version in a browser
### Note: You can find the contract addresses by running 'truffle migrate'.
```html
<script src="js/freedom-for-data.js"></script>
<script>
    const freedom = await Freedom({ 
      ipfsHost: 'localhost', 
      ipfsPort: '5001',
      recordContractAddress: "<YOUR CONTRACT ADDRESS HERE>",
      recordContractTransactionHash: "<YOUR CONTRACT TRANSACTION HASH HERE>"
    });  
</script>
```




## Create a record
```javascript

//The repoId we're saving to. Note: will make this nicer
let PLAYER_REPO = 1;

//Create a javascript object with data you want to save.
let createdRecord = {
    firstName: "Andrew",
    lastName: "McCutchen"
}

//Call the 'create' function
let result = await freedom.create(PLAYER_REPO, createdRecord);


/**
* Example result
* 
{ id: 1,                                                            # id:        Generated by smart contract
  eventType: 'NEW',                                                 # eventType: NEW
  repoId: 1,                                                        # repoId:    The id of the repo this record is associated with. Stored in Ethereum.
  ipfsCid: 'zdpuB31DmfwJYHi9FJPoSqLf9fepy6o2qcdk88t9w395b78iT',     # ipfsCid:   Generated by IPFS. 
  owner: '...your address....',                                     # owner:     Saved in smart contract    
  firstName: 'Andrew',                                              # firstName: Stored in IPFS.
  lastName: 'McCutchen'                                             # lastName:  Stored in IPFS.    
}
*/
```

## Read a record by id
```javascript

//Pass the id created above to the read function. The id was 1.
let record = await freedom.read(PLAYER_REPO, 1);

/**
* Example record
* 
{ id: 1,                                                            # id:        Generated by smart contract
  repoId: 1,                                                        # repoId:    The id of the repo this record is associated with. Stored in Ethereum.
  ipfsCid: 'zdpuB31DmfwJYHi9FJPoSqLf9fepy6o2qcdk88t9w395b78iT',     # ipfsCid:   Generated by IPFS. 
  owner: '...your address....',                                     # owner:     Saved in smart contract    
  firstName: 'Andrew',                                              # firstName: Stored in IPFS.
  lastName: 'McCutchen'                                             # lastName:  Stored in IPFS.    
}
*/
```

## Count records in repo
```javascript
let count = await freedom.count(PLAYER_REPO);

/**
 * 'count' is a number. 
 * It's the total number of records in the supplied repo.
 * 
```

## Count the records created by an address in repo
```javascript
let count = await freedom.countOwned(PLAYER_REPO, '0x1E950C631065885d76b21311905acD02c14Aa07E');

/**
 * 'count' is a number. 
 * It's the total number of records in the supplied repo that were created by your address.
 * 
```



## Read a record by index
```javascript

//We've created one player record. Indexing begins at 0. 
let record = await freedom.readByIndex(PLAYER_REPO, 0);

/**
* Example record. This is the same record as the above example.
* 
{ id: 1,                                                            # id:        Generated by smart contract
  repoId: 1,                                                        # repoId:    The id of the repo this record is associated with. Stored in Ethereum.
  ipfsCid: 'zdpuB31DmfwJYHi9FJPoSqLf9fepy6o2qcdk88t9w395b78iT',     # ipfsCid:   Generated by IPFS. 
  owner: '...your address....',                                     # owner:     Saved in smart contract    
  firstName: 'Andrew',                                              # firstName: Stored in IPFS.
  lastName: 'McCutchen'                                             # lastName:  Stored in IPFS.    
}
*/


```

## Read the records you own, by index
```javascript
//readByIndex gives all objects in the repo. readByOwnedIndex() will give you
//just the records that were created by an address. 
let record = await freedom.readByOwnedIndex(PLAYER_REPO, '0x1E950C631065885d76b21311905acD02c14Aa07E', 0);

/**
* Example record. This is the same record as the above example.
* 
{ id: 1,                                                            # id:        Generated by smart contract
  repoId: 1,                                                        # repoId:    The id of the repo this record is associated with. Stored in Ethereum.
  ipfsCid: 'zdpuB31DmfwJYHi9FJPoSqLf9fepy6o2qcdk88t9w395b78iT',     # ipfsCid:   Generated by IPFS. 
  owner: '...your address....',                                     # owner:     Saved in smart contract    
  firstName: 'Andrew',                                              # firstName: Stored in IPFS.
  lastName: 'McCutchen'                                             # lastName:  Stored in IPFS.    
}
*/


```



## Update a record
```javascript

// Record 1 in the player repo is Andrew McCutchen. Change the first name to Charlie and the last name to Morton.
let record = {
    firstName: "Charlie",      
    lastName: "Morton"
}

// Update it in ethereum and IPFS.
await freedom.update( PLAYER_REPO, 1, record)

// Get it by ID. It will list Charlie Morton.
let updatedRecord = await freedom.read(PLAYER_REPO, 1);

/**
 * Example updatedRecord. What actually happened is that we saved a new file in IPFS and updated the
 * ethereum record to point to it. 
    { 
        id: 1,
        owner: '...your address...',
        ipfsCid: 'zdpuAmRyFGYaKdVmEH3uwqzjv8RdSJmnrABkaSizvAu9JBivG',
        repoId: 1,
        lastName: 'Morton',
        firstName: 'Charlie' }
 * 
 */ 

```

## Get a paged list of records. Includes records created by everyone.
```javascript

//This example will get the first 2 records from the list.
let offset = 0;  # The index where we want to start reading. The first record is 0. 
let limit = 2;  # The number of records to return.

let recordList = await freedom.readList(PLAYER_REPO, limit, offset);


/**
 * Example recordList
 * 
 * 
 * [ 
    * { 
    *       id: 1,
            owner: '0x1E950C631065885d76b21311905acD02c14Aa07E',
            ipfsCid: 'zdpuB31DmfwJYHi9FJPoSqLf9fepy6o2qcdk88t9w395b78iT',
            repoId: 1,
            lastName: 'McCutchen',
            firstName: 'Andrew' 
        },
        { 
            id: 2,
            owner: '0x1E950C631065885d76b21311905acD02c14Aa07E',
            ipfsCid: 'zdpuAmZw9bUAufGj4rRddtn6Fu1JDkQqt99rJmDerq1z4B1gL',
            repoId: 1,            
            lastName: 'Melancon',
            firstName: 'Mark' 
        }
    ]
 * 
 */

```

## Get the same list but in descending order, by date created. Includes records created by everyone.
```javascript

//This example will get the first 2 records from the list.
let offset = 0;  # The index where we want to start reading. The first record is 0. 
let limit = 2;  # The number of records to return.

let recordList = await freedom.readListDescending(PLAYER_REPO, limit, offset);


/**
 * Example recordList
 * 
 * 
 * [ 
 * 
       { 
           id: 2,
           owner: '0x1E950C631065885d76b21311905acD02c14Aa07E',
           ipfsCid: 'zdpuAmZw9bUAufGj4rRddtn6Fu1JDkQqt99rJmDerq1z4B1gL',
           repoId: 1,            
           lastName: 'Melancon',
           firstName: 'Mark' 
       }
       { 
           id: 1,
           owner: '0x1E950C631065885d76b21311905acD02c14Aa07E',
           ipfsCid: 'zdpuB31DmfwJYHi9FJPoSqLf9fepy6o2qcdk88t9w395b78iT',
           repoId: 1,
           lastName: 'McCutchen',
           firstName: 'Andrew' 
        }
    ]
 * 
 */

```





## Get a paged list of records created by an address. Only includes records created by the passed address. 
```javascript

//This example will get the first 2 records from the list.
let offset = 0;  # The index where we want to start reading. The first record is 0. 
let limit = 2;  # The number of records to return.

let recordList = await freedom.readOwnedList(PLAYER_REPO, '0x1E950C631065885d76b21311905acD02c14Aa07E', limit, offset);


/**
 * Example recordList
 * 
 * 
 * [ 
    * { 
    *       id: 1,
            owner: '0x1E950C631065885d76b21311905acD02c14Aa07E',
            ipfsCid: 'zdpuB31DmfwJYHi9FJPoSqLf9fepy6o2qcdk88t9w395b78iT',
            repoId: 1,
            lastName: 'McCutchen',
            firstName: 'Andrew' 
        },
        { 
            id: 2,
            owner: '0x1E950C631065885d76b21311905acD02c14Aa07E',
            ipfsCid: 'zdpuAmZw9bUAufGj4rRddtn6Fu1JDkQqt99rJmDerq1z4B1gL',
            repoId: 1,            
            lastName: 'Melancon',
            firstName: 'Mark' 
        }
    ]
 * 
 */

```



## Get the same list but in descending order, by date created. Only includes records created by the passed address. 
```javascript

//This example will get the first 2 records from the list.
let offset = 0;  # The index where we want to start reading. The first record is 0. 
let limit = 2;  # The number of records to return.

let recordList = await freedom.readOwnedListDescending(PLAYER_REPO, '0x1E950C631065885d76b21311905acD02c14Aa07E', limit, offset);


/**
 * Example recordList
 * 
 * 
 * [ 
 *    {   
           id: 2,
           owner: '0x1E950C631065885d76b21311905acD02c14Aa07E',
           ipfsCid: 'zdpuAmZw9bUAufGj4rRddtn6Fu1JDkQqt99rJmDerq1z4B1gL',
           repoId: 1,            
           lastName: 'Melancon',
           firstName: 'Mark' 
       }
    * { 
    *       id: 1,
            owner: '0x1E950C631065885d76b21311905acD02c14Aa07E',
            ipfsCid: 'zdpuB31DmfwJYHi9FJPoSqLf9fepy6o2qcdk88t9w395b78iT',
            repoId: 1,
            lastName: 'McCutchen',
            firstName: 'Andrew' 
        }
    ]
 * 
 */

```


# API

* create(repoId, data, transactionObject)
* read(repoId, id)
* update(repoId, id, data, transactionObject)

* readByIndex(repoId, index)
* readList(repoId, limit, offset)
* readListDescending(repoId, limit, offset)

* readByOwnedIndex(repoId, address, index)
* readOwnedList(repoId, address, limit, offset)
* readOwnedListDescending(repoId, address, limit, offset)

* count(repoId)
* countOwned(repoId)

* ipfsPutFile(file, options)
* ipfsGetFile(cid)







# Configurable
* IPFS gateway is configurable. You can have this be a setting chosen by the user in your app. 
    - It assumes localhost by default. 


## Tradeoffs You Make
* Anything you put in IPFS can theoretically be lost. 
    - If you are creating a financial transaction that is dependent on this data, this probably isn't the right pattern to use.
    
* You'll probably have to pay for IPFS hosting. 
    - Eventually I think this can be done via coin and the DApp itself can be in charge of paying for it. I'm not sure how feasible that is yet.

* There's some centralization risk in IPFS unless you make an effort (paid, probably) to get others to host the files. This should be mitigated over time.

* Probably really slow if talking directly to the main Ethereum network.



### Includes 

* Solidity smart contract that provides a simple CRUD service to store records. 

* Ethereum will store:
    * The ID that was generated.
    * The IPFS cid where your actual data lives.
    * Which contract owns the record, if applicable.

    This keeps gas costs low. 


* IPFS will contain:
    * A JSON representation of your data. 

* Your actual javascript app (React, Angular, whatever) won't care that it's dealing with a DApp.
    - The js files can also be deployed to IPFS.

* Makes very simple requests that can be used in your own DApps. 


### Project Structure

* **/contracts** - Solidity smart contracts
    * RecordService.sol - The primary Solidity contract that provides externally accessible create/read/update functions. 

* **/src** - The javascript library
    * **freedom-service.js** - This is the javascript class you'll get when you require() the library in your web app. Its job is to orchestrate the Ethereum and IPFS calls. It's injected with an object that can talk to the RecordService contract and an object that can talk to IPFS.

    * **record-service.js** - This javascript class is responsible for communicating with the RecordService.sol smart contract.

    * **ipfs-service.js** - This javascript class is responsible for communicating with IPFS.

* **/test** - Unit tests for record-service.js, ipfs-service.js, and integration tests using data-access-service.js


# Examples
We're working on an app that uses freedom-for-data to store data. 
[Large](https://github.com/ptoner/large)



