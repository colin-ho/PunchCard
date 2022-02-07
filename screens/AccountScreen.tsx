import { Box, Flex, Heading, HStack, Icon, Text, VStack } from 'native-base'
import React, { useContext, useEffect } from 'react'
import auth from '@react-native-firebase/auth';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons';
import { Shadow } from 'react-native-shadow-2';
import { TouchableOpacity } from 'react-native';
import { AuthenticatedUserContext, AuthenticatedUserContextInterface } from '../providers/AuthUserProvider';
import { createNativeStackNavigator, NativeStackScreenProps } from '@react-navigation/native-stack';
import { HistoryScreen } from './HistoryScreen';

export type AccountStackParamList = {
    AccountOverview: undefined;
    History: undefined;
};

const Stack = createNativeStackNavigator<AccountStackParamList>();

export const AccountScreen: React.FC = () => {

    return (
        <Stack.Navigator>
            <Stack.Screen name='AccountOverview' component={AccountOverview} options={{ headerShown: false }} />
            <Stack.Screen name='History' component={HistoryScreen} options={{ headerShown: false }} />
        </Stack.Navigator>

    )
}

type AccountOverviewProps = NativeStackScreenProps<AccountStackParamList, 'AccountOverview'>;

const AccountOverview: React.FC<AccountOverviewProps> = ({ navigation }) => {
    const { user, setNeedsLogin, displayName } = useContext<AuthenticatedUserContextInterface>(AuthenticatedUserContext)

    useEffect(() => {
        if (!user && setNeedsLogin) {
            setNeedsLogin(true)
        }
    }, [])
    const handleLogout = () => {
        auth().signOut().catch(error => console.log('Error logging out: ', error));
        if (setNeedsLogin) setNeedsLogin(true)
    };
    return (
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'right', 'left']}>
            {user ?
                <VStack space={8} p="20px">
                    <Box>
                        <Heading fontWeight="600" size="xl">Account</Heading>
                        <Text>Your profile</Text>
                    </Box>
                    <Flex flexDirection="row" justify="space-between">
                        <TouchableOpacity onPress={() => navigation.navigate('History')}>
                            <Box bg="brand" borderRadius="2xl"  >
                                <Shadow radius={20} distance={10} paintInside={false} startColor="#0000000c">
                                    <HStack w="160px" h="80px" alignItems="center" space="4" p="4">
                                        <Icon as={SimpleLineIcons} name="drawer" />
                                        <Text>History</Text>
                                    </HStack>
                                </Shadow>
                            </Box>
                        </TouchableOpacity>
                        <Box bg="brand" borderRadius="2xl">
                            <Shadow radius={20} distance={10} paintInside={false} startColor="#0000000c">
                                <HStack w="160px" h="80px" alignItems="center" space="4" p="4">
                                    <Icon as={MaterialIcons} name="card-giftcard" />
                                    <Text>Promos</Text>
                                </HStack>
                            </Shadow>
                        </Box>
                    </Flex>
                    <Box bg="brand" borderRadius="2xl">
                        <Shadow radius={20} distance={10} paintInside={false} startColor="#0000000c">
                            <VStack w="full" space="4" p="4" py="20px">
                                <HStack w="full">
                                    <Heading fontWeight="600" flex="1" size="sm">Your profile</Heading>
                                </HStack>
                                <HStack w="full">
                                    <Text flex="1">Name</Text>
                                    <Text color="#959897">{displayName}</Text>
                                </HStack>
                                <HStack w="full">
                                    <Text flex="1">Email</Text>
                                    <Text color="#959897">{user.email}</Text>
                                </HStack>
                            </VStack>
                        </Shadow>
                    </Box>
                    <TouchableOpacity onPress={handleLogout}>
                        <Flex borderRadius="10px" h="70px" align="center" justify="center" bg="brand.400">
                            <Text fontSize="15px" color="brand.500">Log out</Text>
                        </Flex>
                    </TouchableOpacity>
                </VStack> : null}
        </SafeAreaView>

    )
}