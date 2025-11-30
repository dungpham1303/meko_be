import BaseService from "../../base_service/base_service.js";

class WalletLogsRepository extends BaseService{
     constructor(){
        super('wallet_logs');
    }
    
}

export default new WalletLogsRepository();