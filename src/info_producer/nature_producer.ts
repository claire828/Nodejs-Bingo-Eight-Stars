

import Basic from "../../../../common/lib/basic";
import _ = require("underscore");
import BasicProducer, { IPower } from "./basic_producer";


export class NatureProducer extends BasicProducer {


    protected randBeWild(): boolean {
        return this.randWild();
    }

    protected randStar(isWild: boolean): number {
        let form = this._bingoInfo.bingoConfig.Pay;
        let ids = _.range(1,5);
        let startsList = form.getColValueByIds(`stars`, ids)
        let tempWeightValus = isWild ? form.getColValueByIds(`weights_withwild`, ids) : form.getColValueByIds(`weights_nowild`, ids);
        let weight = _.object<Basic.NKeyValue<number>>(startsList,tempWeightValus);
        let star = +Basic.randWithWeight(weight);

        console.log(`tempWeightValus:${tempWeightValus}, startsList:${startsList}, weight:${weight}, star:${star}`);
        return star;
    }

    protected randGreen(): number {
        let weight = _.object<Basic.NKeyValue<number>>(_.range(0,3), this._bingoInfo.bingoConfig.Fixed.getColValueByIds("s_value", [31, 32, 33, 34]));
        let hitIndex = +Basic.randWithWeight(weight);
        return hitIndex;
    }

    protected randPower(starAmount: number): IPower {
        let tempWeightValus = this.getPowerWeightsByStart(starAmount);
        let weight = _.object<Basic.NKeyValue<number>>(_.range(1, 5),tempWeightValus);
        let id = +Basic.randWithWeight(weight);
        let mul = this._bingoInfo.bingoConfig.Power.get(id).mul;
        return {
            id,
            mul
        };
    }

    private getPowerWeightsByStart(starAmount: number) {
        let ids = _.range(1, 5);
        let form = this._bingoInfo.bingoConfig.Power;
        if(![5,6,7,8].includes(starAmount)) return;

        return form.getColValueByIds(`weights_${starAmount}star`, ids);
    }


}


export default NatureProducer;





