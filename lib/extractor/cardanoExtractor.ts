import { DataSource } from "typeorm";
import { Buffer } from "buffer";
import { blake2b } from "blakejs";
import { ExtractedObservation } from "../interfaces/extractedObservation";
import { ObservationEntityAction } from "../actions/db";
import { KoiosTransaction, MetaData } from "../interfaces/koiosTransaction";
import { RosenData } from "../interfaces/rosen";
import { AbstractExtractor, BlockEntity } from "@rosen-bridge/scanner";

export class CardanoObservationExtractor extends AbstractExtractor<KoiosTransaction>{
    private readonly dataSource: DataSource;
    private readonly actions: ObservationEntityAction;

    constructor(dataSource: DataSource) {
        super();
        this.dataSource = dataSource;
        this.actions = new ObservationEntityAction(dataSource);
    }

    /**
     * get Id for current extractor
     */
    getId = () => "ergo-cardano-koios-extractor"

    /**
     * returns rosenData object if the box format is like rosen bridge observations otherwise returns undefined
     * @param metaDataArray
     */
    getRosenData = (metaDataArray: Array<MetaData>): RosenData | undefined => {
        if (metaDataArray.length > 0 && metaDataArray[0].key === "0") {
            const metaData = metaDataArray[0].json;
            if ('to' in metaData
                && 'bridgeFee' in metaData
                && 'networkFee' in metaData
                && 'toAddress' in metaData) {
                const rosenData = metaData as unknown as {
                    to: string;
                    bridgeFee: string;
                    networkFee: string;
                    toAddress: string;
                }
                return {
                    toChain: rosenData.to,
                    bridgeFee: rosenData.bridgeFee,
                    networkFee: rosenData.networkFee,
                    toAddress: rosenData.toAddress
                }
            }
            return undefined
        }
        return undefined
    }

    /**
     * Should return the target token hex string id
     * @param policyId
     * @param assetName
     */
    mockedAssetIds = (policyId: string, assetName: string): { fingerprint: string, tokenId: string } | undefined => {
        // TODO must use tokens package
        console.log(policyId, assetName)
        return {fingerprint: "f6a69529b12a7e2326acffee8383e0c44408f87a872886fadf410fe8498006d3", tokenId: "ergo"}
    }

    /**
     * gets block id and transactions corresponding to the block and saves if they are valid rosen
     *  transactions and in case of success return true and in case of failure returns false
     * @param block
     * @param txs
     */
    processTransactions = (txs: Array<KoiosTransaction>, block: BlockEntity): Promise<boolean> => {
        return new Promise((resolve, reject) => {
                try {
                    const observations: Array<ExtractedObservation> = [];
                    txs.forEach(transaction => {
                        if (transaction.metadata !== undefined) {
                            const data = this.getRosenData(transaction.metadata);
                            if (
                                data !== undefined
                                && transaction.outputs[0].asset_list.length !== 0
                            ) {
                                const asset = transaction.outputs[0].asset_list[0];
                                const assetIds = this.mockedAssetIds(asset.policy_id, asset.asset_name);
                                if (assetIds !== undefined) {
                                    const requestId = Buffer.from(blake2b(transaction.tx_hash, undefined, 32)).toString("hex")
                                    observations.push({
                                        fromChain: 'CARDANO',
                                        toChain: data.toChain,
                                        amount: asset.quantity,
                                        sourceChainTokenId: assetIds.fingerprint,
                                        targetChainTokenId: assetIds.tokenId,
                                        sourceTxId: transaction.tx_hash,
                                        bridgeFee: data.bridgeFee,
                                        networkFee: data.networkFee,
                                        sourceBlockId: block.hash,
                                        requestId: requestId,
                                        toAddress: data.toAddress,
                                        fromAddress: transaction.inputs[0].payment_addr.bech32
                                    })
                                }
                            }
                        }
                    })
                    this.actions.storeObservations(observations, block, this.getId()).then(() => {
                        resolve(true)
                    }).catch((e) => {
                        console.log(`An error occured during store observations: ${e}`)
                        reject(e)
                    })
                } catch
                    (e) {
                    reject(e);
                }
            }
        );
    }

    /**
     * fork one block and remove all stored information for this block
     * @param hash: block hash
     */
    forkBlock = async (hash: string): Promise<void> => {
        await this.actions.deleteBlockObservation(hash, this.getId())
    };

}
