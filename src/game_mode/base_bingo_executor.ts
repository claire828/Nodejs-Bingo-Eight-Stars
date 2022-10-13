

export interface SpinRpc { 
    bingo:number[],
    balls: number[],
    pay: ComResourceModule.ComResource[];
    get?: ComResourceModule.ComResource[];
    w_bet?:number
}

export interface BingoResult {
    info: BasicBingoStruct,
    randInfo: BingoRand
}

export interface BasicBingoStruct {
    player: Player,
    bingoConfig: BingoConfig,
    slotId: number,
    mode: IBingoMode,
    conditionOfStar: number,
    conditionOfBall: number,
    defaultSets: CardSetStruct[],
    betInx: number,
    poolId: number,
    poolRowId: number
    hasDrop?: boolean,
   // drop?: GameLog.Game.Slot.Drop
}

export interface BingoRand {
    isWild: boolean,
    howManyStars: number,
    howManyGreenBall: number,
    powerRate: number,
    powerId:number,
    finalIds: number[],
    balls:number[]
}

export interface CardSetStruct {
    ids: number[],
    pick: number[]
}

interface ResourceResult {
    pay: ComResourceModule.ComResource[];
    get?: ComResourceModule.ComResource[];
}

export abstract class BaseBingoExecutor {

    protected _bingoStruct: BasicBingoStruct = undefined;
    protected _bingoResult: BingoResult = undefined;
    private _bingoProducer: Factory = undefined;
    
    protected abstract async validateResult():Promise<boolean>;
    protected abstract async illegalCall();
    protected abstract get checkMode(): boolean;

        
    constructor(bingoStruct: BasicBingoStruct) {
        this.initial(bingoStruct);
    }

    protected initial(bingoStruct: BasicBingoStruct) {
        this._bingoStruct = bingoStruct;
        this._bingoStruct.defaultSets.forEach(x => x.pick = []);
        this._bingoProducer = new Factory(this._bingoStruct);
    }

    public async entreBingo(): Promise<void> {
        this.initial(this._bingoStruct);
        this.processInfoToResult();
        let success = await this.validateResult();
        if (success) {
            let result = this.generateRpcResult;
            console.log(`回傳RPC:${JSON.stringify(result)}`);
            await this.writeToDB();
            this._bingoStruct.player.call.slot.spin(this._bingoStruct.slotId, result);
        } else {
            await this.illegalCall();
            console.log("illegalCall結束");
        }
    }

    private processInfoToResult() {
        this._bingoResult = this._bingoProducer.produceResultByMode(this._bingoStruct.mode);
    }

    private get isWin(): boolean { return this._bingoResult.randInfo.howManyStars >= this._bingoStruct.conditionOfStar; }
    private get cardSetAmount(): number { return this._bingoStruct.bingoConfig.Fixed.get(12).value; }
    private get totalPay(): number { return this.totalBet * this.cardSetAmount; }
    protected get betInfo(): BetInfo { return BetSetting.getBetInfo(this._bingoStruct.slotId, this._bingoStruct.betInx, this._bingoStruct.player.pdAccount.a_id); }
    private get totalBet(): number {return this.betInfo.totalBet; }



    protected get starRate(): number {
        for (let key of this._bingoStruct.bingoConfig.Pay.getIdList()) {
            let star = this._bingoStruct.bingoConfig.Pay.get(+key).stars;
            if (star === this._bingoResult.randInfo.howManyStars) {
                return this._bingoStruct.bingoConfig.Pay.get(+key).pay;
            }
        }
        return undefined;
    }

    protected get isTotalBetRateValidate(): boolean {
       
        let payRate = (this._bingoResult.randInfo.powerRate * this.starRate )/ this.cardSetAmount ;
        let [min, max] = (this._bingoStruct.bingoConfig.PoolSetting.get(this._bingoStruct.poolRowId).award_interval as [number, number]);
        _.isUndefined(max) && (max = min);
        console.log(`[倍率]天花板是否合法:${payRate >= min && payRate <= max} min:${min}, max:${max} , powerRate:${this._bingoResult.randInfo.powerRate}, startRate:${this.starRate}, payRate:${payRate}`);
        if (payRate >= min && payRate <= max) {
            return true;
        } 
        return false;
    }

  
    protected get totalWin(): number {
        if (!this.isWin) return 0;
        return this.totalBet * this.starRate * this._bingoResult.randInfo.powerRate;
    }

   

    protected get generateRpcResult(): SpinRpc {
       
        //付費資訊
        const resourceResult = this.executeResourceAndRoundRecord();
        const spinResult: SpinRpc = {
            bingo: this._bingoResult.randInfo.finalIds,
            balls: this._bingoResult.randInfo.balls,
            pay: resourceResult.pay,
            get: resourceResult.get
        }
        //有才傳
        if (this._bingoResult.randInfo.powerId > 0) spinResult.w_bet = this._bingoResult.randInfo.powerId;
        return spinResult;
    }


