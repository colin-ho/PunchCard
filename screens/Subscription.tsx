import React,{useEffect,useState,useContext} from 'react'
import { Dimensions, TouchableOpacity, View} from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Input,Heading, Modal, Button, Box, Image, Flex,Text, VStack, HStack, TextArea, Icon, Spacer} from 'native-base';
import { SafeAreaView } from 'react-native-safe-area-context';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Ionicons from 'react-native-vector-icons/Ionicons'
import { Shadow } from 'react-native-shadow-2';
import Toast from 'react-native-toast-message';
import { AuthenticatedUserContext } from '../providers/AuthUserProvider';
import { STRIPE_KEY } from '@env';
import firestore,{ FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

function makeCode() {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < 5; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * 
 charactersLength));
   }
   return result;
}

const showToast = () => {
    Toast.show({
      type: 'success',
      text1: 'Subscription redeemed!',
      text2: 'We hope you enjoy your purchase 👋'
    });
  }
const screenWidth = Dimensions.get('window').width;
export default function Subscription({navigation,route}:any) {
    const {user,displayName,setNeedsLogin,favorites}:any = useContext(AuthenticatedUserContext)
    const [isPurchased,setIsPurchased] = useState(false)
    const [requests, setRequests] = useState('');
    const [date, setDate] = useState(new Date((new Date()).getTime() + 60000));
    const [timeError,setTimeError]= useState(false);
    const [showCodeOverlay,setShowCodeOverlay]= useState(false);
    const [showRedOverlay,setShowRedOverlay]= useState(false);
    const [redeeming,setRedeeming] = useState<boolean|null>(null);
    const [redemptionRef, setRedemptionRef] = useState<any>(null);
    const [code,setCode]=useState<number|null>(null);
    const [count,setCount] = useState(0);
    const [customerSide,setCustomerSide] = useState<any>(null);
    const [redeemedToday,setRedeemedToday] = useState<boolean|null>(null);
    const [loading,setLoading] = useState(false);
    const [cancelling,setCancelling] = useState(false);
    const subscription = route.params.subscription;

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

        let unsubscribe1:any,unsubscribe2:any,unsubscribe3:any,unsubscribe4:any;
        if(user){
            const query = firestore()
            .collection('businesses').doc(subscription.businessId)
            .collection('subscriptions').doc(subscription.id)

            unsubscribe1 = query.onSnapshot((snapshot:any)=>{
                setCount(snapshot?.data().redemptionCount);
            }, (err:any) => console.log(err));  

            const query2 = query.collection('customers').doc(user.uid)
            unsubscribe2 = query2.onSnapshot((snapshot:any)=>{
                setIsPurchased(snapshot.exists);
                if(snapshot.exists){
                    setRedeeming(snapshot.data().redeeming);
                    setCode(snapshot.data().code);
                }
            }, (err:any) => console.log(err));  

            const query3 = firestore().collection('customers').doc(user.uid).collection('subscribedTo').doc(subscription.id)
            unsubscribe4 = query3.onSnapshot((snapshot:any)=>{
                if(snapshot.exists){
                    const data = snapshot.data();
                    setCustomerSide(data);
                    var d = new Date();
                    d.setHours(0,0,0,0);
                    if(data.redeemedAt.length>0 && subscription.dayConstrain){
                        const lastRedeemed = (data.redeemedAt[data.redeemedAt.length-1]).toDate();
                        if(lastRedeemed.getTime()-d.getTime()>0){
                            setRedeemedToday(true)
                        } else{
                            setRedeemedToday(false)
                        }
                    } else{
                        setRedeemedToday(false)
                    }
                } else{
                    setCustomerSide(null);
                    setRedeemedToday(false);
                }
            }, (err:any) => console.log(err));  
             
        }
        if(redemptionRef){
            unsubscribe3 = redemptionRef.onSnapshot((snapshot:any)=>{
                let collected = snapshot?.data().collected;
                if(!collected){
                    setRedeeming(true)
                    setCode(snapshot?.data().code)
                } else{
                    setRedeeming(false);
                    setRedemptionRef(null);
                    setCode(null);
                } 
            },(err:any)=>console.log(err));
        }
        return ()=>{
            unsubscribe1?.();
            unsubscribe2?.();
            unsubscribe3?.();
            unsubscribe4?.();
        }
    }, [redemptionRef,subscription,user])
    
    
    const addCustomer = async () => {

        if(!user){
            setNeedsLogin(true);
        } else{
            setLoading(true);
            const subscriptionId = subscription.id;
            const item = {
            stripePriceId:subscription.stripePriceId,
            businessId:subscription.businessId,
            };
            try{
                const checkoutSession = await axios.post('https://lavalab.vercel.app/api/checkout', {
                    item,
                    customerId:user.uid,
                    subscriptionId:subscriptionId,
                    name:displayName,
                    title:subscription.title,
                    price:subscription.price,
                    business:subscription.businessName,
                });
                navigation.navigate('Checkout',{STRIPE_PUBLIC_KEY:STRIPE_KEY, CHECKOUT_SESSION_ID:checkoutSession.data.id});
                
            } catch(err){
                console.log(err)
            }
            setLoading(false);
        }
        
    };
    const redeem = async () => {
        if(date<new Date()) {
            setTimeError(true)
            return;
        }
        else {
            setTimeError(false)
        }
        setLoading(true);
        try{
            const subRef = firestore().collection('businesses').doc(subscription.businessId).collection('subscriptions').doc(subscription.id)
            const customerRef = subRef.collection('customers').doc(user.uid);
            const redemptionRef = subRef.collection('redemptions').doc((count+1).toString());
            const customer = firestore().collection('customers').doc(user.uid)
            const customerSub = customer.collection('subscribedTo').doc(subscription.id)
            const newHistory = firestore().collection('customers').doc(user.uid).collection('history').doc()
            const code = makeCode();
            const batch = firestore().batch();
            batch.update(customerRef, { redemptionCount: firestore.FieldValue.increment(1),redeeming:true,code:code,currentRef:redemptionRef});
            batch.update(subRef, { redemptionCount: firestore.FieldValue.increment(1)});
            batch.set(redemptionRef, { subscriptionId:subscription.id,requests:requests,collected:false,confirmed:false,collectBy:date,redeemedBy:displayName,redeemedById:user.uid,
                redeemedAt: firestore.FieldValue.serverTimestamp(),businessId:subscription.businessId,number:(count+1).toString(),code:code });
            batch.update(customerSub, { redemptionCount: firestore.FieldValue.increment(1),redeemedAt: firestore.FieldValue.arrayUnion(new Date()) });
            batch.set(newHistory,{type:'redemption',subscriptionTitle:subscription.title,business:subscription.businessName,time:date,requests:requests})
        
            await batch.commit();
            
            setRedemptionRef(redemptionRef);
            setShowRedOverlay(false);
            setLoading(false);
            showToast();
        }catch(err){
            console.log(err)
        }
      };

      const cancelSubscription = async () => {
          setCancelling(true);
        const customerSub = firestore().collection('customers').doc(user.uid).collection('subscribedTo').doc(subscription.id);
        const customerSubId= (await customerSub.get()).data()?.stripeSubscriptionId;
        const businessRef=firestore().collection('businesses').doc(subscription.businessId)
        const subRef = businessRef.collection('subscriptions').doc(subscription.id);
        const customerRef = subRef.collection('customers').doc(user.uid);
        try{
            const cancelStatus = await axios.post('https://lavalab.vercel.app/api/cancel', {
                userId:user.uid,stripeSubscriptionId :customerSubId,
              });
              console.log(cancelStatus.data.status)
              if(cancelStatus.data.status === 'canceled'){
                const batch = firestore().batch();
          
                batch.update(subRef, { customerCount: firestore.FieldValue.increment(-1) });
                batch.update(businessRef, { totalCustomers: firestore.FieldValue.increment(-1) });
                batch.delete(customerRef);
                batch.delete(customerSub);
          
                await batch.commit();
              }
        } catch(err){
            console.log(err);
        }
        setCancelling(false)
      };

      const onTimeChange = (event:any, selectedDate:any) => {
        const currentDate = selectedDate || date;
        if(currentDate<new Date()) setTimeError(true)
        else {
            setDate(currentDate);
            setTimeError(false)
        }
      };
    return (
        <SafeAreaView style={{flex:1}} edges={['top','right','left']}>
        <KeyboardAwareScrollView>
            <HStack justifyContent="center" alignItems="center" pl="10px" pr="30px" pt="20px">
                <Button variant="unstyled" onPress={()=>navigation.goBack()} leftIcon={<Icon as={Ionicons} name="chevron-back" size="sm" color="black" />}></Button>
                <Heading fontWeight="600" flex="1" size="md">{isPurchased ? "Redeem Subscription" : "Purchase Subscription"}</Heading>
            </HStack>
            <Box alignSelf="center" mt="20px" px="20px" borderRadius="2xl">
                <Shadow radius={20} distance={10} paintInside={false}  startColor="#0000000c">
                    <Box borderRadius="2xl" overflow="hidden" >
                        <Box>
                            {user ? <Button position="absolute" right="3" top="3" borderRadius="10" zIndex="1" variant="solid" colorScheme="brand" onPress={()=>fave(subscription.id,favorites.includes(subscription.id))}><Icon as={AntDesign} size="xs" color={favorites.includes(subscription.id) ?  "pink.500":"black" }name="heart"/></Button>:null}
                            <Image w ={screenWidth} h="150px" key={subscription.id} resizeMode="cover" src={subscription.photoURL} alt="Upload an image"/>
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
            {!isPurchased? 
            <Box bg="white" alignSelf="center" mt="30px" mb="30px"  borderRadius="2xl">
                <Shadow radius={15} distance={10} paintInside={false}  startColor="#0000000c">
                    <Box w={screenWidth-40} borderRadius="2xl" p="6" >
                        <Heading fontWeight="600" size="sm">What you get</Heading>
                        <Text >{subscription.description}</Text>
                    </Box>
                </Shadow>
            </Box>
            :
            <Box>
            <Box mt="30px" mx="20px">
                <Flex flexDirection="row" justify="space-between">
                    <Box  bg="white" borderRadius="2xl" >
                        <Shadow radius={15} distance={10} paintInside={false}  startColor="#0000000c">
                            <HStack w="160px" h="80px" alignItems="center" space="4" p="4">
                                {customerSide? <Text fontSize="xl" bold>{subscription.limit-customerSide.redemptionCount}</Text>:null}
                                <Text>Redemptions remaining</Text>
                            </HStack>
                        </Shadow>
                    </Box>
                    <Box bg="white"borderRadius="2xl">
                        <Shadow radius={15} distance={10} paintInside={false}  startColor="#0000000c">
                            <HStack w="160px" h="80px" alignItems="center"space="4" p="4">
                                {customerSide ? <Text fontSize="xl" bold>{
                                    subscription.interval === 'week' ? Math.floor(7-
                                ((new Date()).getTime() - customerSide.boughtAt.toDate().getTime())/ (1000 * 3600 * 24)):subscription.interval ==='month' ? 
                                Math.floor(31- ((new Date()).getTime() - customerSide.boughtAt.toDate().getTime())/ (1000 * 3600 * 24)):
                                Math.floor(365-((new Date()).getTime() - customerSide.boughtAt.toDate().getTime())/ (1000 * 3600 * 24))}</Text> :null}
                                <Text pr="20px">Days until renewal</Text>
                            </HStack>
                        </Shadow>
                    </Box>
                </Flex>
            </Box>
            <Box alignSelf="center" mt="30px" mb="30px" bg="white"borderRadius="2xl">
                    <Shadow radius={15} distance={10} paintInside={false}  startColor="#0000000c">
                        <Box w={screenWidth-40} p="6" >
                            <Heading size="sm" fontWeight="600">Restrictions</Heading>
                            {subscription.dayConstrain ? <Text>Limited to 1 redemption per day</Text> : null}
                            <Text>Cannot be combined with other offers, promotions, sales, or coupons</Text>
                        </Box>
                    </Shadow>
                </Box>
            </Box>
            }
            {!isPurchased ? 
            <TouchableOpacity onPress={addCustomer}>
                <Flex borderRadius="10px" h="70px" align="center" justify="center" mx="20px" bg="black">
                <Button disabled variant="unstyled" _loading={{bg: "black"}} _spinner={{color: "white"}} isLoading={loading}><Text fontSize="15px" color="brand.500">{loading ? "Redirecting to checkout..." : "Purchase subscription"}</Text></Button>
                </Flex>
            </TouchableOpacity>
            :
            <>
            {customerSide ? <TouchableOpacity onPress={()=>{!redeeming ? redeemedToday||subscription.limit-customerSide.redemptionCount<1 ? null: setShowRedOverlay(true) : setShowCodeOverlay(true)}}>
                <Flex borderRadius="10px" h="70px" align="center" justify="center" mx="20px" bg="black">
                    <Text fontSize="15px" color="brand.500">{redeeming ? "Redemption Code" : subscription.limit-customerSide.redemptionCount<1 ? "Redemption limit reached" : redeemedToday ? "Daily limit reached" : "Redeem"}</Text>
                </Flex>
            </TouchableOpacity> :null}
            {!redeeming? <TouchableOpacity onPress={cancelSubscription}>
                <Flex mt="20px" borderRadius="10px" h="70px" align="center" justify="center" mx="20px" bg="white">
                <Button disabled variant="unstyled" _loading={{bg: "white"}} _spinner={{color: "black"}} isLoading={cancelling}><Text fontSize="15px" color="brand.400">{cancelling ? "Cancelling..." : "Cancel subscription"}</Text></Button>
                </Flex>
            </TouchableOpacity>:null}
            </>
            }
            <Box h="30px"></Box>
            <RedOverlay subscription={subscription} redeem={redeem} showOverlay={showRedOverlay} setShowOverlay ={setShowRedOverlay} onTimeChange={onTimeChange}
            requests={requests} setRequests={setRequests} date={date} timeError={timeError} loading={loading}/>
            <CodeOverlay code={code} showOverlay={showCodeOverlay} setShowOverlay ={setShowCodeOverlay}/>
            </KeyboardAwareScrollView>
        </SafeAreaView>
    )
}

