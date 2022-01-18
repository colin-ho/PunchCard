import React,{useCallback, useContext,useState,useEffect} from 'react';
import { ScrollView, RefreshControl ,TouchableOpacity, Dimensions} from 'react-native';
import { Heading ,Flex,Text, FlatList, Box,Image,Button, HStack, Icon} from 'native-base';
import ShopScreen from './ShopScreen';
import Subscription from './Subscription';
import { CheckoutScreen } from './CheckoutScreen';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shadow } from 'react-native-shadow-2';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthenticatedUserContext } from '../providers/AuthUserProvider';
import { BusinessContext } from '../providers/BusinessContextProvider';
import firestore,{ FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import Entypo from 'react-native-vector-icons/Entypo'
import AntDesign from 'react-native-vector-icons/AntDesign'

const Stack = createNativeStackNavigator();
const screenWidth = Dimensions.get('window').width;

export const HomeScreen = () => {

  return (
    <Stack.Navigator>
      <Stack.Screen name='Feed' component={Feed} options={{headerShown: false}}/>
      <Stack.Screen name='Shop' component={ShopScreen} options={{headerShown: false}}/>
      <Stack.Screen name='Subscription' component={Subscription} options={{headerShown: false}}/>
      <Stack.Screen name='Checkout' component={CheckoutScreen} options={{headerShown: false}}/>
    </Stack.Navigator>
  );
};

const Feed = ({navigation}:any)=>{
  const{user,displayName,favorites,subscriptions}:any = useContext(AuthenticatedUserContext)
  const{businesses,refreshing,setRefreshing}:any = useContext(BusinessContext)
  const [currentReds,setCurrentReds] = useState<any>([]);
  const [currentSubs,setCurrentSubs] = useState<any>([]);
  const [fanFavorites,setFanFavorites] = useState<any>([]);
  const [recentlyUsed, setRecentlyUsed] = useState<any>(null);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
  }, []);

  const fave=(id:any,fav:any)=>{
    if(fav){
      const sub = firestore().collection('customers').doc(user.uid).collection('favorites').doc(id);
      sub.delete();
    } else{
      const sub = firestore().collection('customers').doc(user.uid).collection('favorites').doc(id);
      sub.set({id:id});
    }
  }

  useEffect(() => {
    const handleRedeemingChanges= async(snapshot:any)=>{
        const all = snapshot?.docs.map((doc:any) => doc.data()); 
        var temp =[];
        for(let i = 0; i< all.length;i++){
          let data = (await all[i].currentRef.get()).data();
          temp.push(data);
        }
        setCurrentReds(temp);
        var temp2=[]
        for(let i = 0; i < temp.length;i++){
          const data = (await firestore().collection('businesses').doc(temp[i].businessId).collection('subscriptions').doc(temp[i].subscriptionId).get()).data();
          temp2.push(data)
        }
        setCurrentSubs(temp2);
    }
    let unsubscribe :any, unsubscribe2:any,unsubscribe3:any;
    if(user){
      const redeemingQuery = firestore().collectionGroup('customers').where('uid', '==', user.uid).where('redeeming','==',true)
      unsubscribe = redeemingQuery.onSnapshot(handleRedeemingChanges, 
            err => console.log(err));   
      const recentQuery = firestore().collection('customers').doc(user.uid).collection('subscribedTo').orderBy('redemptionCount')
      unsubscribe3= recentQuery.onSnapshot((snapshot)=>{
        if(!snapshot.empty){
          const recent = snapshot?.docs[0].data();
          if(recent&&subscriptions){
            const recentSub = subscriptions.filter((subscription:any)=>subscription.id == recent.subscriptionId)[0];
            if(recentSub&&favorites){
              if(favorites.includes(recentSub.id)){
                recentSub.favorite=true;
              }else{
                recentSub.favorite=false;
              }
              setRecentlyUsed(recentSub);
            }  
          }
        }
      })
    }

    unsubscribe2 = firestore().collectionGroup('subscriptions').where('published','==',true).where('archived','==',false).orderBy('customerCount','desc').onSnapshot((snapshot)=>{
      const all = snapshot?.docs.map((doc) => doc.data()); 
      let temp = [];
      for(let i = 0; i < all.length;i++){
        let temp1 = all[i];
        if(favorites.includes(temp1.id)){
          temp1.favorite = true;
        } else{
          temp1.favorite = false;
        }
      temp.push(temp1);
    }
      setFanFavorites(temp);
    })
    return ()=>{
      unsubscribe2?.()
      unsubscribe3?.()
      unsubscribe?.();
  }
  }, [user,refreshing,favorites,subscriptions])

  return (
    <SafeAreaView style={{flex:1}} edges={['top','right','left']}>
      <ScrollView 
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
        />}>
          <Flex flexDirection="column" px="20px" pt="20px">
            <Text>{(new Date).toLocaleDateString("en-US",{ weekday: 'long', month: 'long', day: 'numeric' })}</Text>
            <Heading fontSize="28px" fontWeight="600">{displayName ? "Welcome back " + displayName.substr(0,displayName.indexOf(' ')):"Start punching ->"}</Heading>
            {businesses ? user ? 
            <>
            <Heading size="md" fontWeight="500" mt="20px">{currentReds.length>0 ? "Status Update" : "Recommended for you"}</Heading>
            {currentReds.length > 0 ? (currentSubs.map((sub:any)=>
              <TouchableOpacity key={sub.id}activeOpacity={1} onPress={() => navigation.navigate('Subscription',{subscription:sub})}>
                <ActiveItem  redemption={currentReds.filter((red:any)=>red.subscriptionId ==sub.id)[0]} address={businesses.filter((business:any)=>business.uid == sub.businessId)[0].address} subscription={sub}/>
              </TouchableOpacity>)) : recentlyUsed ? 
            <TouchableOpacity activeOpacity={1} onPress={() => navigation.navigate('Subscription',{subscription:recentlyUsed})}>
                  <RecommendedItem subscription={recentlyUsed} fave={fave} user={user} />
                </TouchableOpacity> : 
                <TouchableOpacity activeOpacity={1} onPress={() => navigation.navigate('Subscription',{subscription:fanFavorites[2]})}>
                  <RecommendedItem subscription={fanFavorites[2]} fave={fave} user={user} />
                </TouchableOpacity>}
            </>
            :
            <>
            <Heading size="md" fontWeight="500" mt="20px">Featured Store</Heading>
            <TouchableOpacity activeOpacity={1} onPress={()=>navigation.navigate('Shop',{business:businesses[0]})}>
              <TopItem business={businesses[0]}/>
            </TouchableOpacity>
            </>:null}
            <Heading size="md" fontWeight="500" mt="20px">Fan favorites</Heading>
        </Flex>
        {businesses ? 
            <Box mt="10px">
              <FlatList initialNumToRender={5}pb="20px"showsHorizontalScrollIndicator={false} horizontal={true} data ={recentlyUsed ? fanFavorites.filter((fav:any)=>fav.id!=recentlyUsed.id):fanFavorites} renderItem={({item})=>
                <TouchableOpacity activeOpacity={1} onPress={() => navigation.navigate('Subscription',{subscription:item})}>
                  <SubscriptionItem subscription={item} fave={fave} user={user} />
                </TouchableOpacity>
             } keyExtractor={(item:any) => item.id}/>
            </Box>
            :null}
      </ScrollView>
    </SafeAreaView>
  );
}

