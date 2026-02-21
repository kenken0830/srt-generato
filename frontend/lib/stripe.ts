import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

export const PLANS = {
  free: {
    name: '無料プラン',
    price: 0,
    minutes: 5,
    features: ['月5分まで変換', 'base モデル', 'SRT ダウンロード'],
  },
  pro: {
    name: 'Pro プラン',
    price: 980,
    minutes: null, // unlimited
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID!,
    features: ['無制限変換', '全モデル選択可', 'SRT ダウンロード', '優先処理'],
  },
}
