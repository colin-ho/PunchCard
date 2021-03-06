import React, { useContext, useRef, useState,  } from 'react';
import { createNativeStackNavigator, NativeStackScreenProps } from '@react-navigation/native-stack';
import {ShopScreen} from './ShopScreen';
import Subscription from './Subscription';
import { Box, FlatList, Flex, Heading, HStack, Icon, Image, Input, Modal, Text, VStack } from 'native-base';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, TouchableOpacity } from 'react-native';
import { Dimensions } from 'react-native';
import { Shadow } from 'react-native-shadow-2';
import { ResultsScreen } from './ResultsScreen';
import { BusinessContext, BusinessContextInterface } from '../providers/BusinessContextProvider';
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import CheckoutScreen from './CheckoutScreen';

const screenWidth = Dimensions.get('window').width; 

export type BrowseStackParamList = {
    Feed: undefined;
    Results: {businesses:FirebaseFirestoreTypes.DocumentData[] | undefined,query:string};
    Shop: {business:FirebaseFirestoreTypes.DocumentData};
    Subscription: {subscription:FirebaseFirestoreTypes.DocumentData};
    Checkout:{ subscription: FirebaseFirestoreTypes.DocumentData };
};

const Stack = createNativeStackNavigator<BrowseStackParamList>();

export const BrowseScreen = () => {

    return (
        <Stack.Navigator>
            <Stack.Screen name='Feed' component={Feed} options={{ headerShown: false }} />
            <Stack.Screen name='Results' component={ResultsScreen} options={{ headerShown: false }} />
            <Stack.Screen name='Shop' component={ShopScreen} options={{ headerShown: false }} />
            <Stack.Screen name='Subscription' component={Subscription} options={{ headerShown: false }} />
            <Stack.Screen name='Checkout' component={CheckoutScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
    );
};

type FeedProps = NativeStackScreenProps<BrowseStackParamList, 'Feed'>;

const Feed:React.FC<FeedProps> = ({ navigation }) => {
    const { businesses, address } = useContext<BusinessContextInterface>(BusinessContext)
    const [search, setSearch] = useState<string>('')
    const [showSearch, setShowSearch] = useState<boolean>(false);

    const goToResults = () => {
        setShowSearch(false);
        navigation.navigate('Results', { businesses: businesses, query: search })
        setSearch('');
    }

    return (
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'right', 'left']} >
            <ScrollView>
                <Flex w={screenWidth} flexDirection="column" pt="20px" pb="10px" px="20px">
                    <HStack>
                        <Heading fontWeight="600" flex="1" size="xl">Browse</Heading>
                        <TouchableOpacity onPress={() => setShowSearch(true)}>
                            <Icon size="5" color="gray.500" as={<Ionicons name="ios-search" />} />
                        </TouchableOpacity>
                    </HStack>
                    <Text mt="5px">Showing shops near <Text>{address ? address : "you"}</Text></Text>
                    {businesses&&businesses.length>0 ?
                        <>
                            <Heading size="md" mt="20px" mb="10px" fontWeight="500">Popular</Heading>
                            <TouchableOpacity activeOpacity={1} onPress={() => navigation.navigate('Shop', { business: businesses[0] })}>
                                <TopItem business={businesses[0]} />
                            </TouchableOpacity>
                        </>
                        : 
                        <VStack height="100%"alignItems="center" justifyContent="center">
                            <Text textAlign="center">We're sorry, but there are currently no shops in your area :(</Text>
                        </VStack>}
                    
                    {businesses&&businesses.length>0 ?
                    <>
                    <Heading size="md" mb="10px" fontWeight="500">Our recommendations</Heading>
                        <Box >
                            <FlatList initialNumToRender={5} mx="-20px" px="20px" horizontal showsHorizontalScrollIndicator={false} data={businesses.slice(1).sort((a, b) => (a.totalCustomers < b.totalCustomers) ? 1 : -1)} renderItem={({ item }) =>
                                <TouchableOpacity activeOpacity={1} onPress={() => navigation.navigate('Shop', { business: item })}>
                                    <ShopItem business={item} />
                                </TouchableOpacity>

                            } keyExtractor={(item) => item.uid} />
                        </Box></>
                        : null}
                </Flex>
                <Searchbar showOverlay={showSearch} setShowOverlay={setShowSearch} search={search} setSearch={setSearch} goToResults={goToResults} />
            </ScrollView>
        </SafeAreaView>
    );
}

