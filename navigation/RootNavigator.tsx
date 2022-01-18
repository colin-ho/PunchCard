import React, { useContext, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { AuthStack } from './AuthStack';
import { AppStack } from './AppStack';
import { AuthenticatedUserContext } from '../providers/AuthUserProvider';
import Toast from 'react-native-toast-message';

export const RootNavigator = () => {
  const { user, setUser, setDisplayName,needsLogin} : any = useContext(AuthenticatedUserContext);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged((user)=> setUser(user));
    return unsubscribe;
}, []);

  useEffect(() => {

    let unsubscribe;

    if (user) {
      const ref = firestore().collection('users').doc(user.uid);
      unsubscribe = ref.onSnapshot((doc) => {
        if(doc.data()?.userType==='business'){
          auth().signOut().catch(error => console.log('Error logging out: ', error));
          Toast.show({
            type: 'error',
            text1: 'Please sign in with a customer account',
          });
        }
        else{
          setDisplayName(doc.data()?.displayName);
        }
      });
    } else {
      setDisplayName(null);
    }

    // unsubscribe auth listener on unmount
    return unsubscribe;
  }, [user]);

  return (
    <NavigationContainer>
      {!needsLogin ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
};
