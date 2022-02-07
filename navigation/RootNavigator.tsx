import React, { useContext, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import { AuthStack } from './AuthStack';
import { AppStack } from './AppStack';
import { AuthenticatedUserContext, AuthenticatedUserContextInterface } from '../providers/AuthUserProvider';

export const RootNavigator = () => {
    const { setUser, needsLogin } = useContext<AuthenticatedUserContextInterface>(AuthenticatedUserContext);

    useEffect(() => {
        const unsubscribe = auth().onAuthStateChanged((user) => setUser && setUser(user));
        return unsubscribe;
    }, []);

    return (
        <NavigationContainer>
            {!needsLogin ? <AppStack /> : <AuthStack />}
        </NavigationContainer>
    );
};
