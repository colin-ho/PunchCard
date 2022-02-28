import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../screens/HomeScreen';
import { BrowseScreen } from '../screens/BrowseScreen';
import { SubscriptionsScreen } from '../screens/SubscriptionsScreen';
import { AccountScreen } from '../screens/AccountScreen';
import AntDesign from 'react-native-vector-icons/AntDesign'
import { FavoritesScreen } from '../screens/FavoritesScreen';
import { BusinessContextProvider } from '../providers/BusinessContextProvider';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Entypo from 'react-native-vector-icons/Entypo';
import { UserDataProvider } from '../providers/UserDataProvider';

const Tab = createBottomTabNavigator();

export const AppStack = () => {

    return (
        <BusinessContextProvider>
            <UserDataProvider>
                <Tab.Navigator screenOptions={{
                    tabBarActiveTintColor: 'black',
                    tabBarStyle: { height: 90 },
                }}>
                    <Tab.Screen name="Home" component={HomeScreen} options={{
                        headerShown: false, tabBarLabel: 'Home',
                        tabBarIcon: ({ color, size }) => (
                            <Entypo name="home" size={size} color={color} />
                        )
                    }} />
                    <Tab.Screen name="Browse" component={BrowseScreen} options={{
                        headerShown: false, tabBarLabel: 'Browse',
                        tabBarIcon: ({ color, size }) => (
                            <Entypo name="shopping-cart" size={size} color={color} />
                        )
                    }} />
                    <Tab.Screen name="Favorites" component={FavoritesScreen} options={{
                        headerShown: false, tabBarLabel: 'Favorites',
                        tabBarIcon: ({ color, size }) => (
                            <AntDesign name="heart" size={size} color={color} />
                        )
                    }} />
                    <Tab.Screen name="Subscriptions" component={SubscriptionsScreen} options={{
                        headerShown: false, tabBarLabel: 'Subscriptions',
                        tabBarIcon: ({ color, size }) => (
                            <AntDesign name="tag" size={size} color={color} />
                        )
                    }} />
                    <Tab.Screen name="Account" component={AccountScreen} options={{
                        headerShown: false, tabBarLabel: 'Account',
                        tabBarIcon: ({ color, size }) => (
                            <MaterialCommunityIcons name="account-outline" size={size} color={color} />
                        )
                    }} />
                </Tab.Navigator>
            </UserDataProvider>
        </BusinessContextProvider>
    );
};
