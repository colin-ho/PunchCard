import React, { useCallback, useContext, useState, useEffect } from 'react';
import { ScrollView, RefreshControl, TouchableOpacity, Dimensions } from 'react-native';
import { Heading, Flex, Text, FlatList, Box, Image, Button, HStack, Icon } from 'native-base';
import { ShopScreen } from './ShopScreen';
import Subscription from './Subscription';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shadow } from 'react-native-shadow-2';
import { createNativeStackNavigator, NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthenticatedUserContext, AuthenticatedUserContextInterface } from '../providers/AuthUserProvider';
import { BusinessContext, BusinessContextInterface } from '../providers/BusinessContextProvider';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import Entypo from 'react-native-vector-icons/Entypo'
import AntDesign from 'react-native-vector-icons/AntDesign'
import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { Fave } from '../utils/Fave';
import CheckoutScreen from './CheckoutScreen';
import { UserDataContext, UserDataContextInterface } from '../providers/UserDataProvider';

export type HomeStackParamList = {
    Feed: undefined;
    Shop: { business: FirebaseFirestoreTypes.DocumentData };
    Subscription: { subscription: FirebaseFirestoreTypes.DocumentData };
    Checkout: { subscription: FirebaseFirestoreTypes.DocumentData };
};

const Stack = createNativeStackNavigator<HomeStackParamList>();
const screenWidth = Dimensions.get('window').width;

