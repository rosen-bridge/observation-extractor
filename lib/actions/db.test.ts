import { ObservationEntityAction } from "./db";
import { ObservationEntity } from "../entities/observationEntity";
import { clearDB, generateBlockEntity, loadDataBase } from "../extractor/utils.mock";
import { BlockEntity } from "@rosen-bridge/scanner";
import { DataSource } from "typeorm";
import { firstObservations, secondObservations } from "../extractor/observations.mock";
import anything = jasmine.anything;


let dataSource: DataSource;

describe("ObservationEntityAction", () => {

    beforeAll(async () => {
        dataSource = await loadDataBase("storeObservation");
    });

    afterEach(async () => {
        await clearDB(dataSource);
    });

    describe("storeObservation", () => {

        /**
         * 2 valid Observations should save successfully
         * Dependency: Nothing
         * Scenario: 2 observation should save successfully
         * Expected: storeObservations should returns true and database row count should be 2 and each row should save
         *  observations correctly
         */
        it("checks observations saved successfully", async () => {
            const action = new ObservationEntityAction(dataSource);
            const res = await action.storeObservations(
                firstObservations,
                generateBlockEntity(dataSource, "1"),
                "extractor-test"
            );
            expect(res).toBe(true);
            const repository = dataSource.getRepository(ObservationEntity);
            const [rows, rowsCount] = await repository.findAndCount();
            expect(rowsCount).toBe(2);
            expect(rows[0]).toEqual({
                ...firstObservations[0],
                block: "1",
                extractor: "extractor-test",
                height: 1,
                id: anything()
            })
            expect(rows[1]).toEqual({
                ...firstObservations[1],
                block: "1",
                extractor: "extractor-test",
                height: 1,
                id: anything()
            })
        })

        /**
         * observations with different extractor should save successfully
         * Dependency: Nothing
         * Scenario: 2 extractor exist and each one save 2 different observations
         * Expected: storeObservations should returns true and each saved observation should have valid fields
         */
        it("checks that observations saved successfully with two different extractor", async () => {
            const action = new ObservationEntityAction(dataSource);
            let res = await action.storeObservations(
                firstObservations,
                generateBlockEntity(dataSource, "1"),
                "first-extractor"
            );
            expect(res).toBe(true);
            res = await action.storeObservations(
                secondObservations,
                generateBlockEntity(dataSource, "1"),
                "second-extractor"
            );
            expect(res).toBe(true);
            const repository = dataSource.getRepository(ObservationEntity);
            const [rows, rowsCount] = await repository.findAndCount();
            expect(rowsCount).toBe(4);
            expect(rows[0]).toEqual({
                ...firstObservations[0],
                block: "1",
                extractor: "first-extractor",
                height: 1,
                id: anything()
            });
            expect(rows[1]).toEqual({
                ...firstObservations[1],
                block: "1",
                extractor: "first-extractor",
                height: 1,
                id: anything()
            })
            expect(rows[2]).toEqual({
                ...secondObservations[0],
                block: "1",
                extractor: "second-extractor",
                height: 1,
                id: anything()
            })
            expect(rows[3]).toEqual({
                ...secondObservations[1],
                block: "1",
                extractor: "second-extractor",
                height: 1,
                id: anything()
            })

        })

        /**
         * duplicated observation field should update
         * Dependency: Nothing
         * Scenario: 2 observation added to the table and then another observation with same 'requestId' but different
         *  'toAddress' field added to table
         * Expected: storeObservations should returns true and each saved observation should have valid observation in
         *  each step
         */
        it("checks that duplicated observation updated with same extractor", async () => {
            const action = new ObservationEntityAction(dataSource);
            let res = await action.storeObservations(
                firstObservations,
                generateBlockEntity(dataSource, "1"),
                "first-extractor"
            );
            expect(res).toBe(true);
            const repository = dataSource.getRepository(ObservationEntity);
            let [rows, rowsCount] = await repository.findAndCount();
            expect(rowsCount).toBe(2);
            expect(rows[0]).toEqual({
                ...firstObservations[0],
                block: "1",
                extractor: "first-extractor",
                height: 1,
                id: anything()
            });
            expect(rows[1]).toEqual({
                ...firstObservations[1],
                block: "1",
                extractor: "first-extractor",
                height: 1,
                id: anything()
            })
            res = await action.storeObservations(
                [{...firstObservations[0], toAddress: "newAddress"}],
                generateBlockEntity(dataSource, "1"),
                "first-extractor"
            );
            expect(res).toBe(true);
            [rows, rowsCount] = await repository.findAndCount();
            expect(rowsCount).toBe(2);
            expect(rows[0]).toEqual({
                ...firstObservations[0],
                block: "1",
                extractor: "first-extractor",
                height: 1,
                toAddress: "newAddress",
                id: anything()
            });

        })

        /**
         * two observation with same requestId but different extractor added to the table
         * Dependency: Nothing
         * Scenario: 2 observation added to the table and then another observation with same 'requestId' but different
         *  'observation' & 'toAddress' field added to table
         * Expected: storeObservations should returns true and each saved observation should have valid observation in
         *  each step
         */
        it("checks that duplicated observation updated with same extractor", async () => {
            const action = new ObservationEntityAction(dataSource);
            let res = await action.storeObservations(
                firstObservations,
                generateBlockEntity(dataSource, "1"),
                "first-extractor"
            );
            expect(res).toBe(true);
            const repository = dataSource.getRepository(ObservationEntity);
            let [rows, rowsCount] = await repository.findAndCount();
            expect(rowsCount).toBe(2);
            expect(rows[0]).toEqual({
                ...firstObservations[0],
                block: "1",
                extractor: "first-extractor",
                height: 1,
                id: anything()
            });
            expect(rows[1]).toEqual({
                ...firstObservations[1],
                block: "1",
                extractor: "first-extractor",
                height: 1,
                id: anything()
            })
            res = await action.storeObservations(
                [{...firstObservations[0], toAddress: "newAddress"}],
                generateBlockEntity(dataSource, "1"),
                "second-extractor"
            );
            expect(res).toBe(true);
            [rows, rowsCount] = await repository.findAndCount();
            expect(rowsCount).toBe(3);
            expect(rows[2]).toEqual({
                ...firstObservations[0],
                block: "1",
                extractor: "second-extractor",
                height: 1,
                toAddress: "newAddress",
                id: anything()
            });

        })

    })


    /**
     * Test when fork a block must deleted from database
     */
    describe("deleteBlockObservation", () => {
        it("should remove only block with specific block id and extractor id", async () => {
            const genHexString = (len = 64) => {
                const hex = '0123456789ABCDEF';
                let output = '';
                for (let i = 0; i < len; ++i) {
                    output += hex.charAt(Math.floor(Math.random() * hex.length));
                }
                return output;
            }
            const dataSource = await loadDataBase("fork");
            const action = new ObservationEntityAction(dataSource);
            const insertObservation = async (extractor: string, block: BlockEntity) => {
                await action.storeObservations([{
                    sourceBlockId: block.hash,
                    bridgeFee: "100",
                    networkFee: "1000",
                    amount: "10000",
                    fromAddress: genHexString(),
                    requestId: genHexString(),
                    sourceChainTokenId: genHexString(),
                    sourceTxId: genHexString(),
                    targetChainTokenId: genHexString(),
                    toChain: genHexString(),
                    toAddress: genHexString(),
                    fromChain: genHexString()
                }], block, extractor)
            }
            const block1 = generateBlockEntity(dataSource, "block1")
            const block2 = generateBlockEntity(dataSource, "block2", "block1", 2)
            await insertObservation("cardano", block1)
            await insertObservation("cardano", block2)
            await insertObservation("ergo", block1)
            await insertObservation("ergo", block2)
            expect((await dataSource.getRepository(ObservationEntity).find()).length).toBe(4)
            await action.deleteBlockObservation("block1", "ergo")
            expect((await dataSource.getRepository(ObservationEntity).find()).length).toBe(3)
        })
    })
})
