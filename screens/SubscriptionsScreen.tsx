import React,{useContext,useState,useEffect} from 'react';
import { Dimensions, ScrollView, TouchableOpacity} from 'react-native';
import Subscription from './Subscription';
import { Box, Flex,Heading,Image,Text, VStack,Button, HStack, Icon} from 'native-base';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shadow } from 'react-native-shadow-2';
import AntDesign from 'react-native-vector-icons/AntDesign'
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthenticatedUserContext } from '../providers/AuthUserProvider';
import { BusinessContext } from '../providers/BusinessContextProvider';
import firestore from '@react-native-firebase/firestore';

const Stack = createNativeStackNavigator();
const screenWidth = Dimensions.get('window').width;
export const SubscriptionsScreen = () => {

  return (
    <Stack.Navigator>
      <Stack.Screen name='Feed' component={Feed} options={{headerShown: false}}/>
      <Stack.Screen name='Subscription' component={Subscription} options={{headerShown: false}}/>
    </Stack.Navigator>
  );
};

const Feed = ({navigation}:any)=>{
  const {user,setNeedsLogin,subscriptions,favorites}:any = useContext(AuthenticatedUserContext)
  const {businesses}:any = useContext(BusinessContext)
  const [firstSub,setFirstSub] = useState<any>(null);
  const [filtered,setFiltered] = useState<any>([]);
  useEffect(() => {
    if(!user){
      setNeedsLogin(true);
    }
  }, [])

  useEffect(()=>{
    let temp = [];
    for(let i = 0; i < subscriptions.length;i++){
      let temp1 = subscriptions[i];
      if(favorites.includes(temp1.id)){
        temp1.favorite=true;
      }else{
        temp1.favorite=false;
      }
      temp.push(temp1);
    }
    setFiltered(temp);
  },[favorites,subscriptions])

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
    // Moved inside "useEffect" to avoid re-creating on render
    if(businesses){
      let temp = null;
      for(let i = 0; i < businesses.length;i++){
        if(temp!=null) break;
        for(let j = 0; j < filtered.length;j++){
          if(businesses[i].uid === filtered[j].businessId){
            temp = filtered[j];
            break;
          } 
        }
      }
      setFirstSub(temp);
    }

}, [businesses,filtered]);
  return (
    
    <SafeAreaView style={{flex:1}} edges={['top','right','left']}>
      {user ? 
        <ScrollView>
        <VStack space={5} p="20px">
            <Box>
              <Heading fontWeight="600"size="xl">Subscriptions</Heading>
              <Text>Your active subscriptions </Text>
            </Box>
            {firstSub ? <Heading fontWeight="500"size="md">Based on your location</Heading>:null}
            {firstSub ? 
            <TouchableOpacity activeOpacity={1} onPress={() => navigation.navigate('Subscription',{subscription:firstSub})}>
            <SubscriptionItem navigation={navigation} fave={fave}subscription={firstSub}/>
            </TouchableOpacity>
            :null}
            {firstSub&&filtered.length>1 ? <Heading fontWeight="500"size="md">All subscriptions</Heading> : null}
          {filtered.length>0 ? firstSub ? filtered.filter((subscription:any)=>subscription.id!= firstSub.id).map((subscription:any)=>{
            return (
              <TouchableOpacity key={subscription.id} activeOpacity={1} onPress={() => navigation.navigate('Subscription',{subscription})}>
                  <SubscriptionItem fave={fave} subscription={subscription}/>
              </TouchableOpacity>
          )
          }): filtered.map((subscription:any)=>{
            return (
              <TouchableOpacity key={subscription.id} activeOpacity={1} onPress={() => navigation.navigate('Subscription',{subscription})}>
                  <SubscriptionItem fave={fave} subscription={subscription}/>
              </TouchableOpacity>
          )
          }) : <Text>Buy subscriptions to get started!</Text>}
        </VStack>
        </ScrollView> : null
      }
    </SafeAreaView>
  );
}

function SubscriptionItem({subscription,fave}:any){
  
  return(

    <Box alignSelf="center"  borderRadius="2xl">
        <Shadow radius={20} distance={10} paintInside={false}  startColor="#0000000c">
            <Box borderRadius="2xl" overflow="hidden">
                <Box>
                    <Button position="absolute" right="3" top="3" borderRadius="10" zIndex="1" variant="solid" colorScheme="brand" onPress={()=>fave(subscription.id,subscription.favorite)}><Icon as={AntDesign} size="xs" color={subscription.favorite  ?  "pink.500":"black"}name="heart"/></Button>
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