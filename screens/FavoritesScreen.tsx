import React,{useContext,useState,useEffect} from 'react';
import { Dimensions, ScrollView} from 'react-native';
import firestore ,{FirebaseFirestoreTypes}from '@react-native-firebase/firestore';
import Subscription from './Subscription';
import { Box, Flex,Heading,Image,Text, VStack,Button, Icon, HStack} from 'native-base';
import { SafeAreaView } from 'react-native-safe-area-context';
import AntDesign from 'react-native-vector-icons/AntDesign';
import {Shadow} from 'react-native-shadow-2';
import { TouchableOpacity } from 'react-native';
import { AuthenticatedUserContext } from '../providers/AuthUserProvider';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();
const screenWidth = Dimensions.get('window').width;
export const FavoritesScreen = () => {

  return (
    <Stack.Navigator>
      <Stack.Screen name='Feed' component={Feed} options={{headerShown: false}}/>
      <Stack.Screen name='Subscription' component={Subscription} options={{headerShown: false}}/>
    </Stack.Navigator>
  );
};

const Feed = ({navigation}:any)=>{
  const {user,setNeedsLogin,favorites}:any = useContext(AuthenticatedUserContext)
  const [filtered,setFiltered] = useState<FirebaseFirestoreTypes.DocumentData[]>([]);
  useEffect(() => {
    let unsubscribe;
    if(!user){
      setNeedsLogin(true);
    }
    else{
        if(favorites.length>0){
            let query = firestore().collectionGroup('subscriptions').where('id', 'in', favorites)
            unsubscribe = query.onSnapshot((snapshot)=>{
                const data= snapshot?.docs.map((doc) => doc.data());
                setFiltered(data);  
            })
        }else{
            setFiltered([]);  
        }
    }
    return unsubscribe;
  }, [favorites])

  const unfave=(id:any)=>{
    const sub = firestore().collection('customers').doc(user.uid).collection('favorites').doc(id);
    sub.delete();
}

  return (
    
    <SafeAreaView style={{flex:1}} edges={['top','right','left']}>
      {user ? 
        <ScrollView>
        <VStack space={6} p="20px">
            <Box>
              <Heading fontWeight="600"size="xl">Favorites</Heading>
              <Text>Your saved subscriptions</Text>
            </Box>
          {filtered.length>0 ? filtered.map((subscription)=>{
            return (
                <TouchableOpacity key={subscription.id} activeOpacity={1} onPress={() => navigation.navigate('Subscription',{subscription})}>
                    <SubscriptionItem unfave={unfave} subscription={subscription}/>
                </TouchableOpacity>
            )
          }) : <Text>Favorite your subscriptions to get started!</Text>}
        </VStack>
        </ScrollView> : null
      }
    </SafeAreaView>
  );
}

function SubscriptionItem({subscription,unfave}:any){
  
  return(

    <Box alignSelf="center"  borderRadius="2xl">
        <Shadow radius={20} distance={10} paintInside={false}  startColor="#0000000c">
            <Box borderRadius="2xl" overflow="hidden" >
                <Box>
                    <Button position="absolute" right="3" top="3" borderRadius="10" zIndex="1" variant="solid" colorScheme="brand" onPress={()=>unfave(subscription.id)}><Icon as={AntDesign} size="xs" color="pink.500" name="heart"/></Button>
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
                    <Text>{subscription.dayConstrain ? "1" : subscription.limit ? subscription.limit : "10x "} {subscription.content} {subscription.dayConstrain ? "per Day " : ""}for ${subscription.price ? (Math.round(subscription.price * 100) / 100).toFixed(2) : 19.99}/{subscription.interval ? subscription.interval.charAt(0).toUpperCase() +  subscription.interval.slice(1): "Week"}</Text>
                </Flex>
            </Box>
        </Shadow>
    </Box>
  )
}