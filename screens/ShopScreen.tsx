import AntDesign from 'react-native-vector-icons/AntDesign';
import Ionicons from 'react-native-vector-icons/Ionicons'
import { Box, Button, FlatList, Flex, Heading, HStack, Icon, Image, Text, VStack } from 'native-base';
import React, { useState, useEffect, useContext } from 'react'
import { Dimensions } from 'react-native';
import { ScrollView, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shadow } from 'react-native-shadow-2';
import { AuthenticatedUserContext, AuthenticatedUserContextInterface } from '../providers/AuthUserProvider';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { Fave } from '../utils/Fave';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BrowseStackParamList } from './BrowseScreen';
import { CompositeScreenProps } from '@react-navigation/native';
import { HomeStackParamList } from './HomeScreen';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { UserDataContext, UserDataContextInterface } from '../providers/UserDataProvider';


type ShopProps = CompositeScreenProps<
    NativeStackScreenProps<BrowseStackParamList, 'Shop'>,
    NativeStackScreenProps<HomeStackParamList, 'Shop'>
>

const screenWidth = Dimensions.get('window').width;

export const ShopScreen: React.FC<ShopProps> = ({ navigation, route }) => {
    const [subscriptions, setSubscriptions] = useState<FirebaseFirestoreTypes.DocumentData[]>([]);
    const { user } = useContext<AuthenticatedUserContextInterface>(AuthenticatedUserContext)
    const { favorites } = useContext<UserDataContextInterface>(UserDataContext)

    const business = route.params.business
    const getSubs = async () => {
        const query = firestore()
            .collection('subscriptions')
            .where('businessId', '==', business.uid)
            .where('published', '==', true)
            .where('archived', '==', false)
            .orderBy('updatedAt', 'desc')

        const newSubscriptions = (await query.get()).docs.map((doc) => doc.data());
        let temp = [];
        for (let i = 0; i < newSubscriptions.length; i++) {
            temp.push(newSubscriptions[i]);
        }
        setSubscriptions(temp);
    }

    useEffect(() => {
        getSubs();
    }, [])

    return (
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
            <ScrollView>
                <HStack alignItems="center" pl="10px" pr="30px" pt="20px">
                    <Button variant="unstyled" onPress={() => navigation.goBack()} leftIcon={<Icon as={Ionicons} name="chevron-back" size="sm" color="black" />}></Button>
                    <Heading fontWeight="600" flex="1" size="md">{business.businessName}</Heading>
                </HStack>
                <Box alignSelf="center" mt="10px" bg="white" borderRadius="2xl">
                    <Shadow radius={15} distance={10} paintInside={false} startColor="#0000000c">
                        <VStack space="5" w={screenWidth - 40} p="6">
                            <HStack space="3">
                                <Flex borderRadius="5px" px="10px" py="5px" align="center" justify="center" bg="brand.300" >
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
                            <Heading fontWeight="500" size="sm">{business.description}</Heading>

                            <Text color="#959897">Location: {business.address}</Text>
                        </VStack>
                    </Shadow>
                </Box>

                {subscriptions ?
                    <Box px="20px" mb="10px" mt="20px">
                        <Heading fontWeight="500" size="md" mt="10px" mb="10px" pl="10px">Subscriptions for you</Heading>
                        {subscriptions.map((item: FirebaseFirestoreTypes.DocumentData) => {
                            return (
                                <TouchableOpacity key={item.id} activeOpacity={1} onPress={() => navigation.navigate('Subscription', { subscription: item })}>
                                    <SubscriptionItem user={user} subscription={item} isFavorite={favorites ? favorites.includes(item.id) : false} />
                                </TouchableOpacity>
                            )
                        })}
                    </Box>
                    : null}
            </ScrollView>
        </SafeAreaView>
    )
}

interface SubscriptionItemProps {
    subscription: FirebaseFirestoreTypes.DocumentData
    user: FirebaseAuthTypes.User | null | undefined
    isFavorite: boolean
}

function SubscriptionItem({ subscription, user, isFavorite }: SubscriptionItemProps) {

    return (

        <Box alignSelf="center" mt="10px" mb="60px" h="2xs" borderRadius="2xl">
            <Shadow radius={20} distance={10} paintInside={false} startColor="#0000000c">
                <Box borderRadius="2xl" overflow="hidden" >
                    <Box>
                        {user ? <Button position="absolute" right="3" top="3" borderRadius="10" zIndex="1" variant="solid" colorScheme="brand" onPress={() => Fave(subscription.id, isFavorite, user)}><Icon as={AntDesign} size="xs" color={isFavorite ? "pink.500" : "black"} name="heart" /></Button> : null}
                        <Image w={screenWidth} h="150px" key={subscription.id} resizeMode="cover" src={subscription.photoURL} alt="Upload an image" />
                    </Box>
                    <Flex bg="white" flexDirection="column" p="6">
                        <HStack space="3" mb="5px">
                            {subscription.redemptionCount > 2 ?
                                <Flex borderRadius="5px" px="10px" py="5px" align="center" justify="center" bg="brand.100">
                                    <Text fontSize="12px" color="black">Popular</Text>
                                </Flex> : null}
                            <Flex borderRadius="5px" px="10px" py="5px" align="center" justify="center" bg="brand.300">
                                <Text fontSize="12px" color="black">{subscription.businessType.charAt(0).toUpperCase() + subscription.businessType.slice(1)}</Text>
                            </Flex>
                        </HStack>
                        <Text fontWeight="600" my="5px">{subscription.title + " from " + subscription.businessName}</Text>
                        <Text>{subscription.dayConstrain ? "1" : subscription.limit ? subscription.limit : "10x "} {subscription.content ? subscription.content : "Hot Cappucino"} {subscription.dayConstrain ? "per Day " : ""}for ${subscription.price ? (Math.round(subscription.price * 100) / 100).toFixed(2) : 19.99}/{subscription.interval ? subscription.interval.charAt(0).toUpperCase() + subscription.interval.slice(1) : "Week"}</Text>
                    </Flex>
                </Box>
            </Shadow>
        </Box>
    )
}