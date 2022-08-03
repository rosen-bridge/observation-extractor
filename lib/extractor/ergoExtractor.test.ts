import { ErgoObservationExtractor } from "./ergoExtractor";
import { generateBlockEntity, loadDataBase, observationTxGenerator } from "./utils.mock";
import { ObservationEntity } from "../entities/observationEntity";

class ExecutorErgo extends ErgoObservationExtractor {
}

describe('extractorErgo', () => {
    describe('processTransactions', () => {

        /**
         * 2 Valid Transaction should save successfully
         * Dependency: action.storeObservations
         * Scenario: two valid observation should save successfully
         * Expected: processTransactions should returns true and database row count should be 2
         */
        it('checks valid transaction', async () => {
            const dataSource = await loadDataBase("processTransactionErgo");
            const extractor = new ExecutorErgo(dataSource);
            const Tx1 = observationTxGenerator();
            const Tx2 = observationTxGenerator();
            const Tx3 = observationTxGenerator(false);
            const res = await extractor.processTransactions([Tx1, Tx2, Tx3], generateBlockEntity(dataSource, "1"));
            expect(res).toBeFalsy();
            const repository = dataSource.getRepository(ObservationEntity);
            const [, rowsCount] = await repository.findAndCount();
            expect(rowsCount).toBe(2);
        }, 1000000)

    })

    describe('getRosenData', () => {

        /**
         * Test that valid Rosen output box find successfully
         * Dependency: Nothing
         * Scenario: valid Rosen Output box pass to the function
         * Expected: function returns rosenData object
         */
        it('valid rosen transaction', async () => {
            const dataSource = await loadDataBase("getRosenData-ergo");
            const extractor = new ExecutorErgo(dataSource);
            const Tx = observationTxGenerator();
            expect(extractor.getRosenData(Tx.outputs().get(0))).toStrictEqual({
                toChain: 'Cardano',
                toAddress: 'address',
                bridgeFee: '1000',
                networkFee: '10000',
            })
        })

        /**
         * Test that invalid Rosen output box find successfully
         * Dependency: Nothing
         * Scenario: invalid Rosen Output box pass to the function there is no token in the box
         * Expected: function returns undefined
         */
        it('checks transaction without token', async () => {
            const dataSource = await loadDataBase("getRosenData");
            const extractor = new ExecutorErgo(dataSource);
            const Tx = observationTxGenerator(false);
            expect(extractor.getRosenData(Tx.outputs().get(0))).toBe(undefined)
        })

        /**
         * Test that invalid Rosen output box find successfully
         * Dependency: Nothing
         * Scenario: invalid Rosen Output box pass to the function there is incorrect register value
         * Expected: function returns false
         */
        it('checks transaction without valid register value', async () => {
            const dataSource = await loadDataBase("getRosenData");
            const extractor = new ExecutorErgo(dataSource);
            const Tx = observationTxGenerator(true, ["Cardano", "address", "10000"]);
            expect(extractor.getRosenData(Tx.outputs().get(0))).toBe(undefined)
        })
    })
})
