import React,{useContext,useState,useEffect, useCallback} from 'react';
import { Box, Flex,Heading,Image,Text, VStack,Button, Icon, HStack, FlatList, Modal, Input, Select} from 'native-base';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons'
import {Shadow} from 'react-native-shadow-2';
import { Dimensions, TouchableOpacity } from 'react-native';
import { debounce } from "lodash";
import { BusinessContext } from '../providers/BusinessContextProvider';
import { AuthenticatedUserContext } from '../providers/AuthUserProvider';
import firestore,{ FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

export const HistoryScreen = ({navigation,route}:any)=>{
    const [subHistory, setSubHistory] = useState<any>([]);
    const [redHistory, setRedHistory] = useState<any>([]);
    const {user}:any = useContext(AuthenticatedUserContext)
    const [select,setSelected]  = useState('subscriptions')

    const getHistory = async()=>{
      const query = firestore()
      .collection('customers').doc(user.uid)
      .collection('history')
      .orderBy('time')

      const subs : any = [];
      const reds : any = [];
      (await query.get()).docs.map((doc:any) => doc.data().type === 'redemption' ? reds.push(doc.data()) : subs.push(doc.data()));

      setSubHistory(subs);
      setRedHistory(reds);
    }
 
    useEffect(() => {
        if(user){
            getHistory();
        }
    }, [user])
  return (
    
    <SafeAreaView style={{flex:1}} edges={['top','right','left']}>
        <HStack  alignItems="center" pl="10px" pr="30px" pt="20px">
            <Button variant="unstyled" onPress={()=>navigation.goBack()} leftIcon={<Icon as={Ionicons} name="chevron-back" size="sm" color="black" />}></Button>
            <Heading fontWeight="600" flex="1" size="md">History</Heading>
        </HStack>
        <HStack mt="10" pr="30px" justifyContent="flex-end" alignItems="center" space={4}>
            <Text>Show: </Text>
            <Select variant="outline" defaultValue="subscriptions" onValueChange={(itemValue)=>setSelected(itemValue)} minWidth="100">
                <Select.Item label="Subscriptions" value="subscriptions" />
                <Select.Item label="Redemptions" value="redemptions" />
            </Select>
        </HStack>
        <VStack alignItems="center" mt="5">
            {select==='subscriptions' ? subHistory.map((sub:any,i:number)=>{
                return(
                    <Box bg="brand"borderRadius="2xl">
                        <Shadow radius={20} distance={10} paintInside={false}  startColor="#0000000c">
                            <VStack w="full" space="2" p="4" >
                                <Text>{(sub.time).toDate().toLocaleDateString('en-US',{ year: 'numeric', month: 'long', day: 'numeric' })}</Text>
                                <Heading fontWeight="600"size="sm">{sub.subscriptionTitle} from {sub.business}</Heading>
                                <HStack w="full">
                                    <Text flex="1">Total</Text>
                                    <Text>${sub.price}</Text>
                                </HStack>
                            </VStack>
                        </Shadow>
                    </Box>
                )
            }) :
            redHistory.map((red:any,i:number)=>{
                return(
                    <Box bg="brand"borderRadius="2xl">
                        <Shadow radius={20} distance={10} paintInside={false}  startColor="#0000000c">
                            <VStack w="full" space="2" p="4" >
                                <Text>{(red.time).toDate().toLocaleDateString('en-US',{ year: 'numeric', month: 'long', day: 'numeric' })}</Text>
                                <Heading fontWeight="600"size="sm">{red.subscriptionTitle} from {red.business}</Heading>
                                <HStack w="full">
                                    <Text flex="1">Requests:</Text>
                                    <Text color="#959897">{red.requests}</Text>
                                </HStack>
                                <HStack w="full">
                                    <Text flex="1">Ready by:</Text>
                                    <Text color="#959897">{(red.time).toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
                                </HStack>
                            </VStack>
                        </Shadow>
                    </Box>
                )
            }) }
        </VStack>
    </SafeAreaView>
  );
}