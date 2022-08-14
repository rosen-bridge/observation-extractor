import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

export enum TxStatus {
    TIMED_OUT = 0,
    NOT_COMMITTED = 1,
    COMMITMENT_SENT = 2,
    COMMITTED = 3,
    REVEAL_SENT = 4,
    REVEALED = 5,
}

@Entity()
export class ObservationEntity{
    @PrimaryGeneratedColumn()
    id: number

    @Column({
        length: 30,
    })
    fromChain: string

    @Column({
        length: 30,
    })
    toChain: string

    @Column()
    fromAddress: string

    @Column()
    toAddress: string

    @Column()
    height: number

    @Column()
    amount: string

    @Column()
    networkFee: string

    @Column()
    bridgeFee: string

    @Column()
    sourceChainTokenId: string

    @Column()
    targetChainTokenId: string

    @Column()
    sourceTxId: string

    @Column()
    sourceBlockId: string

    @Column({unique: true})
    requestId: string

    @Column()
    block: string;

    @Column({
        type: 'simple-enum',
        enum: TxStatus
    })
    status: TxStatus

    @Column()
    extractor: string;
}