function ActiveItem({subscription,redemption,address}:any){
  
  return(
    <>
    {redemption ? 
    <Box alignSelf="center" mt="20px" mb="10px" borderRadius="2xl">
        <Shadow radius={20} distance={10} paintInside={false}  startColor="#0000000c">
            <Box w={screenWidth-40} borderRadius="2xl" overflow="hidden" >
                <Flex flexDirection="column" p="6" bg="white">
                  <HStack  mb="5px" space="3">
                    <Flex borderRadius="5px" px="10px" py="5px" align="center" justify="center" bg="brand.200">
                      <Text fontSize="12px" color="black">Active Redemption</Text>
                    </Flex>
                    <Flex borderRadius="5px" px="10px" py="5px" align="center" justify="center" bg="brand.300">
                      <Text fontSize="12px" color="black">{(redemption.collectBy.toDate() - (+new Date()) ) / (1000 * 60) > 0 ? "Ready in " + Math.ceil((redemption.collectBy.toDate() - (+new Date())) / (1000 * 60)) + " min" : "Ready now"}</Text>
                    </Flex>
                  </HStack>
                  <Text my="5px" fontWeight="600">{subscription.title + " from " + subscription.businessName}</Text>
                  <HStack mt="10px" >
                    <Text flex="1">Your Subscription:</Text>
                    <Text  color="#959897">{subscription.content}</Text>
                  </HStack>
                  <HStack mt="10px" pr="10px" space="3">
                    <Icon as={Entypo} name="location"/>
                    <Text numberOfLines={3} mr="10px" isTruncated pr="10px">{address}</Text>
                  </HStack>
                </Flex>
            </Box>
        </Shadow>
    </Box>:null}
    </>
  )
}

