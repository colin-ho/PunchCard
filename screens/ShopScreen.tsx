import AntDesign from 'react-native-vector-icons/AntDesign';
import Ionicons from 'react-native-vector-icons/Ionicons'
import { Box, Button, FlatList, Flex, Heading, HStack, Icon, Image, Text } from 'native-base';
import React, { useState,useEffect, useContext } from 'react'
import { Dimensions } from 'react-native';
import { ScrollView, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shadow } from 'react-native-shadow-2';
import { AuthenticatedUserContext } from '../providers/AuthUserProvider';
import firestore,{ FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

const screenWidth = Dimensions.get('window').width;
export default function ShopScreen({navigation,route}:any) {
    const [subscriptions, setSubscriptions] = useState<any>(null);
    const {user,favorites}:any = useContext(AuthenticatedUserContext)

    const getSubs = async()=>{
      const query = firestore()
      .collection('businesses').doc(route.params.business.uid)
      .collection('subscriptions')
      .where('published','==',true)
      .where('archived','==',false)
      .orderBy('updatedAt', 'desc')
      .limit(5);
      const newSubscriptions = (await query.get()).docs.map((doc:any) => doc.data());
      let temp = [];
      for(let i = 0; i < newSubscriptions.length;i++){
        let temp1 = newSubscriptions[i];
        if(favorites.includes(temp1.id)){
          temp1.favorite=true;
        }
        else{
          temp1.favorite=false;
        }
        temp.push(temp1);
      }
      setSubscriptions(temp);
    }

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
      getSubs();
    }, [favorites])
    
    return (
        <SafeAreaView style={{flex:1}} edges={['top']}>
          <ScrollView>
          <HStack  alignItems="center" pl="10px" pr="30px" pt="20px">
              <Button variant="unstyled" onPress={()=>navigation.goBack()} leftIcon={<Icon as={Ionicons} name="chevron-back" size="sm" color="black" />}></Button>
              <Heading fontWeight="600" flex="1" size="md">{route.params.business.businessName}</Heading>
          </HStack>
          <Box alignSelf="center" mt="10px" bg="white"borderRadius="2xl">
                <Shadow radius={15} distance={10} paintInside={false}  startColor="#0000000c">
                    <Box  w={screenWidth-40} p="6">
                        <Heading fontWeight="500" size="sm">{route.params.business.description}</Heading>
                        <Text color="#959897"mt="10px">Location: {route.params.business.address}</Text>
                    </Box>
                </Shadow>
            </Box>
            
            {subscriptions ? 
              <Box px="20px" mb="10px" mt="20px">
              <Heading fontWeight="500"  size="md" mt="10px" mb="10px" pl="10px">Subscriptions for you</Heading>
              {subscriptions.map((item:any)=>{
                return(
                <TouchableOpacity key={item.id}activeOpacity={1} onPress={() => navigation.navigate('Subscription',{subscription:item})}>
                  <SubscriptionItem user={user} fave={fave} subscription={item} />
                </TouchableOpacity>
                )
              })}
             </Box>
            :null}
            </ScrollView>
        </SafeAreaView>
    )
}

function SubscriptionItem({subscription,fave,user}:any){
  
  return(

    <Box alignSelf="center" mt="10px" mb="60px" h="2xs" borderRadius="2xl">
        <Shadow radius={20} distance={10} paintInside={false}  startColor="#0000000c">
            <Box borderRadius="2xl" overflow="hidden" >
                <Box>
                    {user ? <Button position="absolute" right="3" top="3" borderRadius="10" zIndex="1" variant="solid" colorScheme="brand" onPress={()=>fave(subscription.id,subscription.favorite)}><Icon as={AntDesign} size="xs" color={subscription.favorite ?  "pink.500":"black" }name="heart"/></Button>:null}
                    <Image w={screenWidth} h="150px" key={subscription.id} resizeMode="cover" src={subscription.photoURL} alt="Upload an image"/>
                </Box>
                <Flex bg="white" flexDirection="column" p="6">
                  <HStack space="3" mb="5px">
                  {subscription.customerCount > 2 ? 
                  <Flex borderRadius="5px" px="10px" py="5px" align="center" justify="center" bg="brand.100">
                    <Text fontSize="12px" color="black">Popular near you</Text>
                  </Flex>: null}
                  <Flex borderRadius="5px" px="10px" py="5px" align="center" justify="center" bg="brand.300">
                    <Text fontSize="12px" color="black">{subscription.businessType.charAt(0).toUpperCase()+subscription.businessType.slice(1)}</Text>
                  </Flex>
                  </HStack>
                  <Text fontWeight="600"my="5px">{subscription.title + " from " + subscription.businessName}</Text>
                  <Text>{subscription.dayConstrain ? "1" : subscription.limit ? subscription.limit : "10x "} {subscription.content ? subscription.content : "Hot Cappucino"} {subscription.dayConstrain ? "per Day " : ""}for ${subscription.price ? (Math.round(subscription.price * 100) / 100).toFixed(2) : 19.99}/{subscription.interval ? subscription.interval.charAt(0).toUpperCase() +  subscription.interval.slice(1): "Week"}</Text>
                </Flex>
            </Box>
        </Shadow>
    </Box>
  )
}