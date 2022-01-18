import React,{useContext,useState,useEffect} from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ShopScreen from './ShopScreen';
import Subscription from './Subscription';
import { CheckoutScreen } from './CheckoutScreen';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Box, Button, FlatList, Flex, Heading, HStack, Icon, IconButton, Image, Input,Modal,Text } from 'native-base';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, TouchableOpacity } from 'react-native';
import { Dimensions } from 'react-native';
import {Shadow} from 'react-native-shadow-2';
import { ResultsScreen } from './ResultsScreen';
import { BusinessContext } from '../providers/BusinessContextProvider';

const screenWidth = Dimensions.get('window').width;
const Stack = createNativeStackNavigator();

export const BrowseScreen = () => {

  return (
    <Stack.Navigator>
      <Stack.Screen name='Feed' component={Feed} options={{headerShown: false}}/>
      <Stack.Screen name='Results' component={ResultsScreen} options={{headerShown: false}}/>
      <Stack.Screen name='Shop' component={ShopScreen} options={{headerShown: false}}/>
      <Stack.Screen name='Subscription' component={Subscription} options={{headerShown: false}}/>
      <Stack.Screen name='Checkout' component={CheckoutScreen}options={{headerShown: false}} />
    </Stack.Navigator>
  );
};

const Feed = ({navigation}:any)=>{
  const{businesses,address}:any = useContext(BusinessContext)
  const [search,setSearch] = useState('')
  const [showSearch,setShowSearch] = useState(false);

  const goToResults=()=>{
    setShowSearch(false);
    navigation.navigate('Results',{businesses:businesses,query:search})
    setSearch('');
  }

  return (
    <SafeAreaView style={{flex:1}} edges={['top','right','left']} >
      <ScrollView>
        <Flex w={screenWidth} flexDirection="column" pt="20px" pb="10px" px="20px">
          <HStack>
            <Heading fontWeight="600" flex="1" size="xl">Browse</Heading>
            <TouchableOpacity onPress={()=>setShowSearch(true)}>
              <Icon size="5" color="gray.500" as={<Ionicons name="ios-search" />}/>
            </TouchableOpacity>
          </HStack>
        <Text mt="5px">Showing shops near <Text underline>{address ? address : "you"}</Text></Text>
        {businesses ? 
        <>
        <Heading size="md" mt="20px" mb="10px" fontWeight="500">Popular near you</Heading>
        <TouchableOpacity activeOpacity={1} onPress={() => navigation.navigate('Shop',{business:businesses[0]})}>
          <TopItem business={businesses[0]}/>
        </TouchableOpacity>
        </>
         :null}
        <Heading size="md" mb="10px" fontWeight="500">Our recommendations</Heading>
        {businesses ? 
              <Box >
              <FlatList initialNumToRender={5}mx="-20px" px="20px" horizontal showsHorizontalScrollIndicator={false} data ={businesses.slice(1).sort((a: any, b: any) => (a.totalCustomers < b.totalCustomers) ? 1 : -1)} renderItem={({item})=>
                <TouchableOpacity activeOpacity={1} onPress={() => navigation.navigate('Shop',{business:item})}>
                  <ShopItem  business={item} />
                </TouchableOpacity>
                
             } keyExtractor={(item:any) => item.uid}/>
             </Box>
            :null}
    </Flex>
    <Searchbar showOverlay={showSearch} setShowOverlay={setShowSearch} search={search} setSearch={setSearch} goToResults={goToResults}/>
    </ScrollView>
    </SafeAreaView>
  );
}

function TopItem({business}:any){
  return(
    <Box alignSelf="center" mt="10px" mb="20px" borderRadius="2xl" >
      <Shadow radius={20} distance={10} paintInside={false}  startColor="#0000000c">
        <Box borderRadius="2xl" overflow="hidden"  >
            <Box>
              <Image w ={screenWidth} h="150px" key={business.uid} resizeMode="cover" src={business.photoURL} alt="Upload an image"/>
            </Box>
            <Flex flexDirection="column" align="flex-start" p="6" bg="white">
            <HStack space="3" mb="5px">
              {business.totalCustomers > 0 ? 
              <Flex borderRadius="5px" px="10px" py="5px" align="center" justify="center" bg="brand.100">
                <Text fontSize="12px" color="black">Popular near you</Text>
              </Flex>: null}
              <Flex borderRadius="5px" px="10px" py="5px" align="center" justify="center" bg="brand.300">
                <Text fontSize="12px" color="black">{business.businessType.charAt(0).toUpperCase() +  business.businessType.slice(1) }</Text>
              </Flex>
              </HStack>
              <Heading fontWeight="600" mt="10px" size="sm">{business.businessName}</Heading>
              <Text color="#959897" fontSize="sm">{business.description}</Text>
            </Flex>
        </Box>
      </Shadow>
    </Box>
  )
}

function ShopItem({business}:any){
  return(
    <Box alignSelf="center" mt="10px" mr="40px" mb="10px" w="2xs"   borderRadius="2xl" >
      <Shadow radius={20} distance={10} paintInside={false}  startColor="#0000000c">
        <Box borderRadius="2xl" h="300px" overflow="hidden"  >
            <Box>
              <Image w = "xs" h="150px" key={business.uid} resizeMode="cover" src={business.photoURL} alt="Upload an image"/>
            </Box>            
            <Flex flexDirection="column" align="flex-start" h="xs" p="6" bg="white">
            <HStack space="3" mb="5px">
              {business.totalCustomers > 0 ? 
              <Flex borderRadius="5px" px="10px" py="5px" align="center" justify="center" bg="brand.100">
                <Text fontSize="12px" color="black">Popular near you</Text>
              </Flex>: null}
              <Flex borderRadius="5px" px="10px" py="5px" align="center" justify="center" bg="brand.300">
                <Text fontSize="12px" color="black">{business.businessType.charAt(0).toUpperCase() +  business.businessType.slice(1) }</Text>
              </Flex>
              </HStack>
              <Heading mt="10px" fontWeight="600" size="sm">{business.businessName}</Heading>
              <Text isTruncated numberOfLines={2}  color="#959897"fontSize="sm">{business.description}</Text>
            </Flex>
        </Box>
      </Shadow>
    </Box>
  )
}

function Searchbar({setShowOverlay,showOverlay,search,setSearch,goToResults}:any){

  return(

      <Modal isOpen={showOverlay} onClose={() => setShowOverlay(false)}>
      <Modal.Content mt="100px" mb="auto" maxWidth="400px">
        <Modal.CloseButton />
        <Modal.Header style={{borderBottomWidth: 0}}>Search</Modal.Header>
        <Modal.Body pb="20px" px="15px">
        <Shadow radius={10} distance={5} paintInside={false}  startColor="#00000008">
            <Input
              placeholder="Find stores, cuisines, places..."
              variant="unstyled"
              width="100%"
              bg="transparent"
              px="2"
              py="4"
              onChangeText={(e)=>setSearch(e)}
              onSubmitEditing={()=>goToResults()}
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