function CodeOverlay({code,showOverlay,setShowOverlay}:any){

    return(

        <Modal isOpen={showOverlay} onClose={() => setShowOverlay(false)}>
        <Modal.Content maxWidth="400px">
          <Modal.CloseButton />
          <Modal.Header>Redemption Code</Modal.Header>
          <Modal.Body>
            <Heading py="20px" textAlign="center">{code}</Heading>
          </Modal.Body>
        </Modal.Content>
      </Modal>
    )
}

function RedOverlay({subscription,redeem,showOverlay,setShowOverlay,onTimeChange,requests,setRequests,date,timeError,loading}:any){

    return(
        <Modal isOpen={showOverlay} onClose={() => setShowOverlay(false)}>
        <Modal.Content maxWidth="400px">
          <Modal.CloseButton />
          <Modal.Header>Confirm Redemption</Modal.Header>
          <Modal.Body>
            <Flex flexDirection="column" p="4">
                <Text bold fontSize="xl">{subscription.businessName}</Text>
                <HStack mt="10px" >
                    <Text flex="1">Your Subscription:</Text>
                    <Text>{subscription.title}</Text>
                </HStack>
                <VStack space={5} mt="20px">
                    <Text >Ready By</Text>
                    <Box marginTop="-50px">
                        <DateTimePicker testID="dateTimePicker"value={date} mode='time' is24Hour={true}
                        display="default" onChange={onTimeChange} minimumDate={new Date()}/>
                    </Box>
                    {timeError ? <Text fontSize={'sm'} color={'red.500'}>You cannot choose a time earlier than the current time</Text>:null}
                    <Box>
                        <TextArea placeholder="Leave a message..." p="4" borderRadius="xl" _focus={{borderColor:'black'}} value={requests} onChangeText={value => setRequests(value)}/>
                    </Box>
                    
                </VStack>
                {/*redeeming ? <Button onPress={()=>setShowOverlay(true)} >Show Redemption Code</Button> : null*/}
                <Button my="20px" borderRadius="10px" colorScheme="redeem" onPress={redeem} size="lg" isLoading={loading} disabled={timeError}>Submit</Button>
                <Button
                    variant="ghost"
                    colorScheme="redeem"
                    onPress={() => {
                    setShowOverlay(false)
                    }}
                >
                    Cancel
                </Button>
            </Flex>
          </Modal.Body>
        </Modal.Content>
      </Modal>
    
    )
}