function SubscriptionItem({subscription,fave,user}:any){
  
  return(

    <Box alignSelf="center" pt="10px" mx="20px" w="2xs"borderRadius="2xl">
        <Shadow radius={20} distance={10} paintInside={false}  startColor="#0000000c">
            <Box h="xs" borderRadius="2xl" overflow="hidden" >
                <Box>
                    {user ? <Button position="absolute" right="3" top="3" borderRadius="10" zIndex="1" variant="solid" colorScheme="brand" onPress={()=>fave(subscription.id,subscription.favorite)}><Icon as={AntDesign} size="xs" color={subscription.favorite ?  "pink.500":"black" }name="heart"/></Button>:null}
                    <Image w = "2xs" h="150px" key={subscription.id} resizeMode="cover" src={subscription.photoURL} alt="Upload an image"/>
                </Box>
                <Flex h="xs" flexDirection="column" p="6" bg="white">
                        <HStack  mb="5px" space="3">
                        {subscription.customerCount > 2 ? 
                        <Flex borderRadius="5px" px="10px" py="5px" align="center" justify="center" bg="brand.100">
                          <Text fontSize="12px" color="black">Popular near you</Text>
                        </Flex>: null}
                        <Flex borderRadius="5px" px="10px" py="5px" align="center" justify="center" bg="brand.300">
                          <Text fontSize="12px" color="black">{subscription.businessType.charAt(0).toUpperCase()+subscription.businessType.slice(1)}</Text>
                        </Flex>
                        </HStack>
                        <Text my="5px" fontWeight="600">{subscription.title + " from " + subscription.businessName}</Text>
                        <Text>{subscription.dayConstrain ? "1" : subscription.limit ? subscription.limit : "10x "} {subscription.content ? subscription.content : "Hot Cappucino"} {subscription.dayConstrain ? "per Day " : ""}for ${subscription.price ? (Math.round(subscription.price * 100) / 100).toFixed(2) : 19.99}/{subscription.interval ? subscription.interval.charAt(0).toUpperCase() +  subscription.interval.slice(1): "Week"}</Text>
                </Flex>
            </Box>
        </Shadow>
    </Box>
  )
}

function RecommendedItem({subscription,fave,user}:any){
  
  return(

    <Box alignSelf="center" mt="20px" borderRadius="2xl">
        <Shadow radius={20} distance={10} paintInside={false}  startColor="#0000000c">
            <Box borderRadius="2xl" overflow="hidden">
                <Box>
                    {user ? <Button position="absolute" right="3" top="3" borderRadius="10" zIndex="1" variant="solid" colorScheme="brand" onPress={()=>fave(subscription.id,subscription.favorite)}><Icon as={AntDesign} size="xs" color={subscription.favorite ?  "pink.500":"black" }name="heart"/></Button>:null}
                    <Image w = {screenWidth} h="150px" key={subscription.id} resizeMode="cover" src={subscription.photoURL} alt="Upload an image"/>
                </Box>
                <Flex flexDirection="column" p="6" bg="white">
                  <HStack space="3" mb="5px">
                  {subscription.customerCount > 2 ? 
                  <Flex borderRadius="5px" px="10px" py="5px" align="center" justify="center" bg="brand.100">
                    <Text fontSize="12px" color="black">Popular near you</Text>
                  </Flex>: null}
                  <Flex borderRadius="5px" px="10px" py="5px" align="center" justify="center" bg="brand.300">
                    <Text fontSize="12px" color="black">{subscription.businessType.charAt(0).toUpperCase()+subscription.businessType.slice(1)}</Text>
                  </Flex>
                  </HStack>
                  <Text my="5px" fontWeight="600">{subscription.title + " from " + subscription.businessName}</Text>
                  <Text>{subscription.dayConstrain ? "1" : subscription.limit ? subscription.limit : "10x "} {subscription.content ? subscription.content : "Hot Cappucino"} {subscription.dayConstrain ? "per Day " : ""}for ${subscription.price ? (Math.round(subscription.price * 100) / 100).toFixed(2) : 19.99}/{subscription.interval ? subscription.interval.charAt(0).toUpperCase() +  subscription.interval.slice(1): "Week"}</Text>
                </Flex>
            </Box>
        </Shadow>
    </Box>
  )
}

function TopItem({business}:any){
  return(
    business ?
    <Box alignSelf="center" mt="20px"  borderRadius="2xl" >
      {console.log(business)}
      <Shadow radius={20} distance={10} paintInside={false}  startColor="#0000000c">
        <Box borderRadius="2xl"  overflow="hidden"  >
            <Box>
              <Image w = {screenWidth} h="150px" key={business.uid} resizeMode="cover" src={business.photoURL} alt="Upload an image"/>
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
              <Text fontSize="sm">{business.description}</Text>
            </Flex>
        </Box>
      </Shadow>
    </Box>
    :null
  )
}

