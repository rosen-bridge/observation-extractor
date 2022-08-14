import { ObservationEntity } from "../entities/observationEntity";
import { DataSource } from "typeorm";
import { ExtractedObservation } from "../interfaces/extractedObservation";
import { BlockEntity } from "@rosen-bridge/scanner";

export class ObservationEntityAction {
    private readonly datasource: DataSource;

    constructor(dataSource: DataSource) {
        this.datasource = dataSource;
    }

    /**
     * It stores list of observations in the dataSource with block id
     * @param observations
     * @param block
     * @param extractor
     */
    storeObservations = async (observations: Array<ExtractedObservation>, block: BlockEntity, extractor: string) => {
        const observationEntity = observations.map((observation) => {
            const row = new ObservationEntity();
            row.block = block.hash;
            row.height = block.height;
            row.bridgeFee = observation.bridgeFee;
            row.amount = observation.amount;
            row.fromAddress = observation.fromAddress;
            row.fromChain = observation.fromChain;
            row.networkFee = observation.networkFee;
            row.requestId = observation.requestId;
            row.sourceBlockId = observation.sourceBlockId;
            row.sourceTxId = observation.sourceTxId;
            row.toChain = observation.toChain;
            row.sourceChainTokenId = observation.sourceChainTokenId;
            row.targetChainTokenId = observation.targetChainTokenId;
            row.toAddress = observation.toAddress;
            row.extractor = extractor
            return row;
        });
        let success = true;
        const queryRunner = this.datasource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            await queryRunner.manager.save(observationEntity);
            await queryRunner.commitTransaction();
        } catch (e) {
            console.log(`An error occurred during store observation action: ${e}`)
            await queryRunner.rollbackTransaction();
            success = false;
        } finally {
            await queryRunner.release();
        }
        return success;
    }

    deleteBlockObservation = async (block: string, extractor: string) => {
        await this.datasource.createQueryBuilder()
            .delete()
            .from(ObservationEntity)
            .where("extractor = :extractor AND block = :block", {
                "block": block,
                "extractor": extractor
            }).execute()
    }

}
