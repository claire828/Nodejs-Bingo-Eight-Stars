import { BaseBingoExecutor } from "./base_bingo_executor";
import { IBingoMode } from "../info_producer/factory";

export class SpecialExecutor extends BaseBingoExecutor {

    protected get checkMode(): boolean {
        if ( (this._bingoStruct.mode& IBingoMode.Hight) == IBingoMode.Hight ||
            (this._bingoStruct.mode & IBingoMode.Low) == IBingoMode.Low ) { 
            return true;
        }
        return false;
    }
    //判斷天花板是否合法
    protected async validateResult(): Promise<boolean>{
        return this.isTotalBetRateValidate;
    } 
    
    //不合法要做的錯誤處理
    protected async illegalCall() { 
        this.disconnectPlayerAsPoolError();
    }


    public switchToHighLowMode(mode: IBingoMode) {
        if (mode == IBingoMode.Demo || mode == IBingoMode.Nature) return;
        this.insertPoolInfo(mode, 200 + mode);
    }

}