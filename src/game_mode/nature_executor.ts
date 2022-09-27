
import { IBingoMode } from "../info_producer/factory";
import { BaseBingoExecutor } from "./base_bingo_executor";
import { SpecialExecutor } from "./special_executor";


export class NatureExecutor extends BaseBingoExecutor {

    protected get checkMode(): boolean {
        return (this._bingoStruct.mode & IBingoMode.Nature) == IBingoMode.Nature;
    }

    protected async validateResult(): Promise<boolean> {
        if (this._bingoStruct.mode == IBingoMode.Demo && this.isTotalBetRateValidate) { 
            return false; //Demo模式檢查倍率
        }  
        let result = await this.isWaterLimitValidate();
        return result;
    } 

    private async isWaterLimitValidate(): Promise<boolean>  { 
        return await PayLimiter.Client.Slot.bingoChecker(this._bingoStruct, this.totalWin, this.round, this.betInfo.totalBet);
    }
    
    protected async illegalCall() { 
        console.log(`自然模式碰到天花板 - > 進入指定模式`);
        this.insertPoolInfo(IBingoMode.Low, 202);
        this._bingoStruct.hasDrop = true;
        let exe: SpecialExecutor = new SpecialExecutor(this._bingoStruct);
        console.log(`row:${this._bingoStruct.poolRowId} ,poolID${this._bingoStruct.poolId}, poolID${this._bingoStruct}`);
        await exe.entreBingo();
    }

  

}