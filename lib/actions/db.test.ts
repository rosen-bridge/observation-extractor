import { ObservationEntityAction } from "./db";
import { ObservationEntity } from "../entities/observationEntity";
import { ExtractedObservation } from "../interfaces/extractedObservation";
import { generateBlockEntity, loadDataBase } from "../extractor/utils.mock";
import { BlockEntity } from "@rosen-bridge/scanner";


const observations: Array<ExtractedObservation> = [{
    fromChain: "erg",
    toChain: "cardano",
    fromAddress: "ErgoAddress",
    toAddress: "cardanoAddress",
    amount: "1000000000",
    bridgeFee: "1000000",
    networkFee: "1000000",
    sourceChainTokenId: "ergoTokenId",
    targetChainTokenId: "cardanoTokenId",
    sourceTxId: "ergoTxId1",
    sourceBlockId: "ergoBlockId",
    requestId: "reqId1",
}, {
    fromChain: "erg",
    toChain: "cardano",
    fromAddress: "ergoAddress",
    toAddress: "cardanoAddress",
    amount: "1100000000",
    bridgeFee: "1000000",
    networkFee: "1000000",
    sourceChainTokenId: "ergoTokenId",
    targetChainTokenId: "cardanoTokenId",
    sourceTxId: "ergoTxId2",
    sourceBlockId: "ergoBlockId",
    requestId: "reqId2",
}];

describe("ObservationEntityAction", () => {
    describe("storeObservation", () => {

        /**
         * 2 valid Observations should save successfully
         * Dependency: Nothing
         * Scenario: 2 observation should save successfully
         * Expected: storeObservations should returns true and database row count should be 2
         */
        it("checks observations saved successfully", async () => {
            const dataSource = await loadDataBase("db");
            const action = new ObservationEntityAction(dataSource);
            const res = await action.storeObservations(observations, generateBlockEntity(dataSource, "1"), "extractor-test");
            expect(res).toBe(false);
            const repository = dataSource.getRepository(ObservationEntity);
            const [, rowsCount] = await repository.findAndCount();
            expect(rowsCount).toBe(2);
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
