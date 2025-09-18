export interface IUserCredit {
    user_id: string;
    credit_amount: number;
    credit_type: string;
    credit_transaction_type: string;
    credit_desc: string;
    order_number?: string;
    order_price: number;
    product_name?: string;
    subscriptionId?: string;
    order_date?: string;
}

// 为了兼容性保留的接口（将会被弃用）
export interface IUserCreditLegacy {
    user_id: string;
    credit_amount: number;
    credit_type: string;
    credit_transaction_type: string;
    credit_desc: string;
    order_number?: string;
    order_price: number;
    subscriptionId?: string;
    order_date?: string;
}