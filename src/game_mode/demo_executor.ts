
import { BaseBingoExecutor } from "./base_bingo_executor";
import { IBingoMode } from "../info_producer/factory";

export class DemoExecutor extends BaseBingoExecutor {

    //判斷天花板是否合法
    protected async validateResult(): Promise<boolean>{ return this.isTotalBetRateValidate; } 

    protected get checkMode(): boolean {
        return (this._bingoStruct.mode & IBingoMode.Demo) == IBingoMode.Demo;
    }

    protected illegalCall(): void { 
        this.disconnectPlayerAsPoolError();
    }


    public switchToPoolMode() {
        let id = 101 + this.round;
        this.insertPoolInfo(IBingoMode.Demo, id);
    }


}