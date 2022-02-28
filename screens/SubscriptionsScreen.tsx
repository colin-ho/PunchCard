import React, { useContext, useState, useEffect } from 'react';
import { Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import Subscription from './Subscription';
import { Box, Flex, Heading, Image, Text, VStack, Button, HStack, Icon } from 'native-base';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shadow } from 'react-native-shadow-2';
import AntDesign from 'react-native-vector-icons/AntDesign'
import { createNativeStackNavigator, NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthenticatedUserContext, AuthenticatedUserContextInterface } from '../providers/AuthUserProvider';
import { BusinessContext, BusinessContextInterface } from '../providers/BusinessContextProvider';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { Fave } from '../utils/Fave';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import CheckoutScreen from './CheckoutScreen';
import { UserDataContext, UserDataContextInterface } from '../providers/UserDataProvider';

export type SubscriptionsStackParamList = {
    Feed: undefined;
    Subscription: { subscription: FirebaseFirestoreTypes.DocumentData };
    Checkout: { subscription: FirebaseFirestoreTypes.DocumentData };
};
const Stack = createNativeStackNavigator<SubscriptionsStackParamList>();
const screenWidth = Dimensions.get('window').width;
export const SubscriptionsScreen = () => {

    return (
        <Stack.Navigator>
            <Stack.Screen name='Feed' component={Feed} options={{ headerShown: false }} />
            <Stack.Screen name='Subscription' component={Subscription} options={{ headerShown: false }} />
            <Stack.Screen name='Checkout' component={CheckoutScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
    );
};

type FeedProps = NativeStackScreenProps<SubscriptionsStackParamList, 'Feed'>;

const Feed = ({ navigation }: FeedProps) => {
    const { user, } = useContext<AuthenticatedUserContextInterface>(AuthenticatedUserContext)
    const { subscriptions, favorites, subscribedTo } = useContext<UserDataContextInterface>(UserDataContext)

    const { businesses } = useContext<BusinessContextInterface>(BusinessContext)
    const [firstSub, setFirstSub] = useState<FirebaseFirestoreTypes.DocumentData | null>(null);
    const [filtered, setFiltered] = useState<FirebaseFirestoreTypes.DocumentData[]>([]);

    useEffect(() => {
        let temp = [];
        if (subscriptions && favorites) {
            for (let i = 0; i < subscriptions.length; i++) {
                temp.push(subscriptions[i]);
            }
            setFiltered(temp);
        }
    }, [favorites, subscriptions])

    useEffect(() => {
        // Moved inside "useEffect" to avoid re-creating on render
        if (businesses) {
            let temp = null;
            for (let i = 0; i < businesses.length; i++) {
                if (temp != null) break;
                for (let j = 0; j < filtered.length; j++) {
                    if (businesses[i].uid === filtered[j].businessId) {
                        temp = filtered[j];
                        break;
                    }
                }
            }
            setFirstSub(temp);
        }

    }, [businesses, filtered]);
    return (

        <SafeAreaView style={{ flex: 1 }} edges={['top', 'right', 'left']}>
            {user ?
                <ScrollView>
                    <VStack space={6} p="20px">
                        <Box>
                            <Heading fontWeight="600" size="xl">Subscriptions</Heading>
                            <Text>Your active subscriptions </Text>
                        </Box>
                        {firstSub ? <Heading fontWeight="500" size="md">Based on your location</Heading> : null}
                        {firstSub ?
                            <TouchableOpacity activeOpacity={1} onPress={() => navigation.navigate('Subscription', { subscription: firstSub })}>
                                <SubscriptionItem subscription={firstSub} user={user} isFavorite={favorites ? favorites.includes(firstSub.id) : false}
                                    isMaxed={subscribedTo?.find(item => item.subscriptionId === firstSub.id)?.redemptionCount == firstSub.limit}
                                    isExpired={subscribedTo?.find(item => item.subscriptionId === firstSub.id)?.status === 'incomplete'} />
                            </TouchableOpacity>
                            : null}
                        {firstSub && filtered.length > 1 ? <Heading fontWeight="500" size="md">All subscriptions</Heading> : null}
                        {filtered.length > 0 ? firstSub ? filtered.filter((subscription: FirebaseFirestoreTypes.DocumentData) => subscription.id != firstSub.id).map((subscription: FirebaseFirestoreTypes.DocumentData) => {
                            return (
                                <TouchableOpacity key={subscription.id} activeOpacity={1} onPress={() => navigation.navigate('Subscription', { subscription })}>
                                    <SubscriptionItem subscription={subscription} user={user} isFavorite={favorites ? favorites.includes(subscription.id) : false}
                                        isMaxed={subscribedTo?.find(item => item.subscriptionId === subscription.id)?.redemptionCount == subscription.limit}
                                        isExpired={subscribedTo?.find(item => item.subscriptionId === subscription.id)?.status === 'incomplete'} />
                                </TouchableOpacity>
                            )
                        }) : filtered.map((subscription: FirebaseFirestoreTypes.DocumentData) => {
                            return (
                                <TouchableOpacity key={subscription.id} activeOpacity={1} onPress={() => navigation.navigate('Subscription', { subscription })}>
                                    <SubscriptionItem subscription={subscription} user={user} isFavorite={favorites ? favorites.includes(subscription.id) : false}
                                        isMaxed={subscribedTo?.find(item => item.subscriptionId === subscription.id)?.redemptionCount == subscription.limit}
                                        isExpired={subscribedTo?.find(item => item.subscriptionId === subscription.id)?.status === 'incomplete'} />
                                </TouchableOpacity>
                            )
                        }) : <Text>Buy subscriptions to get started!</Text>}
                    </VStack>
                </ScrollView> : null
            }
        </SafeAreaView>
    );
}

interface SubscriptionItemProps {
    subscription: FirebaseFirestoreTypes.DocumentData
    user: FirebaseAuthTypes.User | null | undefined
    isFavorite: boolean
    isMaxed: boolean
    isExpired:boolean
}

function SubscriptionItem({ subscription, user, isFavorite, isMaxed,isExpired }: SubscriptionItemProps) {

    return (

        <Box alignSelf="center" borderRadius="2xl">
            <Shadow radius={20} distance={10} paintInside={false} startColor="#0000000c">
                <Box borderRadius="2xl" overflow="hidden">
                    <Box>
                        <Button position="absolute" right="3" top="3" borderRadius="10" zIndex="1" variant="solid" colorScheme="brand" onPress={() => Fave(subscription.id, isFavorite, user)}><Icon as={AntDesign} size="xs" color={isFavorite ? "pink.500" : "black"} name="heart" /></Button>
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
                        <Text>{subscription.dayConstrain ? "1" : subscription.limit ? subscription.limit : "10x "} {subscription.content ? subscription.content : "Hot Cappucino"} {subscription.dayConstrain ? "per Day " : ""}for ${subscription.price ? (Math.round(subscription.price * 100) / 100).toFixed(2) : 19.99}/{subscription.interval ? subscription.interval.charAt(0).toUpperCase() + subscription.interval.slice(1) : "Week"}</Text>
                    </Flex>
                </Box>
            </Shadow>
        </Box>
    )
}

