import {
    SmartContract,
    DefaultSmartContractController, 
} from '@elrondnetwork/erdjs';

export interface IContractInteractor {
    contract: SmartContract;
    controller: DefaultSmartContractController;
}

export interface IFlipPack {
    token_id: string;
    ticker: string;
	fee: number;
	amounts: number[],
}

export interface IFlipTx {
    token_id: string;
    ticker: string;
	amount: number;
	user_address: string;
    timestamp: Date;
    success: boolean;
}