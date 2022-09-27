
import _ = require("underscore");
import BasicProducer, { IPower } from "./basic_producer";
import { BasicBingoStruct } from "../game_mode/base_bingo_executor";

enum WildType {
    No = 0,
    Yes = 1,
    Nature = 2
} 

export class SpecialProducer extends BasicProducer{


    protected randBeWild(): boolean {
        let wild: WildType = this.PoolCondSetting.wild;
        if (wild != WildType.Nature) return !!wild;
        return this.randWild();
    }


    protected randStar(isWild: boolean): number {
        let payID: number = this.PoolCondSetting.pay_id;
        let star: number = this._bingoInfo.bingoConfig.Pay.get(payID).stars;
        return star;
    }

    protected randGreen(): number {
        let enterWheelGame: WildType = this.PoolCondSetting.power;
        let balls: number = enterWheelGame == WildType.Yes ? this._bingoInfo.conditionOfBall : _.random(0, this._bingoInfo.conditionOfBall - 1);
        console.log(`有沒有轉盤:${enterWheelGame == WildType.Yes}, 球:${balls}`);
        return balls;
    }

    protected randPower(starAmount: number): IPower {
        let powerId: number = this.PoolCondSetting.power_id;
        let id: number = this._bingoInfo.bingoConfig.Power.get(powerId).id;
        let mul: number = this._bingoInfo.bingoConfig.Power.get(powerId).mul;
        console.log(`計算Power的權重 powerId:${powerId}, id:${id}, mul:${mul}`);
        return {
            id,
            mul
        };
    }

    protected get PoolCondSetting() {
        return this._bingoInfo.bingoConfig.PoolCond.get(this._bingoInfo.poolId);
    }


}


export default SpecialProducer;





