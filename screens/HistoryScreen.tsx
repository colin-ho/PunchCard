import React, { useContext, useState, useEffect, } from 'react';
import { Box, Heading, Text, VStack, Button, Icon, HStack, Select, FlatList } from 'native-base';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons'
import { Shadow } from 'react-native-shadow-2';
import { AuthenticatedUserContext, AuthenticatedUserContextInterface } from '../providers/AuthUserProvider';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AccountStackParamList } from './AccountScreen';

type HistoryProps = NativeStackScreenProps<AccountStackParamList, 'History'>;


export const HistoryScreen: React.FC<HistoryProps> = ({ navigation }) => {
    const [subHistory, setSubHistory] = useState<FirebaseFirestoreTypes.DocumentData[]>([]);
    const [redHistory, setRedHistory] = useState<FirebaseFirestoreTypes.DocumentData[]>([]);
    const [lastRed, setLastRed] = useState<FirebaseFirestoreTypes.QueryDocumentSnapshot | null>(null);
    const [lastSub, setLastSub] = useState<FirebaseFirestoreTypes.QueryDocumentSnapshot | null>(null);
    const { user } = useContext<AuthenticatedUserContextInterface>(AuthenticatedUserContext)
    const [select, setSelected] = useState('subscriptions')

    const getHistory = async () => {
        const subQuery = firestore().collection('payments').where('customerId','==',user?.uid).orderBy('date','desc').limit(10)

        const redQuery = firestore().collection('redemptions').where('redeemedById','==',user?.uid).where('collected','==',true).orderBy('redeemedAt','desc').limit(10)
        
        const subs: FirebaseFirestoreTypes.DocumentData[] = [];
        const reds: FirebaseFirestoreTypes.DocumentData[] = [];

        let data = await Promise.all([subQuery.get(), redQuery.get()])
        data[0].docs.map((doc, index) => {
            subs.push(doc.data())
            if (index === data[0].docs.length - 1) {
                setLastSub(doc)
            }
        });
        data[1].docs.map((doc, index) => {
            reds.push(doc.data())
            if (index === data[1].docs.length - 1) {
                setLastRed(doc)
            }
        });
        
        setSubHistory(subs);
        setRedHistory(reds);
    }

    const getMoreSubHistory = async () => {
        const subQuery = firestore().collection('payments').where('customerId','==',user?.uid)
        .orderBy('date','desc').limit(10).startAfter(lastSub)

        let tempSubs: FirebaseFirestoreTypes.DocumentData[] = [];

        let data = (await subQuery.get())
        
        data.docs.map((doc, index) => {
            tempSubs.push(doc.data())
            if (index === data.docs.length - 1) {
                setLastSub(doc)
            }
        });
        
        setSubHistory([...subHistory, ...tempSubs]);
    }

    const getMoreRedHistory = async () => {
        const redQuery = firestore().collection('redemptions').where('redeemedById','==',user?.uid)
        .where('collected','==',true).orderBy('redeemedAt','desc').limit(10)
        .startAfter(lastRed)

        let tempReds: FirebaseFirestoreTypes.DocumentData[] = [];
        let data = await redQuery.get()

        data.docs.map((doc, index) => {
            tempReds.push(doc.data())
            if (index === data.docs.length - 1) {
                setLastRed(doc)
            }
        });

        setRedHistory([...redHistory, ...tempReds]);
    } 

    useEffect(() => {
        if (user) {
            getHistory();
        }
    }, [user])
    return (

        <SafeAreaView style={{ flex: 1 }} edges={['top', 'right', 'left']}>
            <HStack alignItems="center" pl="10px" pr="30px" pt="20px">
                <Button variant="unstyled" onPress={() => navigation.goBack()} leftIcon={<Icon as={Ionicons} name="chevron-back" size="sm" color="black" />}></Button>
                <Heading fontWeight="600" flex="1" size="md">History</Heading>
            </HStack>
            <HStack mt="10" pr="30px" justifyContent="flex-end" alignItems="center" space={4}>
                <Text>Show: </Text>
                <Shadow radius={10} distance={10} paintInside={false} startColor="#00000008">
                    <Select variant="outline" defaultValue="subscriptions" onValueChange={(itemValue) => setSelected(itemValue)} minWidth="100">
                        <Select.Item label="Subscriptions" value="subscriptions" />
                        <Select.Item label="Redemptions" value="redemptions" />
                    </Select>
                </Shadow>
            </HStack>
            <VStack alignItems="center" mt="5">
                {select === 'subscriptions' ?
                    <FlatList initialNumToRender={5} w="full" mb="133px" showsVerticalScrollIndicator={false} data={subHistory} renderItem={({ item }) =>
                        <Box bg="brand" borderRadius="2xl" mt="5" mb="5" mx="5">
                            <Shadow radius={20} distance={10} paintInside={false} startColor="#0000000c">
                                <VStack w="full" space="2" p="4" >
                                    <Text>{(item.date).toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</Text>
                                    <Heading fontWeight="600" size="sm">{item.subscriptionTitle} from {item.businessName}</Heading>
                                    <HStack w="full">
                                        <Text flex="1">Payment reason:</Text>
                                        <Text color="#959897">{item.reason === 'subscription_create' ? "Subscription purchase" : "Subscription renewal"}</Text>
                                    </HStack>
                                    <HStack w="full">
                                        <Text flex="1">Total:</Text>
                                        <Text color="#959897">${item.amountPaid}</Text>
                                    </HStack>
                                </VStack>
                            </Shadow>
                        </Box>
                    } keyExtractor={(item, index) => index.toString()} onEndReached={getMoreSubHistory} />
                    :
                    <FlatList w="full" initialNumToRender={5} mb="133px" showsVerticalScrollIndicator={false} data={redHistory} renderItem={({ item }) =>
                        <Box bg="brand" borderRadius="2xl" mt="5" mb="5" mx="5">
                            <Shadow radius={20} distance={10} paintInside={false} startColor="#0000000c">
                                <VStack w="full" space="2" p="4" >
                                    <Text>{(item.redeemedAt).toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</Text>
                                    <Heading fontWeight="600" size="sm">{item.subscriptionTitle} from {item.businessName}</Heading>
                                    <HStack w="full">
                                        <Text flex="1">Requests:</Text>
                                        <Text color="#959897">{item.requests}</Text>
                                    </HStack>
                                    <HStack w="full">
                                        <Text flex="1">Ready by:</Text>
                                        <Text color="#959897">{(item.collectBy).toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                                    </HStack>
                                </VStack>
                            </Shadow>
                        </Box>

                    } keyExtractor={(item, index) => index.toString()} onEndReached={getMoreRedHistory}/>
                }
            </VStack>
        </SafeAreaView>
    );
}