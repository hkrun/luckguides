import 'server-only'
import Stripe from 'stripe';


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!,{stripeAccount: process.env.STRIPE_ACCOUNT_ID});

export async function getProductInfoFromInvoice(invoiceId: string):Promise<IProduct | undefined> {
  console.log('=== 从发票获取产品信息 ===');
  console.log('发票ID:', invoiceId);

  const invoice = await stripe.invoices.retrieve(invoiceId, {
    expand: ['lines.data.price.product', 'subscription'],
  });
  
  console.log('发票信息:', JSON.stringify(invoice, null, 2));
  
  const lineItem = invoice.lines.data[0];
  if (!lineItem || !lineItem.price || typeof lineItem.price === 'string' || !lineItem.price.product) {
    console.log('发票中未找到产品信息');
    return undefined
  }
  
  const price = lineItem.price;
  const product = lineItem.price.product;
  let productInfo;
  
  if (typeof product === 'string') {
    productInfo = await stripe.products.retrieve(product);
  } else {
    productInfo = product as Stripe.Product;
  }
  
  if(productInfo){
    // 获取订阅ID（如果存在）
    let subscriptionId = '';
    if (invoice.subscription) {
      subscriptionId = typeof invoice.subscription === 'string' 
        ? invoice.subscription 
        : invoice.subscription.id;
    }
    
    const result = { 
      priceId: price.id, // 使用实际的价格ID，而不是产品的默认价格
      priceName: productInfo.name,
      userId: undefined, // 这里不设置userId，因为会在webhook中处理
      subscriptionId: subscriptionId || undefined
    };
    
    console.log('从发票解析的产品信息:', JSON.stringify(result, null, 2));
    return result;
  }
  
  console.log('发票中未找到有效的产品信息');
  return undefined;
}

export async function getProductInfoFromPrice(priceId: string, customerId?: string):Promise<IProduct | undefined> {
  console.log('=== 从价格ID获取产品信息 ===');
  console.log('价格ID:', priceId);
  console.log('客户ID:', customerId);
  
  const price = await stripe.prices.retrieve(priceId,{
    expand: ['product']
  });
  
  console.log('价格信息:', JSON.stringify(price, null, 2));

  if(price.product && typeof price.product !== 'string'){
    const product = price.product as Stripe.Product;
    
    let subscriptionId = undefined;
    
    // 如果是订阅价格且提供了客户ID，尝试获取相关的订阅ID
    if (price.type === 'recurring' && customerId) {
      console.log('检测到订阅价格，尝试获取订阅ID');
      try {
        const subscriptions = await stripe.subscriptions.list({
          customer: customerId,
          price: priceId,
          limit: 1,
          status: 'active'
        });
        
        if (subscriptions.data.length > 0) {
          subscriptionId = subscriptions.data[0].id;
          console.log('找到关联的订阅ID:', subscriptionId);
        }
      } catch (error) {
        console.error('获取订阅ID失败:', error);
      }
    }
    
    const result = {
      priceId: price.id,
      priceName: product.name,
      subscriptionId: subscriptionId
    };
    
    console.log('从价格解析的产品信息:', JSON.stringify(result, null, 2));
    return result;
  }
  
  console.log('价格中未找到有效的产品信息');
  return undefined;
}

export async function findDiscountById(couponId: string):Promise<ICoupon | undefined> {
  if(!couponId){
    return undefined;
  }
  const coupon = await stripe.coupons.retrieve(couponId);
  if(coupon){ 
    return {
      id: coupon.id,
      name: coupon.name,
      percent_off: coupon.percent_off,
      amount_off: coupon.amount_off,
      currency: coupon.currency,
      valid: coupon.valid,
    };
  }
  return undefined;
}

export async function cancelSubscription(subscriptionId: string): Promise<boolean> {
    try {
        const canceledSubscription = await stripe.subscriptions.cancel(subscriptionId);
        return canceledSubscription.status === 'canceled';
    } catch (error: any) {
        // 🎯 处理订阅不存在的情况
        if (error.code === 'resource_missing') {
            console.warn(`Stripe订阅不存在: ${subscriptionId}，可能已被删除或过期转换`);
            // 虽然Stripe中不存在，但我们仍然认为"取消成功"，以便更新本地数据库状态
            return true;
        }
        
        // 其他错误重新抛出
        console.error('取消Stripe订阅失败:', error);
        throw error;
    }
}

export interface IProduct{
  priceId:string;
  priceName:string;
  userId?:string;
  subscriptionId?:string;
}

export interface ICoupon{
  id:string;
  name:string|null;
  percent_off?:number|null;
  amount_off?:number|null;
  currency?:string|null;
  valid:boolean;
}