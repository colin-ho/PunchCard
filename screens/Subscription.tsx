import React, { useEffect, useState, useContext } from 'react'
import { Alert, Dimensions, TouchableOpacity, View } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Input, Heading, Modal, Button, Box, Image, Flex, Text, VStack, HStack, TextArea, Icon, Spacer, Switch } from 'native-base';
import { SafeAreaView } from 'react-native-safe-area-context';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Ionicons from 'react-native-vector-icons/Ionicons'
import { Shadow } from 'react-native-shadow-2';
import Toast from 'react-native-toast-message';
import { AuthenticatedUserContext, AuthenticatedUserContextInterface } from '../providers/AuthUserProvider';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { Fave } from '../utils/Fave';
import { BusinessContext, BusinessContextInterface } from '../providers/BusinessContextProvider';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BrowseStackParamList } from './BrowseScreen';
import { HomeStackParamList } from './HomeScreen';
import { SubscriptionsStackParamList } from './SubscriptionsScreen';

function makeCode() {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < 5; i++) {
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
const geofire = require('geofire-common');

type firstProps = CompositeScreenProps<
    NativeStackScreenProps<BrowseStackParamList, 'Subscription'>,
    NativeStackScreenProps<HomeStackParamList, 'Subscription'>
>

type secondProps = CompositeScreenProps<firstProps, NativeStackScreenProps<SubscriptionsStackParamList, 'Subscription'>>;

export default function Subscription({ navigation, route }: secondProps) {
    const { user, displayName, favorites, redeeming, subscribedTo, stripeCustomerId } = useContext<AuthenticatedUserContextInterface>(AuthenticatedUserContext)
    const { location } = useContext<BusinessContextInterface>(BusinessContext);
    const [isPurchased, setIsPurchased] = useState(false)
    const [isRedeeming, setIsRedeeming] = useState<boolean | null>(null);
    const [requests, setRequests] = useState('');
    const [date, setDate] = useState(new Date());
    const [error, setError] = useState("");
    const [showCodeOverlay, setShowCodeOverlay] = useState(false);
    const [showRedOverlay, setShowRedOverlay] = useState(false);
    const [showCancelOverlay, setShowCancelOverlay] = useState(false);
    const [code, setCode] = useState<number | null>(null);
    const [customerSide, setCustomerSide] = useState<FirebaseFirestoreTypes.DocumentData | undefined | null>(null);
    const [redeemedToday, setRedeemedToday] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [delay, setDelay] = useState(0);
    const [open, setOpen] = useState(true);
    const [hours, setHours] = useState({ open: 0, close: 0 });
    const [outOfRange, setOutOfRange] = useState(false);
    const [orderAhead, setOrderAhead] = useState(false)
    const subscription = route.params.subscription;

    useEffect(() => {
        if (redeeming && redeeming.length > 0) {
            for (let i = 0; i < redeeming.length; i++) {
                if (redeeming[i].subscriptionId === subscription.id) {
                    setIsRedeeming(true)
                    setCode(redeeming[i].code)
                    break;
                }
            }
        } else {
            setIsRedeeming(false)
        }
    }, [redeeming])

    useEffect(() => {
        if (user) {
            if (subscribedTo && subscribedTo.length > 0) {
                let i = 0
                for (i; i < subscribedTo.length; i++) {
                    if (subscription.id === subscribedTo[i].subscriptionId) {
                        setIsPurchased(true);
                        setCustomerSide(subscribedTo[i])
                        let d = new Date();
                        d.setHours(0, 0, 0, 0);
                        if (subscribedTo[i].lastRedeemed && subscription.dayConstrain) {
                            const lastRedeemed = (subscribedTo[i].lastRedeemed).toDate();
                            setRedeemedToday(lastRedeemed.getTime() - d.getTime() > 0)
                        } else {
                            setRedeemedToday(false)
                        }
                        break;
                    }
                }
                if (i === subscribedTo.length) {
                    setIsPurchased(false);
                    setCustomerSide(null)
                }
            } else {
                setIsPurchased(false);
                setCustomerSide(null)
            }
        }
    }, [user, subscribedTo, subscription])

    useEffect(() => {

        let businessListener: () => void;
        const businessQuery = firestore()
            .collection('businesses').doc(subscription.businessId);

        businessListener = businessQuery.onSnapshot((snapshot: FirebaseFirestoreTypes.DocumentSnapshot) => {
            if (snapshot.exists) {
                setDelay(snapshot.data()?.delay);
                setDate(new Date((new Date()).getTime() + (parseInt(snapshot.data()?.delay)+10) * 60000))
                let times = snapshot.data()?.times;
                let hours = null;
                const today = new Date()
                snapshot.data()?.closures.forEach((closure: any) => {
                    if (today.getUTCDate() >= (new Date(closure.from)).getUTCDate() || today.getUTCDate() <= (new Date(closure.to)).getUTCDate()) {
                        hours = closure.hours;
                    }
                })
                if (hours == null) {
                    const day = today.getDay();
                    if (day === 0) hours = times.sun;
                    else if (day === 1) hours = times.mon;
                    else if (day === 2) hours = times.tue;
                    else if (day === 3) hours = times.wed
                    else if (day === 4) hours = times.thu;
                    else if (day === 5) hours = times.fri;
                    else if (day === 6) hours = times.sat;
                }
                const open = parseInt(hours.open.hr + hours.open.min);
                const close = parseInt(hours.close.hr + hours.close.min);
                const now = today.getHours() * 100 + today.getMinutes();
                setOpen(now > open && now < close && !snapshot.data()?.paused);
                setHours({ open: open, close: close });
                const center = [location?.latitude, location?.longitude];
                const radiusInM = 20 * 1000;
                const distanceInKm = geofire.distanceBetween([snapshot.data()?.lat, snapshot.data()?.lng], center);
                const distanceInM = distanceInKm * 1000;
                if (distanceInM > radiusInM) {
                    setOutOfRange(true);
                }
            }
        })

        return () => {
            businessListener?.();
        }
    }, [subscription, user, subscribedTo])

    const goToCheckout = async () => {
        navigation.navigate('Checkout', { subscription: subscription })
    };
    const redeem = async () => {

        const now = new Date();
        if (date < now) {
            setError("You cannot choose a time earlier than the current time")
            return;
        }
        else if (!open || (date.getHours() * 100 + date.getMinutes()) < hours.open || (date.getHours() * 100 + date.getMinutes()) > hours.close) {
            setError("Store is closed")
            return;
        }
        else if (outOfRange) {

            setError("You are too far away to redeem")
            return;
        }
        else setError("");
        setLoading(true);

        try {
            const subRef = firestore().collection('subscriptions').doc(subscription.id)
            const redemptionRef = firestore().collection('redemptions').doc();
            const subscribedToRef = firestore().collection('subscribedTo').doc(subscribedTo?.filter((item) => item.subscriptionId === subscription.id)[0].stripeSubscriptionId)

            const batch = firestore().batch();
            batch.update(subRef, { redemptionCount: firestore.FieldValue.increment(1) });
            batch.set(redemptionRef, {
                subscriptionId: subscription.id, requests: requests, collected: false, confirmed: false, collectBy: orderAhead ? date : new Date((new Date()).getTime() + delay*60000), redeemedBy: displayName, redeemedById: user?.uid,
                redeemedAt: firestore.FieldValue.serverTimestamp(), businessId: subscription.businessId, id: redemptionRef.id, code: makeCode(),
                businessName: subscription.businessName, subscriptionTitle: subscription.title,orderAhead:orderAhead,ready:false
            });
            batch.set(subscribedToRef, { redemptionCount: firestore.FieldValue.increment(1), lastRedeemed: firestore.FieldValue.serverTimestamp() }, { merge: true });
            await batch.commit();

            setShowRedOverlay(false);
            setLoading(false);
            showToast();
        } catch (err) {
            console.log(err)
        }
    };

    const cancelSubscription = async () => {
        setCancelling(true);
        const stripeSubscriptionId = subscribedTo?.filter((item) => item.subscriptionId === subscription.id)[0].stripeSubscriptionId
        const subscribedToRef = firestore().collection('subscribedTo').doc(stripeSubscriptionId);
        try {
            const cancelStatus = await axios.post('https://lavalab.vercel.app/api/cancel', {
                stripeSubscriptionId: stripeSubscriptionId,
            });
            if (cancelStatus.data.status === 'canceled') {
                await subscribedToRef.update({ status: 'canceled' })
            }
        } catch (err) {
            console.log(err);
        }
        setCancelling(false)
        setShowCancelOverlay(false)
    };

    const onTimeChange = (event: any, selectedDate: any) => {
        const currentDate = selectedDate || date;
        if (currentDate < new Date()) setError("You cannot choose a time earlier than the current time")
        else {
            setDate(currentDate);
            setError("")
        }
    };
    return (
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'right', 'left']}>
            <KeyboardAwareScrollView>
                <HStack justifyContent="center" alignItems="center" pl="10px" pr="30px" pt="20px">
                    <Button variant="unstyled" onPress={() => navigation.goBack()} leftIcon={<Icon as={Ionicons} name="chevron-back" size="sm" color="black" />}></Button>
                    <Heading fontWeight="600" flex="1" size="md">{isPurchased ? "Redeem Subscription" : "Purchase Subscription"}</Heading>
                </HStack>
                <Box alignSelf="center" mt="20px" px="20px" borderRadius="2xl">
                    <Shadow radius={20} distance={10} paintInside={false} startColor="#0000000c">
                        <Box borderRadius="2xl" overflow="hidden" >
                            <Box>
                                {user ? <Button position="absolute" right="3" top="3" borderRadius="10" zIndex="1" variant="solid" colorScheme="brand" onPress={() => favorites ? Fave(subscription.id, favorites.includes(subscription.id), user) : null}><Icon as={AntDesign} size="xs" color={favorites?.includes(subscription.id) ? "pink.500" : "black"} name="heart" /></Button> : null}
                                <Image w={screenWidth} h="150px" key={subscription.id} resizeMode="cover" src={subscription.photoURL} alt="Upload an image" />
                            </Box>
                            <Flex flexDirection="column" p="6" bg="white">
                                <HStack space="3" mb="5px">
                                    {!open ?
                                        <Flex borderRadius="5px" px="10px" py="5px" align="center" justify="center" bg="brand.800">
                                            <Text fontSize="12px" color="black">Closed</Text>
                                        </Flex> : null}
                                    {subscription.redemptionCount > 2 ?
                                        <Flex borderRadius="5px" px="10px" py="5px" align="center" justify="center" bg="brand.100">
                                            <Text fontSize="12px" color="black">Popular</Text>
                                        </Flex> : null}
                                    <Flex borderRadius="5px" px="10px" py="5px" align="center" justify="center" bg="brand.300">
                                        <Text fontSize="12px" color="black">{subscription.businessType.charAt(0).toUpperCase() + subscription.businessType.slice(1)}</Text>
                                    </Flex>
                                </HStack>
                                <Text my="5px" fontWeight="600">{subscription.title + " from " + subscription.businessName}</Text>
                                <Text>{subscription.dayConstrain ? "1" : subscription.limit ? subscription.limit : "10x "} {subscription.content ? subscription.content : "Hot Cappucino"} {subscription.dayConstrain ? "per Day " : ""}for ${subscription.price ? (Math.round(subscription.price * 100) / 100).toFixed(2) : 19.99}/{subscription.interval ? subscription.interval.charAt(0).toUpperCase() + subscription.interval.slice(1) : "Week"}</Text>
                            </Flex>
                        </Box>
                    </Shadow>
                </Box>
                {!isPurchased ?
                    <Box>
                        <Box bg="white" alignSelf="center" mt="20px" mb="20px" borderRadius="2xl">
                            <Shadow radius={15} distance={10} paintInside={false} startColor="#0000000c">
                                <Box w={screenWidth - 40} borderRadius="2xl" p="4" >
                                    <Heading fontWeight="600" size="sm">What you get</Heading>
                                    <Text >{subscription.description}</Text>
                                </Box>
                            </Shadow>
                        </Box>
                        <Box bg="white" alignSelf="center" mb="20px" borderRadius="2xl">
                            <Shadow radius={15} distance={10} paintInside={false} startColor="#0000000c">
                                <Box w={screenWidth - 40} borderRadius="2xl" p="4" >
                                    <Heading fontWeight="600" size="sm">Subscribe and save</Heading>
                                    <Text>Save 10% of all your one time purchases by subscribing to {subscription.title}</Text>
                                </Box>
                            </Shadow>
                        </Box>
                    </Box>
                    :
                    <Box>
                        <Box mt="20px" mx="20px">
                            <Flex flexDirection="row" justify="space-between">
                                <Box bg="white" borderRadius="2xl" >
                                    <Shadow radius={15} distance={10} paintInside={false} startColor="#0000000c">
                                        <HStack w="160px" h="80px" alignItems="center" space="4" p="4">
                                            {customerSide ? <Text fontSize="xl" bold>{subscription.limit - customerSide.redemptionCount}</Text> : null}
                                            <Text>Redemptions remaining</Text>
                                        </HStack>
                                    </Shadow>
                                </Box>
                                <Box bg="white" borderRadius="2xl">
                                    <Shadow radius={15} distance={10} paintInside={false} startColor="#0000000c">
                                        <HStack w="160px" h="80px" alignItems="center" space="4" p="4">
                                            {customerSide ? <Text fontSize="xl" bold>{Math.max(Math.round((customerSide.end.toDate().getTime() - (new Date()).getTime()) / (1000 * 3600 * 24)), 0)}</Text> : null}
                                            <Text pr="20px">Days until renewal</Text>
                                        </HStack>
                                    </Shadow>
                                </Box>
                            </Flex>
                        </Box>
                        <Box alignSelf="center" mt="20px" mb="20px" bg="white" borderRadius="2xl">
                            <Shadow radius={15} distance={10} paintInside={false} startColor="#0000000c">
                                <Box w={screenWidth - 40} p="4" >
                                    <Heading size="sm" fontWeight="600">Restrictions</Heading>
                                    {subscription.dayConstrain ? <Text>Limited to 1 redemption per day</Text> : null}
                                    <Text>Cannot be combined with other offers, promotions, sales, or coupons</Text>
                                </Box>
                            </Shadow>
                        </Box>
                    </Box>
                }
                {!isPurchased ?
                    <TouchableOpacity onPress={goToCheckout}>
                        <Flex borderRadius="10px" h="70px" align="center" justify="center" mx="20px" bg="black">
                            <Button disabled variant="unstyled" ><Text fontSize="15px" color="brand.500">Go to checkout</Text></Button>
                        </Flex>
                    </TouchableOpacity>
                    :
                    <>
                        {(customerSide ? <TouchableOpacity onPress={() => {
                            open ?
                                !isRedeeming ?
                                    redeemedToday || subscription.limit - customerSide.redemptionCount < 1 || Math.round((customerSide.end.toDate().getTime() - (new Date()).getTime()) / (1000 * 3600 * 24)) <= -1 ?
                                        null : setShowRedOverlay(true) : setShowCodeOverlay(true) : null
                        }}>
                            <Flex borderRadius="10px" h="70px" align="center" justify="center" mx="20px" bg="black">
                                <Text fontSize="15px" color="brand.500">{isRedeeming ? "Redemption Code" : Math.round((customerSide.end.toDate().getTime() - (new Date()).getTime()) / (1000 * 3600 * 24)) <= -1 ? "Subscription expired" : subscription.limit - customerSide.redemptionCount < 1 ? "Redemption limit reached" : redeemedToday ? "Daily limit reached" : open ? "Redeem" : "Store is Closed"}</Text>
                            </Flex>
                        </TouchableOpacity> : null)}
                        {!isRedeeming ? <TouchableOpacity onPress={() => setShowCancelOverlay(true)}>
                            <Flex mt="20px" borderRadius="10px" h="70px" align="center" justify="center" mx="20px" bg="white">
                                <Button disabled variant="unstyled"><Text fontSize="15px" color="brand.400">Cancel subscription</Text></Button>
                            </Flex>
                        </TouchableOpacity> : null}
                    </>
                }
                <Box h="30px"></Box>
                <RedOverlay subscription={subscription} redeem={redeem} showOverlay={showRedOverlay} setShowOverlay={setShowRedOverlay} onTimeChange={onTimeChange}
                    requests={requests} setRequests={setRequests} date={date} error={error} loading={loading} delay={delay} outOfRange={outOfRange} orderAhead={orderAhead} setOrderAhead={setOrderAhead}/>
                <CodeOverlay code={code} showOverlay={showCodeOverlay} setShowOverlay={setShowCodeOverlay} />
                <CancelOverlay cancel={cancelSubscription} showOverlay={showCancelOverlay} setShowOverlay={setShowCancelOverlay} loading={cancelling} redemptions={customerSide ? subscription.limit - customerSide.redemptionCount : 0}
                    days={customerSide ? Math.max(Math.round((customerSide.end.toDate().getTime() - (new Date()).getTime()) / (1000 * 3600 * 24)), 0) : 0} />
            </KeyboardAwareScrollView>
        </SafeAreaView>
    )
}

