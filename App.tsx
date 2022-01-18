import React from 'react';
import {
  SafeAreaView,
} from 'react-native';
import { AuthenticatedUserProvider } from './providers/AuthUserProvider';
import { extendTheme, NativeBaseProvider} from 'native-base';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './navigation/RootNavigator';
import Toast from 'react-native-toast-message';

const theme = extendTheme({
  colors: {
    redeem:{
      500:"#000",
      600:"#000",
      700:"#a8a29e",
    },
    brand:{
      100:"#ACFFDC",
      200:"#FCE86B",
      300:"#F4F6FA",
      400:"#000",
      500:"#FFF",
      700:"#a8a29e",
    }
  }
})

const App = () => {


  return (
    <AuthenticatedUserProvider>
      <NativeBaseProvider theme={theme}>
        <SafeAreaProvider>
          <RootNavigator />
          <Toast />
          </SafeAreaProvider>
      </NativeBaseProvider>
    </AuthenticatedUserProvider>
    
  );
};


export default App;
