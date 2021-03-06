import React, { useContext, useState, useEffect, useCallback } from 'react';
import { Box, Flex, Heading, Image, Text, VStack, Button, Icon, HStack, FlatList, Modal, Input, Select } from 'native-base';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons'
import { Shadow } from 'react-native-shadow-2';
import { Dimensions, TouchableOpacity } from 'react-native';
import { debounce } from "lodash";
import { BusinessContext, BusinessContextInterface } from '../providers/BusinessContextProvider';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { BrowseStackParamList } from './BrowseScreen';

const stringSimilarity = require("string-similarity");
const screenWidth = Dimensions.get('window').width;

type ResultsProps = NativeStackScreenProps<BrowseStackParamList, 'Results'>;


export const ResultsScreen: React.FC<ResultsProps> = ({ navigation, route }) => {
    const { address } = useContext<BusinessContextInterface>(BusinessContext)
    const businesses = route.params.businesses;
    const [filtered, setFiltered] = useState<FirebaseFirestoreTypes.DocumentData[]>([])
    const [search, setSearch] = useState(route.params.query)
    const [showSearch, setShowSearch] = useState(false);
    const [filter, setFilter] = useState('distance')

    const updateQuery = () => {
        // A search query api call.
        if (businesses) {
            if (search.length === 0) {
                setFiltered(businesses);
            } else {
                setFiltered(businesses.filter((business: FirebaseFirestoreTypes.DocumentData) =>
                    (business.businessName.toLowerCase().includes(search.toLowerCase()) || business.businessType.includes(search.toLowerCase())) || (stringSimilarity.compareTwoStrings(business.businessName.toLowerCase(), search.toLowerCase()) > 0.5 || stringSimilarity.compareTwoStrings(business.businessType, search.toLowerCase()) > 0.5) 
                    || business.tags.includes(search)));
            }
        }
    };

    const delayedQuery = useCallback(debounce(updateQuery, 500), [search]);

    const onChange = (e: string) => {
        setSearch(e);
    };

    useEffect(() => {
        delayedQuery();

        // Cancel the debounce on useEffect cleanup.
        return delayedQuery.cancel;
    }, [search, businesses, delayedQuery])

    return (

        <SafeAreaView style={{ flex: 1 }} edges={['top', 'right', 'left']}>
            <HStack justifyContent="center" alignItems="center" pl="10px" pr="30px" pt="20px">
                <Button variant="unstyled" onPress={() => navigation.goBack()} leftIcon={<Icon as={Ionicons} name="chevron-back" size="sm" color="black" />}></Button>
                <Heading fontWeight="600" textAlign="center" flex="1" size="md">{search}</Heading>
                <TouchableOpacity onPress={() => setShowSearch(true)}>
                    <Icon size="5" color="gray.500" as={<Ionicons name="ios-search" />} />
                </TouchableOpacity>
            </HStack>
            <Text px="20px" mt="20px">Showing {filtered.length} shops near <Text underline>{address ? address : "you"}</Text></Text>
            <HStack my="20px" alignItems="center" justifyContent="flex-end" px="20px" space="4">
                <Text>Filter by:</Text>
                <Shadow radius={10} distance={10} paintInside={false} startColor="#00000008">
                    <Select p="3" variant="outline" width="150px"
                        defaultValue="distance" onValueChange={(itemValue) => setFilter(itemValue)}>
                        <Select.Item label="Distance" value="distance" />
                        <Select.Item label="Popularity" value="popularity" />
                    </Select>
                </Shadow>
            </HStack>
            {filtered ?
                <Box>
                    <FlatList initialNumToRender={5} mb="160px" showsVerticalScrollIndicator={false} data={filter == "distance" ? filtered : [...filtered].sort((a, b) => (a.totalCustomers < b.totalCustomers) ? 1 : -1)} renderItem={({ item }) =>
                        <TouchableOpacity activeOpacity={1} onPress={() => navigation.navigate('Shop', { business: item })}>
                            <ResultsItem business={item} />
                        </TouchableOpacity>

                    } keyExtractor={(item) => item.uid} />
                </Box>
                : null}
            <Searchbar showOverlay={showSearch} onChange={onChange} setShowOverlay={setShowSearch} search={search} />
        </SafeAreaView>
    );
}

function ResultsItem({ business }: FirebaseFirestoreTypes.DocumentData) {
    return (
        <Box alignSelf="center" mt="10px" mb="20px" mx="20px" borderRadius="2xl" >
            <Shadow radius={20} distance={10} paintInside={false} startColor="#0000000c">
                <Box borderRadius="2xl" overflow="hidden"  >
                    <Box>
                        <Image w={screenWidth} h="150px" key={business.uid} resizeMode="cover" src={business.photoURL} alt="Upload an image" />
                    </Box>
                    <Flex flexDirection="column" align="flex-start" bg="white" p="6">
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
                        <Heading fontWeight="500" mt="10px" size="sm">{business.businessName}</Heading>
                        <Text fontSize="sm">{business.description}</Text>
                    </Flex>
                </Box>
            </Shadow>
        </Box>
    )
}
interface SearchBarProps {
    setShowOverlay: React.Dispatch<React.SetStateAction<boolean>>
    showOverlay: boolean
    search: string
    onChange: (e: string) => void
}

function Searchbar({ setShowOverlay, showOverlay, search, onChange }: SearchBarProps) {

    return (

        <Modal isOpen={showOverlay} onClose={() => setShowOverlay(false)}>
            <Modal.Content mt="100px" mb="auto" maxWidth="400px">
                <Modal.CloseButton />
                <Modal.Header style={{ borderBottomWidth: 0 }}>Search</Modal.Header>
                <Modal.Body pb="20px" px="15px">
                    <Shadow radius={10} distance={10} paintInside={false} startColor="#00000008">
                        <Input
                            placeholder="Find stores, cuisines, places..."
                            variant="unstyled"
                            width="100%"
                            bg="transparent"
                            px="2"
                            py="4"
                            onChangeText={(e) => onChange(e)}
                            onSubmitEditing={() => setShowOverlay(false)}
                            value={search}
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