export const HomeScreen = () => {

    return (
        <Stack.Navigator>
            <Stack.Screen name='Feed' component={Feed} options={{ headerShown: false }} />
            <Stack.Screen name='Shop' component={ShopScreen} options={{ headerShown: false }} />
            <Stack.Screen name='Subscription' component={Subscription} options={{ headerShown: false }} />
            <Stack.Screen name='Checkout' component={CheckoutScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
    );
};

type FeedProps = NativeStackScreenProps<HomeStackParamList, 'Feed'>;

const Feed: React.FC<FeedProps> = ({ navigation }) => {
    const { user, } = useContext<AuthenticatedUserContextInterface>(AuthenticatedUserContext)
    const {displayName, favorites, subscriptions, redeeming, subscribedTo } = useContext<UserDataContextInterface>(UserDataContext)

    const { businesses, refreshing, setRefreshing } = useContext<BusinessContextInterface>(BusinessContext)
    const [fanFavorites, setFanFavorites] = useState<FirebaseFirestoreTypes.DocumentData[]>([]);
    const [recommended, setRecommended] = useState<FirebaseFirestoreTypes.DocumentData | null>(null);

    const onRefresh = useCallback(() => {
        if (setRefreshing) setRefreshing(true);
    }, []);

    const getFanFavorites = async () => {
        const snapshot = await firestore().collection('subscriptions').where('published', '==', true).where('archived', '==', false).orderBy('redemptionCount','desc').limit(10).get()
        const all = snapshot?.docs.map((doc) => doc.data());
        let temp = [];
        for (let i = 0; i < all.length; i++) {
            temp.push(all[i]);
        }
        setFanFavorites(temp);
    }

    useEffect(() => {
        getFanFavorites();
    }, [favorites, refreshing])

    useEffect(() => {
        if (user) {
            if (subscriptions && subscriptions.length > 0
                && subscribedTo && subscribedTo.length > 0
                && favorites) {
                const recommended = subscribedTo.reduce((prev, current) => (prev.redemptionCount > current.redemptionCount) ? prev : current)
                const recommendedSub = subscriptions.filter((subscription: FirebaseFirestoreTypes.DocumentData) => subscription.id === recommended?.subscriptionId)[0];
                if (recommendedSub) {
                    recommendedSub.favorite = favorites.includes(recommendedSub.id)
                    setRecommended(recommendedSub);
                }
            }
        }

    }, [user, refreshing, favorites, subscribedTo])

    return (
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'right', 'left']}>
            <ScrollView
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing ? true : false}
                        onRefresh={onRefresh}
                    />}>
                <Flex flexDirection="column" px="20px" pt="20px">
                    <Text>{(new Date).toLocaleDateString("en-US", { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
                    <Heading fontSize="28px" fontWeight="600">{displayName ? "Welcome back " + displayName.substr(0, displayName.indexOf(' ')) : "Start punching ->"}</Heading>
                    {businesses && businesses.length > 0 ?
                        <>
                            <Heading size="md" fontWeight="500" mt="20px">{redeeming && redeeming.length > 0 ? "Active Redemptions" : "Recommended for you"}</Heading>
                            {redeeming && subscriptions && redeeming.length > 0 ?
                                redeeming.map((red) => {
                                    let sub = subscriptions.filter((sub) => red.subscriptionId === sub.id)[0]
                                    if (sub)
                                        return (
                                            <TouchableOpacity key={red.id} activeOpacity={1} onPress={() => navigation.navigate('Subscription', { subscription: sub })}>
                                                <ActiveItem redemption={red} address={businesses.filter((business) => business.uid === sub.businessId)[0].address} subscription={sub} />
                                            </TouchableOpacity>)
                                })
                                : recommended ?
                                    <TouchableOpacity activeOpacity={1} onPress={() => navigation.navigate('Subscription', { subscription: recommended })}>
                                        <RecommendedItem subscription={recommended} user={user} isFavorite={favorites ? favorites.includes(recommended.id) : false} />
                                    </TouchableOpacity>
                                    : 
                                        <TouchableOpacity activeOpacity={1} onPress={() => navigation.navigate('Shop', { business: businesses[0] })}>
                                            <TopItem business={businesses[0]} />
                                        </TouchableOpacity>
                                    }
                        </>
                        :
                         null}
                    <Heading size="md" fontWeight="500" mt="20px">Fan favorites</Heading>
                </Flex>
                {businesses&& businesses.length > 0 ?
                    <Box mt="10px">
                        <FlatList initialNumToRender={5} pb="20px" showsHorizontalScrollIndicator={false} horizontal={true} data={recommended ? fanFavorites.filter((fav) => fav.id != recommended.id) : fanFavorites} renderItem={({ item }) =>
                            <TouchableOpacity activeOpacity={1} onPress={() => navigation.navigate('Subscription', { subscription: item })}>
                                <SubscriptionItem subscription={item} user={user} isFavorite={favorites ? favorites.includes(item.id) : false} />
                            </TouchableOpacity>
                        } keyExtractor={(item) => item.id} />
                    </Box>
                    : null}
            </ScrollView>
        </SafeAreaView>
    );
}
interface ActiveItemInterface {
    subscription: FirebaseFirestoreTypes.DocumentData
    redemption: FirebaseFirestoreTypes.DocumentData
    address: string
}
const ActiveItem: React.FC<ActiveItemInterface> = ({ subscription, redemption, address }) => {

    return (
        redemption ?
            <Box alignSelf="center" mt="20px" mb="10px" borderRadius="2xl">
                <Shadow radius={20} distance={10} paintInside={false} startColor="#0000000c">
                    <Box w={screenWidth - 40} borderRadius="2xl" overflow="hidden" >
                        <Flex flexDirection="column" p="6" bg="white">
                            <HStack mb="5px" space="3">
                                <Flex borderRadius="5px" px="10px" py="5px" align="center" justify="center" bg={!redemption.confirmed ? "brand.800" : !redemption.ready ? "brand.200" : "brand.100"}>
                                    <Text fontSize="12px" color="black">{!redemption.confirmed ? "Awaiting Confirmation" : !redemption.ready ? "Preparing Order" : "Order Ready"}</Text>
                                </Flex>
                            </HStack>
                            <Text my="5px" fontWeight="600">{subscription.title + " from " + subscription.businessName}</Text>
                            <HStack mt="10px" >
                                <Text flex="1">Your Subscription:</Text>
                                <Text color="#959897">{subscription.content}</Text>
                            </HStack>
                            {redemption.orderAhead ?
                                <HStack mt="10px" >
                                    <Text flex="1">Desired pick-up time:</Text>
                                    <Text color="#959897">{redemption.collectBy.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                                </HStack>
                                :
                                <HStack mt="10px" >
                                    <Text flex="1">Estimated pick-up time:</Text>
                                    <Text color="#959897">{redemption.ready ? "Ready now" : redemption.collectBy.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                                </HStack>
                            }

                            <HStack mt="20px" pr="10px" space="3">
                                <Icon as={Entypo} name="location" />
                                <Text numberOfLines={3} mr="10px" isTruncated pr="10px">{address}</Text>
                            </HStack>
                        </Flex>
                    </Box>
                </Shadow>
            </Box>
            : null
    )
}

interface SubscriptionItemInterface {
    subscription: FirebaseFirestoreTypes.DocumentData
    user: FirebaseAuthTypes.User | null | undefined
    isFavorite: boolean
}

const SubscriptionItem: React.FC<SubscriptionItemInterface> = ({ subscription, user, isFavorite }) => {

    return (
        subscription ?
            <Box alignSelf="center" pt="10px" mx="20px" w="2xs" borderRadius="2xl">
                <Shadow radius={20} distance={10} paintInside={false} startColor="#0000000c">
                    <Box h="xs" borderRadius="2xl" overflow="hidden" >
                        <Box>
                            {user ? <Button position="absolute" right="3" top="3" borderRadius="10" zIndex="1" variant="solid" colorScheme="brand" onPress={() => Fave(subscription.id, isFavorite, user)}><Icon as={AntDesign} size="xs" color={isFavorite ? "pink.500" : "black"} name="heart" /></Button> : null}
                            <Image w="2xs" h="150px" key={subscription.id} resizeMode="cover" src={subscription.photoURL} alt="Upload an image" />
                        </Box>
                        <Flex h="xs" flexDirection="column" p="6" bg="white">
                            <HStack mb="5px" space="3" >
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
            : null
    )
}

interface RecommendedItemInterface {
    subscription: FirebaseFirestoreTypes.DocumentData
    user: FirebaseAuthTypes.User | null | undefined
    isFavorite: boolean
}

const RecommendedItem: React.FC<RecommendedItemInterface> = ({ subscription, user, isFavorite,}) => {
    return (
        subscription ?
            <Box alignSelf="center" mt="20px" borderRadius="2xl">
                <Shadow radius={20} distance={10} paintInside={false} startColor="#0000000c">
                    <Box borderRadius="2xl" overflow="hidden">
                        <Box>
                            {user ? <Button position="absolute" right="3" top="3" borderRadius="10" zIndex="1" variant="solid" colorScheme="brand" onPress={() => Fave(subscription.id, isFavorite, user)}><Icon as={AntDesign} size="xs" color={isFavorite ? "pink.500" : "black"} name="heart" /></Button> : null}
                            <Image w={screenWidth} h="150px" key={subscription.id} resizeMode="cover" src={subscription.photoURL} alt="Upload an image" />
                        </Box>
                        <Flex flexDirection="column" p="6" bg="white">
                            <HStack space="3" mb="5px">
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
            : null
    )
}

const TopItem = ({ business }: FirebaseFirestoreTypes.DocumentData) => {
    return (
        business ?
            <Box alignSelf="center" mt="20px" borderRadius="2xl" >
                <Shadow radius={20} distance={10} paintInside={false} startColor="#0000000c">
                    <Box borderRadius="2xl" overflow="hidden"  >
                        <Box>
                            <Image w={screenWidth} h="150px" key={business.uid} resizeMode="cover" src={business.photoURL} alt="Upload an image" />
                        </Box>
                        <Flex flexDirection="column" align="flex-start" p="6" bg="white">
                            <HStack space="3" mb="5px">
                                {business.totalCustomers > 0 ?
                                    <Flex borderRadius="5px" px="10px" py="5px" align="center" justify="center" bg="brand.100">
                                        <Text fontSize="12px" color="black">Popular</Text>
                                    </Flex> : null}
                                <Flex borderRadius="5px" px="10px" py="5px" align="center" justify="center" bg="brand.300">
                                    <Text fontSize="12px" color="black">{business.businessType.charAt(0).toUpperCase() + business.businessType.slice(1)}</Text>
                                </Flex>
                                {business.tags.map((tag: string) => {
                                    return (
                                        <Flex borderRadius="5px" px="10px" py="5px" align="center" justify="center" bg="brand.300" key={tag}>
                                            <Text fontSize="12px" color="black">{tag.charAt(0).toUpperCase() + tag.slice(1)}</Text>
                                        </Flex>
                                    )
                                })}
                            </HStack>
                            <Heading fontWeight="600" mt="10px" size="sm">{business.businessName}</Heading>
                            <Text fontSize="sm">{business.description}</Text>
                        </Flex>
                    </Box>
                </Shadow>
            </Box>
            : null
    )
}

