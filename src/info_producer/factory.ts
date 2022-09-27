

import { BasicBingoStruct, BingoResult } from "../game_mode/base_bingo_executor";
import _ = require("underscore");
import NatureProducer from "./nature_producer";
import SpecialProducer from "./special_producer";

export enum IBingoMode { 
    Demo = 0,
    Hight = 1,
    Low = 2,
    Nature =3
}

export class Factory { 
  
    private binfoInfo: BasicBingoStruct = undefined;
    constructor(data: BasicBingoStruct) { 
        this.binfoInfo = data;
    }

    public produceResultByMode(mode: IBingoMode): BingoResult {

        console.log(`進入賓果夢工廠, 產出資料模式 mode:${mode}`);
        switch (mode) { 
            case IBingoMode.Nature:
                return new NatureProducer(this.binfoInfo).extractBingoInfoProducer();
            
            case IBingoMode.Demo:
            case IBingoMode.Hight:
            case IBingoMode.Low:
                return new SpecialProducer(this.binfoInfo).extractBingoInfoProducer();
            
            default:
                return null;
        }
    }

}
    

export default Factory;





