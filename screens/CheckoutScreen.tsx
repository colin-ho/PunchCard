import { initPaymentSheet, presentPaymentSheet } from "@stripe/stripe-react-native";
import axios from "axios";
import { Box, Button, Divider, Flex, Heading, HStack, Icon, Image, ScrollView, Text } from "native-base";
import React, { useContext, useState } from "react";
import { Alert, Dimensions, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Shadow } from "react-native-shadow-2";
import { AuthenticatedUserContext, AuthenticatedUserContextInterface } from "../providers/AuthUserProvider";
import Ionicons from 'react-native-vector-icons/Ionicons'

const screenWidth = Dimensions.get('window').width;

export default function CheckoutScreen({ navigation, route }: any) {
    const { user, displayName, stripeCustomerId } = useContext<AuthenticatedUserContextInterface>(AuthenticatedUserContext)
    const subscription = route.params.subscription
    const [loading, setLoading] = useState(false)
    const [showNotes, setShowNotes] = useState(false)

    const openPaymentSheet = async () => {
        const { error } = await presentPaymentSheet();
        setLoading(false);
        if (error) {
            if (error.code === 'Failed') Alert.alert(`Error: ${error.code}`, error.message);
        } else {
            navigation.goBack()
            Alert.alert('Success', 'Your order is confirmed!');
        }
    };

    const addCustomer = async () => {
        if (user) {
            try {
                setLoading(true);
                const subCreateRes = await axios.post('https://lavalab.vercel.app/api/createSubscription', {
                    stripeCustomerId: stripeCustomerId,
                    priceId: subscription.stripePriceId,
                    metadata: {
                        customerId: user.uid,
                        subscriptionId: subscription.id,
                        name: displayName,
                        title: subscription.title,
                        price: subscription.price,
                        business: subscription.businessName,
                        businessId: subscription.businessId,
                    }
                })
                const { clientSecret } = subCreateRes.data

                const ephemeralData = await axios.post('https://lavalab.vercel.app/api/createEphemeral', {
                    customerId: stripeCustomerId,
                })

                const { ephemeralKey } = ephemeralData.data

                const { error } = await initPaymentSheet({
                    customerId: stripeCustomerId,
                    paymentIntentClientSecret: clientSecret,
                    customerEphemeralKeySecret: ephemeralKey,
                    merchantDisplayName: 'Example Inc.',
                });
                if (!error) {
                    await openPaymentSheet()
                } else throw error;

            } catch (err) {
                console.log(err)
            }
        }
    }
    return (
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'right', 'left',]}>
            <ScrollView>
                <HStack justifyContent="center" alignItems="center" pl="10px" pr="30px" pt="20px">
                    <Button variant="unstyled" onPress={() => navigation.goBack()} leftIcon={<Icon as={Ionicons} name="chevron-back" size="sm" color="black" />}></Button>
                    <Heading fontWeight="600" flex="1" size="md">Confirm Order</Heading>
                </HStack>
                <Box alignSelf="center" mt="20px" px="20px" borderRadius="2xl">
                    <Shadow radius={20} distance={10} paintInside={false} startColor="#0000000c">
                        <Box borderRadius="2xl" overflow="hidden" >
                            <Box>
                                <Image w={screenWidth} h="150px" key={subscription.id} resizeMode="cover" src={subscription.photoURL} alt="Upload an image" />
                            </Box>
                            <Flex flexDirection="column" p="6" bg="white">
                                <Text mb="5px" fontWeight="600">{subscription.title + " from " + subscription.businessName}</Text>
                                <Text>{subscription.dayConstrain ? "1" : subscription.limit ? subscription.limit : "10x "} {subscription.content ? subscription.content : "Hot Cappucino"} {subscription.dayConstrain ? "per Day " : ""}for ${subscription.price ? (Math.round(subscription.price * 100) / 100).toFixed(2) : 19.99}/{subscription.interval ? subscription.interval.charAt(0).toUpperCase() + subscription.interval.slice(1) : "Week"}</Text>
                            </Flex>
                        </Box>
                    </Shadow>
                </Box>
                <Box alignSelf="center" my="30px" bg="white" borderRadius="2xl">
                    <Shadow radius={15} distance={10} paintInside={false} startColor="#0000000c">
                        <Box w={screenWidth - 40} p="4" >
                            <HStack>
                                <Heading flex="1" size="sm" fontWeight="600">Things to note</Heading>
                                <TouchableOpacity onPress={()=>setShowNotes(!showNotes)}>
                                    <Icon as={Ionicons} name="chevron-down-circle" size="sm" color="black" />
                                </TouchableOpacity>
                            </HStack>
                            {showNotes ? <Box>
                                <Text mt="1" fontSize="13">• Renewals occur every 1 {subscription.interval}</Text>
                                <Text fontSize="13">• Invoices are billed to the card used on the initial</Text>
                                <Text fontSize="13">{"\u2002"} purchase</Text>
                                <Text fontSize="13">• Cancellations can be processed at anytime</Text>
                                <Text fontSize="13">• Refunds will not be issued</Text>
                            </Box> : null}
                        </Box>
                    </Shadow>
                </Box>
                <Box alignSelf="center" mb="30px" bg="white" borderRadius="2xl">
                    <Shadow radius={15} distance={10} paintInside={false} startColor="#0000000c">
                        <Box w={screenWidth - 40} p="4" >
                            <HStack>
                                <Text flex="1">Subtotal</Text>
                                <Text>${subscription.price}</Text>
                            </HStack>
                            <HStack>
                                <Text flex="1">Discounts and promos</Text>
                                <Text>$0</Text>
                            </HStack>
                            <Divider my="2" />
                            <HStack>
                                <Text fontWeight="600" fontSize="16" flex="1">Total</Text>
                                <Text fontWeight="600" fontSize="16">${subscription.price}</Text>
                            </HStack>
                        </Box>
                    </Shadow>
                </Box>

                <TouchableOpacity onPress={addCustomer}>
                    <Flex borderRadius="10px" h="70px"  mb="30" align="center" justify="center" mx="20px" bg="black">
                        <Button disabled variant="unstyled" _loading={{ bg: "black" }} _spinner={{ color: "white" }} isLoading={loading}><Text fontSize="15px" color="brand.500">{loading ? "Redirecting to checkout..." : "Purchase subscription"}</Text></Button>
                    </Flex>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    )
}
