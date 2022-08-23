import { ErgoObservationExtractor } from "./ergoExtractor";
import { generateBlockEntity, loadDataBase, observationTxGenerator } from "./utils.mock";
import { ObservationEntity } from "../entities/observationEntity";
import { tokens } from "./tokens.mocked";
import { Buffer } from "buffer";
import { blake2b } from "blakejs";

class ExtractorErgo extends ErgoObservationExtractor{
}

describe('extractorErgo', () => {
    describe('processTransactions', () => {

        /**
         * 1 Valid Transaction should save successfully
         * Dependency: action.storeObservations
         * Scenario: one valid observation should save successfully
         * Expected: processTransactions should returns true and database row count should be 1 and database fields
         *  should fulfill expected values
         */
        it('checks valid transaction', async () => {
            const dataSource = await loadDataBase("processTransactionErgo");
            const extractor = new ExtractorErgo(dataSource, tokens);
            const Tx1 = observationTxGenerator();
            const Tx3 = observationTxGenerator(false);
            const res = await extractor.processTransactions([Tx1, Tx3], generateBlockEntity(dataSource, "1"));
            expect(res).toBeTruthy();
            const repository = dataSource.getRepository(ObservationEntity);
            const [rows, rowsCount] = await repository.findAndCount();
            expect(rowsCount).toEqual(1);
            const observation1 = rows[0];
            const box1 = Tx1.outputs().get(0);
            expect(observation1).toEqual({
                id: 1,
                fromChain: 'ergo',
                toChain: 'cardano',
                fromAddress: "fromAddress",
                toAddress: "address",
                height: 1,
                amount: box1.tokens().get(0).amount().as_i64().to_str(),
                networkFee: "10000",
                bridgeFee: "1000",
                sourceChainTokenId: box1.tokens().get(0).id().to_str(),
                targetChainTokenId: "cardano",
                sourceBlockId: '1',
                sourceTxId: box1.tx_id().to_str(),
                requestId: Buffer.from(blake2b(box1.tx_id().to_str(), undefined, 32)).toString("hex"),
                block: '1',
                extractor: 'ergo-observation-extractor'
            });
        })

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
            const extractor = new ExtractorErgo(dataSource, tokens);
            const Tx = observationTxGenerator();
            expect(extractor.getRosenData(Tx.outputs().get(0))).toStrictEqual({
                toChain: 'cardano',
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
            const extractor = new ExtractorErgo(dataSource, tokens);
            const Tx = observationTxGenerator(false);
            expect(extractor.getRosenData(Tx.outputs().get(0))).toEqual(undefined)
        })

        /**
         * Test that invalid Rosen output box find successfully
         * Dependency: Nothing
         * Scenario: invalid Rosen Output box pass to the function there is incorrect register value
         * Expected: function returns false
         */
        it('checks transaction without valid register value', async () => {
            const dataSource = await loadDataBase("getRosenData");
            const extractor = new ExtractorErgo(dataSource, tokens);
            const Tx = observationTxGenerator(true, ["Cardano", "address", "10000"]);
            expect(extractor.getRosenData(Tx.outputs().get(0))).toEqual(undefined)
        })
    })
})