function CodeOverlay({ code, showOverlay, setShowOverlay }: any) {

    return (

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

function RedOverlay({ subscription, redeem, showOverlay, setShowOverlay, onTimeChange, requests, setRequests, date, error, loading, delay,orderAhead,setOrderAhead }: any) {

    return (
        <Modal isOpen={showOverlay} onClose={() => setShowOverlay(false)}>
            <Modal.Content maxWidth="400px">
                <Modal.CloseButton />
                <Modal.Header>Confirm Redemption</Modal.Header>
                <Modal.Body>
                    <VStack p="4">
                        <Text fontSize="xl" fontWeight={500}>{subscription.title} from </Text>
                        <Text fontSize="xl" fontWeight={500}>{subscription.businessName}</Text>
                        <VStack space={5} mt="20px">
                            <HStack alignItems="center" justifyContent="space-between" marginBottom="10px">
                                <Text>Order Now</Text>
                                <Switch isChecked={orderAhead} onToggle={() => setOrderAhead(!orderAhead)}></Switch>
                                <Text>Order Ahead</Text>
                            </HStack>
                            {orderAhead ?
                                <>
                                    <Box>
                                        <Text >Ready By</Text>
                                        <Text color="#959897">Min {parseInt(delay)+10} mins</Text>
                                    </Box>
                                    
                                    <Box marginTop="-40px" marginBottom="20px">
                                        <DateTimePicker testID="dateTimePicker" value={date} mode='time' is24Hour={true}
                                            display="default" onChange={onTimeChange} minimumDate={new Date((new Date()).getTime() + (parseInt(delay)+10) * 60000)} />
                                    </Box>
                                </> :
                                <HStack justifyContent="space-between">
                                    <Text>Estimated waiting time: </Text>
                                    <Text color="#959897">{delay} mins</Text>
                                </HStack>
                            }
                            <HStack justifyContent="space-between">
                                <Text>Your order: </Text>
                                <Text color="#959897">1 {subscription.content}</Text>
                            </HStack>
                            <Box>
                                <TextArea placeholder="Leave a message..." p="4" borderRadius="xl" _focus={{ borderColor: 'black' }} value={requests} onChangeText={value => setRequests(value)} />
                            </Box>
                            {error ? <Text fontSize={'sm'} color={'brand.800'}>{error}</Text> : null}
                        </VStack>
                        <Button my="20px" borderRadius="10px" colorScheme="redeem" onPress={redeem} size="lg" isLoading={loading} disabled={error}>Submit</Button>
                        <Button
                            variant="unstyled"
                            onPress={() => {
                                setShowOverlay(false)
                            }}
                        >
                            Cancel
                        </Button>
                    </VStack>
                </Modal.Body>
            </Modal.Content>
        </Modal>

    )
}

function CancelOverlay({ cancel, showOverlay, setShowOverlay, loading, days, redemptions }: any) {

    return (
        <Modal isOpen={showOverlay} onClose={() => setShowOverlay(false)}>
            <Modal.Content maxWidth="400px">
                <Modal.CloseButton />
                <Modal.Header>Cancel Subscription</Modal.Header>
                <Modal.Body>
                    <Flex flexDirection="column" p="4">
                        <Text bold fontSize="md">Are you sure you want to cancel your subscription?</Text>
                        <Text mt="2">You still have {days} days left to enjoy your {redemptions} remaining redemptions!</Text>
                        <Button my="20px" borderRadius="10px" colorScheme="redeem" size="md" onPress={() => setShowOverlay(!showOverlay)}>Keep my subscription</Button>
                        <Button
                            variant="unstyled"
                            onPress={cancel} isLoading={loading}
                            _loading={{ bg: "white" }} _spinner={{ color: "brand.800" }}
                        >
                            <Text color="brand.800">Cancel</Text>
                        </Button>
                    </Flex>
                </Modal.Body>
            </Modal.Content>
        </Modal>

    )
}