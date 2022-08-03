import { CardanoObservationExtractor } from "./cardanoExtractor";
import { KoiosTransaction } from "../interfaces/koiosTransaction";
import { cardanoTxValid, generateBlockEntity, loadDataBase } from "./utils.mock";
import { ObservationEntity } from "../entities/observationEntity";

class ExecutorCardano extends CardanoObservationExtractor {
}

describe("cardanoKoiosObservationExtractor", () => {
    describe('getRosenData', () => {

        /**
         * Test that valid Rosen metadata find successfully
         * Dependency: Nothing
         * Scenario: valid Rosen metadata pass to the function
         * Expected: function returns rosenData object
         */
        it('checks valid rosenData', async () => {
            const dataSource = await loadDataBase("getRosenData-cardano");
            const extractor = new ExecutorCardano(dataSource);
            expect(extractor.getRosenData([{
                    key: "0",
                    json: JSON.parse(
                        '{' +
                        '"to": "ERGO",' +
                        '"bridgeFee": "10000",' +
                        '"networkFee": "1000",' +
                        '"toAddress": "ergoAddress",' +
                        '"targetChainTokenId": "cardanoTokenId"' +
                        '}')
                }
                ])
            ).toStrictEqual({
                toChain: "ERGO",
                bridgeFee: "10000",
                networkFee: "1000",
                toAddress: "ergoAddress",
            })
        })

        /**
         * Test that invalid Rosen metadata find successfully
         * Dependency: Nothing
         * Scenario: invalid Rosen metadata pass to the function metadata index is wrong
         * Expected: function returns undefined
         */
        it('checks invalid rosen data', async () => {
            const dataSource = await loadDataBase("getRosenData-cardano");
            const extractor = new ExecutorCardano(dataSource);
            expect(extractor.getRosenData([{
                    key: "0",
                    json: JSON.parse(
                        '{' +
                        '"bridgeFee": "10000",' +
                        '"networkFee": "1000",' +
                        '"toAddress": "ergoAddress",' +
                        '"targetChainTokenId": "cardanoTokenId"' +
                        '}')
                }
                ])
            ).toBe(undefined)
        })
    })

    /**
     * one Valid Transaction should save successfully
     * Dependency: action.storeObservations
     * Scenario: one observation should save successfully
     * Expected: processTransactions should returns true and database row count should be 1
     */
    describe('processTransactionsCardano', () => {
        it('should returns true valid rosen transaction', async () => {
            const dataSource = await loadDataBase("processTransactionCardano-valid-cardano");
            const extractor = new ExecutorCardano(dataSource);
            const Tx: KoiosTransaction = cardanoTxValid;
            const res = await extractor.processTransactions([Tx], generateBlockEntity(dataSource, "1"));
            expect(res).toBe(true);
            const repository = dataSource.getRepository(ObservationEntity);
            const [, rowsCount] = await repository.findAndCount();
            expect(rowsCount).toBe(1);
        })

        /**
         * zero Valid Transaction should save successfully
         * Dependency: action.storeObservations
         * Scenario: zero observation should save successfully
         * Expected: processTransactions should returns true and database row count should be 0
         */
        it('should returns false invalid rosen metadata', async () => {
            const dataSource = await loadDataBase("processTransactionCardano-invalid-cardano");
            const extractor = new ExecutorCardano(dataSource);
            const Tx: KoiosTransaction = {
                ...cardanoTxValid,
                metadata: [{
                    key: "0",
                    json: JSON.parse('{"to": "ERGO","bridgeFee": "10000","toAddress": "ergoAddress","targetChainTokenId": "cardanoTokenId"}')
                }]
            };
            const res = await extractor.processTransactions([Tx], generateBlockEntity(dataSource, "1"));
            expect(res).toBe(true);
            const repository = dataSource.getRepository(ObservationEntity);
            const [, rowsCount] = await repository.findAndCount();
            expect(rowsCount).toBe(0);
        })
    })
})
