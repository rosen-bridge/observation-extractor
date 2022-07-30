import { DataSource } from "typeorm";
import * as wasm from 'ergo-lib-wasm-nodejs';
import { Buffer } from "buffer";
import { blake2b } from "blakejs";
import { extractedObservation } from "../interfaces/extractedObservation";
import { ObservationEntityAction } from "../actions/db";
import { rosenData } from "../interfaces/rosen";

export abstract class AbstractExecutorErgo{
    id: string;
    private readonly dataSource: DataSource;
    private readonly actions: ObservationEntityAction;

    constructor(id: string, dataSource: DataSource) {
        this.id = id;
        this.dataSource = dataSource;
        this.actions = new ObservationEntityAction(dataSource);
    }

    /**
     * returns rosenData object if the box format is like rosen bridge observations otherwise returns undefined
     * @param box
     */
    getRosenData = (box: wasm.ErgoBox): rosenData | undefined => {
        const R4 = box.register_value(wasm.NonMandatoryRegisterId.R4)?.to_coll_coll_byte();
        if (R4 !== undefined
            && box.tokens().len() > 0
            && R4.length >= 4
            && this.mockedTokenMap(box.tokens().get(0).id().to_str()) != undefined) {
            return {
                toChain: Buffer.from(R4[0]).toString(),
                toAddress: Buffer.from(R4[1]).toString(),
                networkFee: Buffer.from(R4[2]).toString(),
                bridgeFee: Buffer.from(R4[3]).toString(),
            }
        }
    }

    /**
     * Should return the target token hex string id
     * @param tokenId
     */
    mockedTokenMap = (tokenId: string): string => {
        return "f6a69529b12a7e2326acffee8383e0c44408f87a872886fadf410fe8498006d3"
    }

    /**
     * gets block id and transactions corresponding to the block and saves if they are valid rosen
     *  transactions and in case of success return true and in case of failure returns false
     * @param block
     * @param txs
     */
    processTransactions = (block: string, txs: Array<wasm.Transaction>): Promise<boolean> => {
        return new Promise((resolve, reject) => {
            try {
                const observations: Array<extractedObservation> = [];
                txs.forEach(transaction => {
                    for (let index = 0; index < transaction.outputs().len(); index++) {
                        const output = transaction.outputs().get(index);
                        const data = this.getRosenData(output);
                        if (data !== undefined) {
                            const token = output.tokens().get(0);
                            const inputAddress = "fromAddress";
                            const requestId = Buffer.from(blake2b(output.tx_id().to_str(), undefined, 32)).toString("hex");
                            observations.push({
                                fromChain: "Ergo",
                                toChain: data.toChain,
                                networkFee: data.networkFee,
                                bridgeFee: data.bridgeFee,
                                amount: token.amount().as_i64().to_str(),
                                sourceChainTokenId: token.id().to_str(),
                                targetChainTokenId: this.mockedTokenMap(token.id().to_str()),
                                sourceTxId: output.tx_id().to_str(),
                                sourceBlockId: block,
                                requestId: requestId,
                                toAddress: data.toAddress,
                                fromAddress: inputAddress,
                            })
                        }
                    }
                })
                this.actions.storeObservations(observations, block).then(() => {
                    resolve(true)
                }).catch((e) => {
                    console.log(e);
                    reject(e)
                })
            } catch (e) {

                reject(e);
            }
        });
    }
}
