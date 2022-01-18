import { Box, Flex, Heading, Image, Text } from "native-base"
import { SafeAreaView } from "react-native-safe-area-context"
import { Images } from "../config"
import React, { useContext } from 'react'
import { Dimensions, TouchableOpacity, StyleSheet } from "react-native";
import { Shadow } from 'react-native-shadow-2';
import { Button } from "../components";
import { AuthenticatedUserContext } from "../providers/AuthUserProvider";

const screenWidth = Dimensions.get('window').width;
export const LandingScreen =({navigation}:any)=>{
    const {setNeedsLogin}:any = useContext(AuthenticatedUserContext)
    return(
        <Flex flexDirection="column"  justify="center" alignItems="center">
        <Image source={Images.landing} alt=" " mt="-100px" resizeMode="contain" w={screenWidth}/>
        <Image source={Images.icon}mt="-30px" resizeMode="contain" alt=" " size="sm"/>
        <Text fontSize="2xl" fontWeight="500" mt="20px"textAlign="center">Subscribe and save to your favorite local businesses</Text>
        <TouchableOpacity onPress={()=>navigation.navigate('Signup')}>
            <Box mt="20px">
                <Shadow radius={20} distance={30} paintInside={false}  startColor="#0000000c">
                <Flex w={screenWidth-30} borderRadius="10px" h="70px" align="center" justify="center" bg="black">
                    <Text fontSize="15px" color="brand.500">Join Us</Text>
                </Flex>
                </Shadow>
            </Box>
        </TouchableOpacity>
        <TouchableOpacity onPress={()=>navigation.navigate('Login')}>
            <Box mt="20px">
            <Shadow radius={20} distance={30} paintInside={false}  startColor="#0000000c">
            <Flex w={screenWidth-30} borderRadius="10px" h="70px" align="center" justify="center" bg="white">
                <Text fontSize="15px" color="brand.400">Login</Text>
            </Flex>
            </Shadow>
            </Box>
        </TouchableOpacity>
        <Button
            style={styles.borderlessButtonContainer}
            borderless
            title={'Go back to app'}
            onPress={() => setNeedsLogin(false)}
          />
        </Flex>
        
    )
}
const styles = StyleSheet.create({
    borderlessButtonContainer: {
      marginTop: 16,
      alignItems: 'center',
      justifyContent: 'center',
    }
  });
  