    private executeResourceAndRoundRecord(): ResourceResult {
        const playerSlotInfo = this._bingoStruct.player.slotData.get(this._bingoStruct.slotId);
        playerSlotInfo.incRound2();
        const reason: string = "";
        const comResPay = this.minusSpinResource();
        const comResGet = this.giveSlotResource(reason, this.forecingLog);
        console.log(`第幾round的結果:${this.round}`);
        return {
            pay: comResPay,
            get: comResGet
        }
    }

    private get forecingLog(): boolean { 
        if (this._bingoStruct.mode == IBingoMode.Hight || this._bingoStruct.mode == IBingoMode.Low) { 
            return true;
        }
        return false;
    }


    /**
     * 扣除資源
     */
    private minusSpinResource(): ComResourceModule.ComResource[] {
        const $PAY = this._bingoStruct.player.comRes.startTag('pay');
        if (!this._bingoStruct.player.pdResource.minus('money', this.totalPay, GameType.Slot, this._bingoStruct.slotId, this.round)) {
            throw new SpinError.Spin(DisconnectCause.UserError, `Not enough of Money, a_id: ${this._bingoStruct.player.pdAccount.a_id}`);
        }
        $PAY();
        return this._bingoStruct.player.comRes.flush('pay');
    }

    
    public get round(): number {
        const playerSlotInfo = this._bingoStruct.player.slotData.get(this._bingoStruct.slotId);
        return playerSlotInfo.getRound();
    }

    /**
     * 給予Slot中獲得資訊
     */
    private giveSlotResource(comment: string, forceLog: boolean): ComResourceModule.ComResource[] {
        console.log(`倍率結果: starRate:${this.starRate}  totalBet:${this.totalBet}, powerRate:${this._bingoResult.randInfo.powerRate}`);
        const noWin = this.totalWin <= 0;
        if (noWin && !forceLog) {
            console.log(`不寫Log noWin:${noWin}  forceLog:${forceLog}`);
            return [];
        }
        let $GET = this._bingoStruct.player.comRes.startTag(noWin ? ComResourceModule.TAG_IGNORE : 'get');
        this._bingoStruct.player.pdResource.add(`money`, this.totalWin, GameType.Slot, this._bingoStruct.slotId, this.round, comment);
        $GET();
        return this._bingoStruct.player.comRes.flush('get', true);
    }



    private async writeToDB(): Promise<MongoDB.ObjectID> {       
        if (Var.ignoreDbLogSave) {
            return Promise.resolve(undefined);
        }

         //這邊來寫gameLog
        let docLog: GameLog.Game.Slot = {
            time: nowTime(),
            agent: this._bingoStruct.player.pdAccount.agent,
            account: this._bingoStruct.player.pdAccount.account,
            aId: this._bingoStruct.player.pdAccount.a_id,
            subType: this._bingoStruct.slotId,
            round: this.round,
            bet: this.totalBet,
            pay: this.totalWin,
            basePay: this.totalWin,
            spinType: LogCause.Slot.Type.NormalSpin,
            log: "",
            type: GameType.Slot,
            drop: undefined,
        }
        //有換表-> 1. 再補上一個是drop的部分
        //有換表-> 2. 處理gzip
       
        try {
            let spinRet = {
                sets: this._bingoResult.info.defaultSets,
                bingo: this._bingoResult.randInfo.finalIds,
                balls: this._bingoResult.randInfo.balls,
                w_rate:this._bingoResult.randInfo.powerRate
            }; 
             let gzipSpinRet = await new Promise<Buffer>((resolve, reject) => {
                 gzip(JSON.stringify(spinRet), (err, result) => {
                    if (err) {
                        return reject(`aId(${docLog.aId}) gzip spinRet error = ${err.stack}`);
                    }
                    resolve(result);
                });
            });
            docLog.log = gzipSpinRet.toString('base64');
            let insertResult = await Mongo.getDb(Mongo.Dbs.GameLog).collection<GameLog.Game.Slot>(GameLog.Collection.Game).insertOne(docLog);
            return insertResult.insertedId;
           
        } catch (err) {
            Mongo.log().error("logToMongo Error : " + JSON.stringify(docLog) + "\n" + (err instanceof Error ? err.stack : err));
        }
    }

    protected insertPoolInfo(mode: IBingoMode, poolRowID:number) {
        this._bingoStruct.mode = mode;
        this._bingoStruct.poolRowId = poolRowID;
        let row = this._bingoStruct.bingoConfig.PoolSetting.get(poolRowID);
        this._bingoStruct.poolId = row.pool_id[Basic.getItemByWeight(row.pool_weights_sum, <number[]>row.pool_weights)];

        console.log(`指定PoolInfo  rowID:${this._bingoStruct.poolRowId},  poolID:${this._bingoStruct.poolId }`);
    }

    protected disconnectPlayerAsPoolError() { 
        console.log("指定特殊盤不合法 剔除玩家");
        throw new SpinError.PoolLog("Base", this._bingoStruct.player, this._bingoStruct.slotId, 0, this._bingoStruct.poolId, this._bingoStruct.poolRowId)
    }   



}