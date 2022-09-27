

import { BingoRand, BasicBingoStruct, CardSetStruct, BingoResult } from "../game_mode/base_bingo_executor";
import _ = require("underscore");
import Slot1101 from "../../../../slot_v2/slot1101";

export interface IPower {
    mul: number,
    id: number
}

export abstract class BasicProducer{

    public _bingoInfo: BasicBingoStruct = undefined;

    constructor(data: BasicBingoStruct) {
        this._bingoInfo = data;
    }


    public extractBingoInfoProducer(): BingoResult {
        let isWild: boolean = this.randBeWild();
        let howManyStars: number = this.randStar(isWild);
        let howManyGreenBall = this.randGreen();
        let powerInfo: IPower = { id: 0, mul: 1 };
        //有進入轉盤+有中獎才randRate
        if (howManyGreenBall >= this._bingoInfo.conditionOfBall && howManyStars >= this._bingoInfo.conditionOfStar) { 
            powerInfo = this.randPower(howManyStars);
        }
        let randInfo: BingoRand = {
            isWild,
            howManyStars,
            powerId: powerInfo.id,
            howManyGreenBall,
            powerRate: powerInfo.mul,
            finalIds: [],
            balls:[]
        }
        
        this.pickThenSaveFinalNumbers(randInfo);
        this.randGreenBall(randInfo);
        let result: BingoResult = {
            info: this._bingoInfo,
            randInfo
        }
        console.log(` 總結果info:${JSON.stringify(randInfo)}`);
        return result;
    }

    protected randWild(): boolean {
        let mum: number = 10000;
        let val: number = this._bingoInfo.bingoConfig.Fixed.get(21).s_value;
        let rand = _.random(1, mum);
        console.log(`產出wild rand:${rand} 基準:${val}  有沒有wild:${rand <= val}`);
        return rand <= val;
    }

    private pickThenSaveFinalNumbers(info: BingoRand) {
        let choseCardInx = _.random(0, Slot1101.CardSetAmount - 1);
        let chosenSet = this._bingoInfo.defaultSets[choseCardInx];
        //決定補wild球否
        let finalIds = info.isWild ? [0] : [];
        if (this.IsWin(info)) { 
            this.addPreciseNumAsWinningStars(info, chosenSet, finalIds);
        }
        //補滿八顆球
        while (finalIds.length < Slot1101.Ball) {
            let pickSet = this._bingoInfo.defaultSets[_.random(0, Slot1101.CardSetAmount-1)];
            if (pickSet.pick.length >= this._bingoInfo.conditionOfBall) continue;
            let pickNum: number = pickSet.ids[_.random(0, Slot1101.Ball - 1)];
            if (finalIds.indexOf(pickNum) != -1) continue;
            pickSet.pick.push(pickNum);
            finalIds.push(pickNum);
        }
        info.finalIds = finalIds;
    }


    private randGreenBall(info: BingoRand) { 
        if (info.howManyGreenBall === 0) return;
        while (info.balls.length < info.howManyGreenBall) { 
            let inx = _.random(0, Slot1101.Ball - 1);
            if (info.finalIds[inx] === 0) continue;
            if (info.balls.indexOf(inx) != -1) continue;
            info.balls.push(inx);
        }
    }

    private addPreciseNumAsWinningStars(info: BingoRand, chosenSet: CardSetStruct, finalIds:number[]) { 
        let stars = info.isWild ? info.howManyStars - 1 : info.howManyStars;
        let arr = _.shuffle<number>(chosenSet.ids).splice(0, stars);
        arr.forEach(x => { 
            finalIds.push(x);
            chosenSet.pick.push(x);
        })
    }


    private IsWin(info: BingoRand): boolean { return info.howManyStars >= this._bingoInfo.conditionOfStar;}

    protected abstract randBeWild(): boolean;

    protected abstract randStar(isWild: boolean): number;

    protected abstract randGreen(): number;

    protected abstract randPower(starAmount: number): IPower;



}


export default BasicProducer;





