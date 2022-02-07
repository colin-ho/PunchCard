import React from 'react';
import {
    SafeAreaView,
} from 'react-native';
import { AuthenticatedUserProvider } from './providers/AuthUserProvider';
import { extendTheme, NativeBaseProvider } from 'native-base';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './navigation/RootNavigator';
import Toast from 'react-native-toast-message';
import { StripeProvider as _StripeProvider } from '@stripe/stripe-react-native';
import type { Props as StripeProviderProps } from '@stripe/stripe-react-native/lib/typescript/src/components/StripeProvider';
const StripeProvider = _StripeProvider as React.FC<StripeProviderProps>;
import { STRIPE_KEY } from '@env';

const theme = extendTheme({
    colors: {
        redeem: {
            500: "#000",
            600: "#000",
            700: "#a8a29e",
        },
        brand: {
            100: "#ACFFDC",
            200: "#FCE86B",
            300: "#F4F6FA",
            400: "#000",
            500: "#FFF",
            700: "#a8a29e",
            800: "#FE7886",
        }
    }
})

const App = () => {


    return (
        <AuthenticatedUserProvider>
            <NativeBaseProvider theme={theme}>
                <SafeAreaProvider>
                    <StripeProvider publishableKey={STRIPE_KEY}>
                        <RootNavigator />
                        <Toast />
                    </StripeProvider>
                </SafeAreaProvider>
            </NativeBaseProvider>
        </AuthenticatedUserProvider>

    );
};


export default App;
