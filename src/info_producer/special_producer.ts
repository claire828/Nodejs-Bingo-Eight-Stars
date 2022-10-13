
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
        const wild: WildType = this.PoolCondSetting.wild;
        if (wild != WildType.Nature) return !!wild;
        return this.randWild();
    }


    protected randStar(isWild: boolean): number {
        const payID: number = this.PoolCondSetting.pay_id;
        const star: number = this._bingoInfo.bingoConfig.Pay.get(payID).stars;
        return star;
    }

    protected randGreen(): number {
        const enterWheelGame: WildType = this.PoolCondSetting.power;
        const balls: number = enterWheelGame == WildType.Yes ? this._bingoInfo.conditionOfBall : _.random(0, this._bingoInfo.conditionOfBall - 1);
        console.log(`有沒有轉盤:${enterWheelGame == WildType.Yes}, 球:${balls}`);
        return balls;
    }

    protected randPower(starAmount: number): IPower {
        const powerId: number = this.PoolCondSetting.power_id;
        const id: number = this._bingoInfo.bingoConfig.Power.get(powerId).id;
        const mul: number = this._bingoInfo.bingoConfig.Power.get(powerId).mul;
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





