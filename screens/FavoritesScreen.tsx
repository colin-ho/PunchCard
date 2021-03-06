import React, { useContext, useState, useEffect } from 'react';
import { Dimensions, ScrollView } from 'react-native';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import Subscription from './Subscription';
import { Box, Flex, Heading, Image, Text, VStack, Button, Icon, HStack } from 'native-base';
import { SafeAreaView } from 'react-native-safe-area-context';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { Shadow } from 'react-native-shadow-2';
import { TouchableOpacity } from 'react-native';
import { AuthenticatedUserContext, AuthenticatedUserContextInterface } from '../providers/AuthUserProvider';
import { createNativeStackNavigator, NativeStackScreenProps } from '@react-navigation/native-stack';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { Fave } from '../utils/Fave';
import CheckoutScreen from './CheckoutScreen';
import { UserDataContext, UserDataContextInterface } from '../providers/UserDataProvider';

export type FavoritesStackParamList = {
    Feed: undefined;
    Subscription: { subscription: FirebaseFirestoreTypes.DocumentData };
    Checkout: { subscription: FirebaseFirestoreTypes.DocumentData };
};

const Stack = createNativeStackNavigator<FavoritesStackParamList>();
const screenWidth = Dimensions.get('window').width;
export const FavoritesScreen = () => {

    return (
        <Stack.Navigator>
            <Stack.Screen name='Feed' component={Feed} options={{ headerShown: false }} />
            <Stack.Screen name='Subscription' component={Subscription} options={{ headerShown: false }} />
            <Stack.Screen name='Checkout' component={CheckoutScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
    );
};

type FeedProps = NativeStackScreenProps<FavoritesStackParamList, 'Feed'>;

const Feed: React.FC<FeedProps> = ({ navigation }) => {
    const { user } = useContext<AuthenticatedUserContextInterface>(AuthenticatedUserContext)
    const { favorites,subscribedTo } = useContext<UserDataContextInterface>(UserDataContext)
    const [filtered, setFiltered] = useState<FirebaseFirestoreTypes.DocumentData[]>([]);
    useEffect(() => {
        let favoritesListener: () => void;
        if (user) {
            if (favorites && favorites.length > 0) {
                let query = firestore().collection('subscriptions').where('id', 'in', favorites)
                favoritesListener = query.onSnapshot((snapshot) => {
                    const data = snapshot?.docs.map((doc) => doc.data());
                    setFiltered(data);
                }, err => console.log("favoritesListener: ", err))
            } else {
                setFiltered([]);
            }
        }
        return () => {
            favoritesListener?.();
        }
    }, [favorites])

    return (

        <SafeAreaView style={{ flex: 1 }} edges={['top', 'right', 'left']}>
            {user ?
                <ScrollView>
                    <VStack space={6} p="20px">
                        <Box>
                            <Heading fontWeight="600" size="xl">Favorites</Heading>
                            <Text>Your saved subscriptions</Text>
                        </Box>
                        {filtered.length > 0 ? filtered.map((subscription) => {
                            return (
                                <TouchableOpacity key={subscription.id} activeOpacity={1} onPress={() => navigation.navigate('Subscription', { subscription })}>
                                    <SubscriptionItem subscription={subscription} user={user} isMaxed={subscribedTo?.find(item => item.subscriptionId === subscription.id)?.redemptionCount == subscription.limit}
                                        isExpired={subscribedTo?.find(item => item.subscriptionId === subscription.id)?.status === 'incomplete'} />
                                </TouchableOpacity>
                            )
                        }) : <Text>Favorite your subscriptions to get started!</Text>}
                    </VStack>
                </ScrollView> : null
            }
        </SafeAreaView>
    );
}

interface SubscriptionItemProps {
    subscription: FirebaseFirestoreTypes.DocumentData
    user: FirebaseAuthTypes.User | null | undefined
    isMaxed: boolean
    isExpired:boolean
}

const SubscriptionItem: React.FC<SubscriptionItemProps> = ({ subscription, user,isMaxed,isExpired }) => {

    return (

        <Box alignSelf="center" borderRadius="2xl">
            <Shadow radius={20} distance={10} paintInside={false} startColor="#0000000c">
                <Box borderRadius="2xl" overflow="hidden" >
                    <Box>
                        <Button position="absolute" right="3" top="3" borderRadius="10" zIndex="1" variant="solid" colorScheme="brand" onPress={() => Fave(subscription.id, true, user)}><Icon as={AntDesign} size="xs" color="pink.500" name="heart" /></Button>
                        <Image w={screenWidth} h="150px" key={subscription.id} resizeMode="cover" src={subscription.photoURL} alt="Upload an image" />
                    </Box>
                    <Flex flexDirection="column" p="6" bg="white">
                        <HStack space="3" mb="5px">
                            {isExpired ?
                                <Flex borderRadius="5px" px="10px" py="5px" align="center" justify="center" bg="brand.800">
                                    <Text fontSize="12px" color="black">Expired</Text>
                                </Flex> : null}
                            {isMaxed ?
                                <Flex borderRadius="5px" px="10px" py="5px" align="center" justify="center" bg="brand.800">
                                    <Text fontSize="12px" color="black">Limit Reached</Text>
                                </Flex> : null}
                            {subscription.redemptionCount > 2 ?
                                <Flex borderRadius="5px" px="10px" py="5px" align="center" justify="center" bg="brand.100">
                                    <Text fontSize="12px" color="black">Popular</Text>
                                </Flex> : null}
                            <Flex borderRadius="5px" px="10px" py="5px" align="center" justify="center" bg="brand.300">
                                <Text fontSize="12px" color="black">{subscription.businessType.charAt(0).toUpperCase() + subscription.businessType.slice(1)}</Text>
                            </Flex>
                        </HStack>
                        <Text my="5px" fontWeight="600">{subscription.title + " from " + subscription.businessName}</Text>
                        <Text>{subscription.dayConstrain ? "1" : subscription.limit ? subscription.limit : "10x "} {subscription.content} {subscription.dayConstrain ? "per Day " : ""}for ${subscription.price ? (Math.round(subscription.price * 100) / 100).toFixed(2) : 19.99}/{subscription.interval ? subscription.interval.charAt(0).toUpperCase() + subscription.interval.slice(1) : "Week"}</Text>
                    </Flex>
                </Box>
            </Shadow>
        </Box>
    )
}