const TestServiceFactory = require('./test-service-factory.js');
const serviceFactory = new TestServiceFactory();

var TestUtils = require('./test-utils.js');

const fs = require('fs');

const Web3Exception = require('../src/exceptions/web3-exception.js');
const ValidationException = require('../src/exceptions/validation-exception.js');

contract('FreedomService', async (accounts) => {

    var testUtils = new TestUtils();

    let createdCount = 0;

    let TEST_REPO1 = 1;
   
    let freedomService

    before('Setup', async () => {
        serviceFactory.setContract(await serviceFactory.contract.deployed())
        freedomService = serviceFactory.getFreedomService()
    })


    it("Test callReadList: Get empty list", async () => {

        let itemList = await freedomService.readList(TEST_REPO1, 10, 0);

        assert.equal(itemList.length, 0);
    });

    it("Test callReadListDescending: Get empty list", async () => {

        let itemList = await freedomService.readListDescending(TEST_REPO1, 10, 0);

        assert.equal(itemList.length, 0);

    });

    it("Test create/read: Create a 'person' record and verify the info is stored on blockchain and IPFS", async () => {

        //Arrange
        let createdRecord = {
            firstName: "Andrew",
            lastName: "McCutchen"
        }

        //Act
        let resultCreatedRecord = await freedomService.create(TEST_REPO1, createdRecord);

        createdCount++;

        //Compare what we just created with what we expect the result to look like. 
        testUtils.assertRecordsMatch( resultCreatedRecord, {
            id: 1,
            eventType: "NEW",
            repoId: TEST_REPO1,
            ipfsCid: "zdpuB31DmfwJYHi9FJPoSqLf9fepy6o2qcdk88t9w395b78iT",
            owner: accounts[0],
            firstName: "Andrew",
            lastName: "McCutchen"
        })

        //Also verify with a read.
        let record = await freedomService.read(TEST_REPO1, resultCreatedRecord.id);
        

        /**
         * Expected record
         * 
         * { 
         *      id: 1,
                owner: '...will match first address...',
                ipfsCid: 'zdpuB31DmfwJYHi9FJPoSqLf9fepy6o2qcdk88t9w395b78iT',
                firstName: 'Andrew'
                lastName: 'McCutchen'
            }
         */

        testUtils.assertRecordsMatch( record, {
            id: 1,
            repoId: TEST_REPO1,
            ipfsCid: "zdpuB31DmfwJYHi9FJPoSqLf9fepy6o2qcdk88t9w395b78iT",
            owner: accounts[0],
            firstName: "Andrew",
            lastName: "McCutchen"
        })


    });

    it("Test read: Zero repoId", async () => {
        
        //Act
        try {
            let result = await freedomService.read(0, 1);
            assert.fail("Did not throw Web3Exception")
        } catch(ex) {
            //Assert
            assert.isTrue(ex instanceof Web3Exception, "Should have thrown an error");
            assert.equal(
                "You must supply a repo",
                testUtils.getRequireMessage(ex),
                "Supply a non-empty repo"
            );
        }

    });

    it("Test read: Zero id", async () => {
        
        //Act
        try {
            let result = await freedomService.read(1, 0);
            assert.fail("Did not throw Web3Exception")
        } catch(ex) {
            //Assert
            assert.isTrue(ex instanceof Web3Exception, "Should have thrown an error");
            assert.equal(
                "You must supply an id",
                testUtils.getRequireMessage(ex),
                "Supply an id"
            );
        }



    });

    it("Test read: Invalid positive id", async () => {
        
        //Act
        try {
            let result = await freedomService.read(1, 5000);
            assert.fail("Did not throw Web3Exception")
        } catch(ex) {
            //Assert
            assert.isTrue(ex instanceof Web3Exception, "Should have thrown an error");
            assert.equal(
                "No record found",
                testUtils.getRequireMessage(ex),
                "No record found"
            );
        }

    });

    it("Test sendCreate: Zero repoId", async () => {
        
        //Arrange
        let createdRecord = {
            firstName: "Andrew",
            lastName: "McCutchen"
        }

        try {
            await freedomService.create(0, createdRecord);
            assert.fail("Did not throw Web3Exception")
        } catch(ex) {
            //Assert
            assert.isTrue(ex instanceof Web3Exception, "Should have thrown an error");
            assert.equal(
                "You must supply a repo -- Reason given: You must supply a repo.",
                testUtils.getRequireMessage(ex),
                "Should fail to let non-owner call create"
            );
        }



    });

    it("Test count: Create some records and then call count and make sure it matches", async () => {

        //Arrange
        await freedomService.create(TEST_REPO1, { firstName: "Mark", lastName: "Melancon" });
        await freedomService.create(TEST_REPO1, { firstName: "Gregory", lastName: "Polanco" });
        await freedomService.create(TEST_REPO1, { firstName: "Jordy", lastName: "Mercer" });
        await freedomService.create(TEST_REPO1, { firstName: "Pedro", lastName: "Alvarez" });
        await freedomService.create(TEST_REPO1, { firstName: "Matt", lastName: "Joyce" });

        createdCount += 5;

        //Act
        let count = await freedomService.count(TEST_REPO1);

        assert.equal(count, createdCount);

    });

    it("Test count: Pass zero repoId", async () => {

        //Act
        try {
            await freedomService.count(0)
            assert.fail("Did not throw Web3Exception")
        } catch(ex) {
            //Assert
            assert.isTrue(ex instanceof Web3Exception, "Should have thrown an error");
            assert.equal(
                "You must supply a repo",
                testUtils.getRequireMessage(ex),
                "You must supply a repo"
            );
        }

    });

    it("Test count: Pass positive invalid repoId. Get zero count.", async () => {
        
        //Act
        let count = await freedomService.count(200);
        
        //Assert
        assert.equal(count, 0);
        
    });

    it("Test update: Update a record and make sure the changes are saved.", async () => {
        
        //Arrange
        let resultCreatedRecord = await freedomService.create(TEST_REPO1, { firstName: "Gerrit", lastName: "Cole" });

        
        //Act
        await freedomService.update(
            TEST_REPO1, 
            resultCreatedRecord.id, 
            {
                firstName: "Charlie",
                lastName: "Morton"
            }
        )


        //Assert
        let refetchedRecord = await freedomService.read(TEST_REPO1, resultCreatedRecord.id);

        assert.equal(refetchedRecord.firstName, "Charlie");
        assert.equal(refetchedRecord.lastName, "Morton");
    });

    it("Test update: Update a record this account doesn't own", async () => {
        
        //Arrange
        let resultCreatedRecord = await freedomService.create(TEST_REPO1, { firstName: "Gerrit", lastName: "Cole" });

        
        let error;


        try {
            await freedomService.update(
                TEST_REPO1, 
                resultCreatedRecord.id, 
                {
                    firstName: "Charlie",
                    lastName: "Morton"
                },
                {
                    from: accounts[1]
                }
            )

            assert.fail("Did not throw Web3Exception")
        } catch(ex) {
            //Assert
            assert.isTrue(ex instanceof Web3Exception, "Should have thrown an error");
            assert.equal(
                "You don't own this record -- Reason given: You don't own this record.",
                testUtils.getRequireMessage(ex),
                "Should fail to update record user doesn't own."
            );
        }


        //Do a read and make sure it shows the original value
        let refetchechRecord = await freedomService.read(TEST_REPO1, resultCreatedRecord.id);


        assert.equal(refetchechRecord.firstName, "Gerrit");
        assert.equal(refetchechRecord.lastName, "Cole");
    });

    it("Test update: Invalid positive id", async () => {

        //Act
        try {
            await freedomService.update(
                TEST_REPO1, 
                5000, 
                {
                    firstName: "Charlie",
                    lastName: "Morton"
                }
            )

            assert.fail("Did not throw Web3Exception")
        } catch(ex) {
            //Assert
            assert.isTrue(ex instanceof Web3Exception, "Should have thrown an error");
            assert.equal(
                "You don't own this record -- Reason given: You don't own this record.",
                testUtils.getRequireMessage(ex),
                "Invalid positive id"
            );
        }

        
    });

    it("Test readByIndex: Read all the records we've written so far", async () => {

        await assertIndexAndRecordMatch(0, {
            id: 1,
            repoId: TEST_REPO1,
            ipfsCid: "zdpuB31DmfwJYHi9FJPoSqLf9fepy6o2qcdk88t9w395b78iT",
            owner: accounts[0],
            firstName: "Andrew",
            lastName: "McCutchen"
        });

        await assertIndexAndRecordMatch(1, {
            id: 2,
            repoId: TEST_REPO1,
            ipfsCid: "zdpuAmZw9bUAufGj4rRddtn6Fu1JDkQqt99rJmDerq1z4B1gL",
            owner: accounts[0],
            firstName: "Mark",
            lastName: "Melancon"
        });

        await assertIndexAndRecordMatch(2, { 
            id: 3,
            owner: accounts[0],
            ipfsCid: 'zdpuAy4MmXJTPVReEWNpqnRJ7JTABiQ6zhXvE9kNcqKi4pL81',
            repoId: TEST_REPO1,
            lastName: 'Polanco',
            firstName: 'Gregory' 
        });

        await assertIndexAndRecordMatch(3, { 
            id: 4,
            owner: accounts[0],
            ipfsCid: 'zdpuApos8UX53uT1Hiwz1ovSB7nUToi2TSz8FQyzMHpQUtWmx',
            repoId: TEST_REPO1,
            lastName: 'Mercer',
            firstName: 'Jordy' 
        });

        await assertIndexAndRecordMatch(4, { 
            id: 5,
            owner: accounts[0],
            ipfsCid: 'zdpuB3UBv6XoPD8xim1CWuXBNvoXb3heydJfurQ5EQTGHcqAa',
            repoId: TEST_REPO1,
            lastName: 'Alvarez',
            firstName: 'Pedro' 
        });

        await assertIndexAndRecordMatch(5, { 
            id: 6,
            owner: accounts[0],
            ipfsCid: 'zdpuAynrpuQwgY4DwsDbd4TfPF6pv25f8rcvjnHLCw9j6sp6k',
            repoId: TEST_REPO1,
            lastName: 'Joyce',
            firstName: 'Matt' 
        });


        await assertIndexAndRecordMatch(6, { 
            id: 7,
            owner: accounts[0],
            ipfsCid: 'zdpuAmRyFGYaKdVmEH3uwqzjv8RdSJmnrABkaSizvAu9JBivG',
            repoId: TEST_REPO1,
            lastName: 'Morton',
            firstName: 'Charlie' 
        });

        await assertIndexAndRecordMatch(7, { 
            id: 8,
            owner: accounts[0],
            ipfsCid: 'zdpuAxYoviWmkBkQf32U1RXyG2tNK4ajMtdVa456hJt6wgLac',
            repoId: TEST_REPO1,
            lastName: 'Cole',
            firstName: 'Gerrit' 
        });


    });

    it("Test readByIndex: Zero repoId", async () => {

        //Act
        try {
            await freedomService.readByIndex(0, 0);
            assert.fail("Did not throw Web3Exception")
        } catch(ex) {
            //Assert
            assert.isTrue(ex instanceof Web3Exception, "Should have thrown an error");
            assert.equal(
                "You must supply a repo",
                testUtils.getRequireMessage(ex),
                "You must supply a repo"
            );
        }

    });

    it("Test readByIndex: Invalid index out of bounds", async () => {

        //Act
        try {
            await freedomService.readByIndex(TEST_REPO1, 100000);
            assert.fail("Did not throw Web3Exception")
        } catch(ex) {

            //Assert
            assert.isTrue(ex instanceof Web3Exception, "Should have thrown an error");
            assert.equal(
                "No record at index",
                testUtils.getRequireMessage(ex),
                "No record at index"
            );
        }


    });

    it("Test readList: Limit greater than list size", async () => {
        assert.equal(await freedomService.count(TEST_REPO1), 8, "Count is incorrect");

        let itemList = await freedomService.readList(TEST_REPO1, 10, 0);

        assert.equal(itemList.length, 8);
    });

    it("Test readList: Check for duplicates", async () => {

        //Arrange
        for (var i=0; i < 50; i++) {
            await freedomService.create(TEST_REPO1, { firstName: "Gerrit", lastName: "Cole" });
        }

        assert.equal(await freedomService.count(TEST_REPO1), 58, "Count is incorrect");


        //Act
        let limit = 10;

        var foundIds = [];
        for (var i=0; i < 5; i++) {
        
            let recordList = await freedomService.readList(TEST_REPO1, limit, i*limit);

            for (record of recordList) {
                if (foundIds.includes(record.id)) {
                    assert.fail("Duplicate ID found in page");
                }

                foundIds.push(record.id);
            }
        }

    });

    it("Test readList: Negative offset", async () => {

        //Act
        let error;

        try {
            let results = await freedomService.readList(TEST_REPO1, 10, -1);
            assert.fail("Did not throw ValidationException")
        } catch(ex) {

            //Assert
            assert.equal("Negative offset provided. Offset needs to be positive: -1", ex.message, "Error message does not match");
            assert.isTrue(ex instanceof ValidationException, "Should have thrown ValidationException");
        }





    });

    it("Test callReadList: Offset greater than list size", async () => {

        //Act
        try {
            let itemList = await freedomService.readList(TEST_REPO1, 10, 58);
            assert.fail("Did not throw ValidationException")
        } catch(ex) {
            //Assert
            assert.equal("Invalid offset provided. Offset must be lower than total number of records: offset: 58, currrentCount: 58", ex.message, "Error message does not match");
            assert.isTrue(ex instanceof ValidationException, "Should have thrown ValidationException");
        }

    });

    it("Test readList: Negative limit", async () => {

        //Act
        try {
            let results = await freedomService.readList(TEST_REPO1, -1, 0);
            assert.fail("Did not throw ValidationException")
        } catch(ex) {
            //Assert
            assert.equal("Negative limit given. Limit needs to be positive: -1", ex.message, "Error message does not match");
            assert.isTrue(ex instanceof ValidationException, "Should have thrown ValidationException");
        }


    });

    it("Test readList: Zero limit", async () => {

        //Arrange
        assert.equal(await freedomService.count(TEST_REPO1), 58, "Count is incorrect");


        //Act
        try {
            let results = await freedomService.readList(TEST_REPO1, 0, 0);
            assert.fail("Did not throw ValidationException")
        } catch(ex) {
            //Assert
            assert.equal("Negative limit given. Limit needs to be positive: 0", ex.message, "Error message does not match");
            assert.isTrue(ex instanceof ValidationException, "Should have thrown ValidationException");
        }

    });

    it("Test readListDescending: Verify records already inserted", async () => {

        let records = await freedomService.readListDescending(TEST_REPO1, 10, 0)


        testUtils.assertRecordsMatch(records[0], {
            id: 58,
            owner: accounts[0],
            ipfsCid: 'zdpuAxYoviWmkBkQf32U1RXyG2tNK4ajMtdVa456hJt6wgLac',
            repoId: 1,
            lastName: 'Cole',
            firstName: 'Gerrit'
        });

        testUtils.assertRecordsMatch(records[1], {
            id: 57,
            owner: accounts[0],
            ipfsCid: 'zdpuAxYoviWmkBkQf32U1RXyG2tNK4ajMtdVa456hJt6wgLac',
            repoId: 1,
            lastName: 'Cole',
            firstName: 'Gerrit'
        });

        testUtils.assertRecordsMatch(records[2], {
            id: 56,
            owner: accounts[0],
            ipfsCid: 'zdpuAxYoviWmkBkQf32U1RXyG2tNK4ajMtdVa456hJt6wgLac',
            repoId: 1,
            lastName: 'Cole',
            firstName: 'Gerrit'
        });

        testUtils.assertRecordsMatch(records[3], {
            id: 55,
            owner: accounts[0],
            ipfsCid: 'zdpuAxYoviWmkBkQf32U1RXyG2tNK4ajMtdVa456hJt6wgLac',
            repoId: 1,
            lastName: 'Cole',
            firstName: 'Gerrit'
        });

        testUtils.assertRecordsMatch(records[4], {
            id: 54,
            owner: accounts[0],
            ipfsCid: 'zdpuAxYoviWmkBkQf32U1RXyG2tNK4ajMtdVa456hJt6wgLac',
            repoId: 1,
            lastName: 'Cole',
            firstName: 'Gerrit'
        });

        testUtils.assertRecordsMatch(records[5], {
            id: 53,
            owner: accounts[0],
            ipfsCid: 'zdpuAxYoviWmkBkQf32U1RXyG2tNK4ajMtdVa456hJt6wgLac',
            repoId: 1,
            lastName: 'Cole',
            firstName: 'Gerrit'
        });

        testUtils.assertRecordsMatch(records[6], {
            id: 52,
            owner: accounts[0],
            ipfsCid: 'zdpuAxYoviWmkBkQf32U1RXyG2tNK4ajMtdVa456hJt6wgLac',
            repoId: 1,
            lastName: 'Cole',
            firstName: 'Gerrit'
        });

        testUtils.assertRecordsMatch(records[7], {
            id: 51,
            owner: accounts[0],
            ipfsCid: 'zdpuAxYoviWmkBkQf32U1RXyG2tNK4ajMtdVa456hJt6wgLac',
            repoId: 1,
            lastName: 'Cole',
            firstName: 'Gerrit'
        });

        testUtils.assertRecordsMatch(records[8], {
            id: 50,
            owner: accounts[0],
            ipfsCid: 'zdpuAxYoviWmkBkQf32U1RXyG2tNK4ajMtdVa456hJt6wgLac',
            repoId: 1,
            lastName: 'Cole',
            firstName: 'Gerrit'
        });

        testUtils.assertRecordsMatch(records[9], {
            id: 49,
            owner: accounts[0],
            ipfsCid: 'zdpuAxYoviWmkBkQf32U1RXyG2tNK4ajMtdVa456hJt6wgLac',
            repoId: 1,
            lastName: 'Cole',
            firstName: 'Gerrit'
        });


    });

    it("Test ipfsPutFile & ipfsGetFile: Save an image then try to get it back out with IPFS directly and verify.", async function() {
      
        //Arrange
        const buffer = fs.readFileSync('test/binary/test-image.jpeg');


        //Act 
        const cid = await freedomService.ipfsPutFile(buffer);


        //Assert
        const result = await freedomService.ipfsGetFile(cid);

        assert.isTrue(buffer.equals(result));
        
    });



    it("Test createWithIpfsCid: Create with IPFS CID", async () => {

        let ipfsCid = await freedomService.ipfsService.ipfsPutJson({field: "whatever"})

        let record = await freedomService.createWithIpfsCid(TEST_REPO1, ipfsCid)

        assert.equal(record.ipfsCid, ipfsCid)

        let fetchedRecord = await freedomService.read(TEST_REPO1, record.id)

        assert.equal(fetchedRecord.ipfsCid, ipfsCid)


    })




    async function assertIndexAndRecordMatch(index, record) {

        let recordAtIndex = await freedomService.readByIndex(TEST_REPO1, index);

        // console.log("assertIndexAndRecordMatch");
        // console.log("Record:");
        // console.log(record);
        // console.log("Record at index:" + index);
        // console.log(recordAtIndex);
        // console.log('---------------');

        testUtils.assertRecordsMatch(record, recordAtIndex);
    }


});