const TopItem:React.FC<FirebaseFirestoreTypes.DocumentData> = ({ business })=> {
    return (
        <Box alignSelf="center" mt="10px" mb="20px" borderRadius="2xl" >
            <Shadow radius={20} distance={10} paintInside={false} startColor="#0000000c">
                <Box borderRadius="2xl" overflow="hidden"  >
                    <Box>
                        <Image w={screenWidth} h="150px" key={business.uid} resizeMode="cover" src={business.photoURL} alt="Upload an image" />
                    </Box>
                    <Flex flexDirection="column" align="flex-start" p="6" bg="white">
                        <HStack space="3" mb="5px">
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
                        <Text color="#959897" fontSize="sm">{business.description}</Text>
                    </Flex>
                </Box>
            </Shadow>
        </Box>
    )
}

const ShopItem:React.FC<FirebaseFirestoreTypes.DocumentData> = ({ business })=> {
    return (
        <Box alignSelf="center" mt="10px" mr="40px" mb="10px" w="2xs" borderRadius="2xl" >
            <Shadow radius={20} distance={10} paintInside={false} startColor="#0000000c">
                <Box borderRadius="2xl" h="300px" overflow="hidden"  >
                    <Box>
                        <Image w="xs" h="150px" key={business.uid} resizeMode="cover" src={business.photoURL} alt="Upload an image" />
                    </Box>
                    <Flex flexDirection="column" align="flex-start" h="xs" p="6" bg="white">
                        <HStack space="3" mb="5px">
                            <Flex borderRadius="5px" px="10px" py="5px" align="center" justify="center" bg="brand.300">
                                <Text fontSize="12px" color="black">{business.businessType.charAt(0).toUpperCase() + business.businessType.slice(1)}</Text>
                            </Flex>
                        </HStack>
                        <Heading mt="10px" fontWeight="600" size="sm">{business.businessName}</Heading>
                        <Text isTruncated numberOfLines={2} color="#959897" fontSize="sm">{business.description}</Text>
                    </Flex>
                </Box>
            </Shadow>
        </Box>
    )
}

interface SearchBarProps{
    setShowOverlay: React.Dispatch<React.SetStateAction<boolean>>
    showOverlay: boolean
    search: string
    setSearch: React.Dispatch<React.SetStateAction<string>>
    goToResults: () => void
}
const Searchbar:React.FC<SearchBarProps> = ({ setShowOverlay, showOverlay, search, setSearch, goToResults })=> {
    const initialRef = useRef(null);

    return (

        <Modal isOpen={showOverlay} onClose={() => setShowOverlay(false)} initialFocusRef={initialRef}>
            <Modal.Content mt="100px" mb="auto" maxWidth="400px">
                <Modal.CloseButton />
                <Modal.Header style={{ borderBottomWidth: 0 }}>Search</Modal.Header>
                <Modal.Body pb="20px" px="15px">
                    <Shadow radius={10} distance={5} paintInside={false} startColor="#00000008">
                        <Input
                            placeholder="Find stores, cuisines, places..."
                            variant="unstyled"
                            width="100%"
                            bg="transparent"
                            px="2"
                            py="4"
                            onChangeText={(e) => setSearch(e)}
                            onSubmitEditing={() => goToResults()}
                            value={search}
                            ref={initialRef}
                            InputLeftElement={
                                <Icon
                                    ml="2"
                                    size="5"
                                    color="gray.500"
                                    as={<Ionicons name="ios-search" />}
                                />
                            }
                        />
                    </Shadow>
                </Modal.Body>
            </Modal.Content>
        </Modal>
    )
}