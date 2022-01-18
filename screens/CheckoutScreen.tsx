import StripeCheckout from 'react-native-stripe-checkout-webview';
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context';

export const CheckoutScreen = ({ navigation,route }:any) => {
    const STRIPE_PUBLIC_KEY = route.params.STRIPE_PUBLIC_KEY
    const CHECKOUT_SESSION_ID = route.params.CHECKOUT_SESSION_ID


    return (
      <SafeAreaView style={{flex:1}} backgroundColor="white" edges={['top','right','left']}>
        <StripeCheckout
          stripePublicKey={STRIPE_PUBLIC_KEY}
          checkoutSessionInput={{
            sessionId: CHECKOUT_SESSION_ID,
          }}
          onSuccess={({ checkoutSessionId }:any) => {
            console.log(`Stripe checkout session succeeded. session id: ${checkoutSessionId}.`);
            navigation.goBack()
          }}
          onCancel={() => {
            console.log(`Stripe checkout session cancelled.`);
            navigation.goBack()
          }}
          options={{htmlContentLoading:"<h1 id='sc-loading'></h1>"}}
        />
      </SafeAreaView>)
    };