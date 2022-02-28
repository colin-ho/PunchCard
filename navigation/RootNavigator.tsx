import React, { useContext, useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import { AuthStack } from './AuthStack';
import { AppStack } from './AppStack';
import { AuthenticatedUserContext, AuthenticatedUserContextInterface } from '../providers/AuthUserProvider';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

export const RootNavigator = () => {
    const { setUser } = useContext<AuthenticatedUserContextInterface>(AuthenticatedUserContext);
    const [isLoggedIn, setIsLoggedIn] = useState(false)

    useEffect(() => {
        const unsubscribe = auth().onAuthStateChanged((user) => {
            if (user) {
                setUser && setUser(user);
                setIsLoggedIn(true)
            } else {
                setIsLoggedIn(false)
            }
        });
        return unsubscribe;
    }, []);

    const Stack = createNativeStackNavigator();
    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {isLoggedIn ?
                    <Stack.Screen name="AppStack" component={AppStack} />
                    :
                    <Stack.Screen name='AuthStack' component={AuthStack} />}
            </Stack.Navigator>
        </NavigationContainer>
    );
};
