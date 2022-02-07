import React, { useContext, useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import { Formik } from 'formik';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { View, TextInput, Logo, Button, FormErrorMessage } from '../components';
import { Images, Colors } from '../config';
import { AuthenticatedUserContext } from '../providers/AuthUserProvider';
import { useTogglePasswordVisibility } from '../utils/useTogglePasswordVisibility';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import axios from 'axios';
import { signupValidationSchema } from '../utils';

export const SignupScreen = ({ navigation }: any) => {
    const [isLoading, setIsLoading] = useState(false)
    const [errorState, setErrorState] = useState('');
    const { setNeedsLogin }: any = useContext(AuthenticatedUserContext)
    const {
        passwordVisibility,
        handlePasswordVisibility,
        rightIcon,
        handleConfirmPasswordVisibility,
        confirmPasswordIcon,
        confirmPasswordVisibility
    } = useTogglePasswordVisibility();

    const handleSignup = async (values: any) => {

        try {
            const { email, password, name } = values;
            setIsLoading(true);
            const {user} = await auth().createUserWithEmailAndPassword(email, password)
            const userDoc = firestore().collection('customers').doc(user.uid);
            const { exists } = await userDoc.get();
            if (!exists) {
                const res = await axios.post('https://lavalab.vercel.app/api/createCustomer', {
                    userId: user.uid,
                    email: email,
                    name: name
                });
                userDoc.set({ uid: user.uid, displayName: name, email: email, stripeCustomerId: res.data.customer.id, favorites: [] });
            }
            setIsLoading(false);
            setNeedsLogin(false);
        }
        catch (err:any) {
            console.log(err)
            setErrorState(err.message)
        }

    };

    return (
        <View isSafe style={styles.container}>
            <KeyboardAwareScrollView enableOnAndroid={true}>
                {/* LogoContainer: consits app logo and screen title */}
                <View style={styles.logoContainer}>
                    <Logo uri={Images.logo} />
                    <Text style={styles.screenTitle}>Create a new account!</Text>
                </View>
                {/* Formik Wrapper */}
                <Formik
                    initialValues={{
                        email: '',
                        password: '',
                        confirmPassword: '',
                        name: '',
                    }}
                    validationSchema={signupValidationSchema}
                    onSubmit={values => handleSignup(values)}
                >
                    {({
                        values,
                        touched,
                        errors,
                        handleChange,
                        handleSubmit,
                        handleBlur
                    }) => (
                        <>
                            {/* Input fields */}
                            <TextInput
                                name='email'
                                leftIconName='email'
                                placeholder='Enter email'
                                autoCapitalize='none'
                                keyboardType='email-address'
                                textContentType='emailAddress'
                                value={values.email}
                                onChangeText={handleChange('email')}
                                onBlur={handleBlur('email')}
                            />
                            <FormErrorMessage error={errors.email} visible={touched.email} />
                            <TextInput
                                name='name'
                                placeholder='Enter full name'
                                autoCapitalize='none'
                                value={values.name}
                                onChangeText={handleChange('name')}
                                onBlur={handleBlur('name')}
                            />
                            <FormErrorMessage
                                error={errors.name}
                                visible={touched.name}
                            />
                            <TextInput
                                name='password'
                                leftIconName='key-variant'
                                placeholder='Enter password'
                                autoCapitalize='none'
                                autoCorrect={false}
                                secureTextEntry={passwordVisibility}
                                textContentType='newPassword'
                                rightIcon={rightIcon}
                                handlePasswordVisibility={handlePasswordVisibility}
                                value={values.password}
                                onChangeText={handleChange('password')}
                                onBlur={handleBlur('password')}
                            />
                            <FormErrorMessage
                                error={errors.password}
                                visible={touched.password}
                            />
                            <TextInput
                                name='confirmPassword'
                                leftIconName='key-variant'
                                placeholder='Confirm password'
                                autoCapitalize='none'
                                autoCorrect={false}
                                secureTextEntry={confirmPasswordVisibility}
                                textContentType='password'
                                rightIcon={confirmPasswordIcon}
                                handlePasswordVisibility={handleConfirmPasswordVisibility}
                                value={values.confirmPassword}
                                onChangeText={handleChange('confirmPassword')}
                                onBlur={handleBlur('confirmPassword')}
                            />
                            <FormErrorMessage
                                error={errors.confirmPassword}
                                visible={touched.confirmPassword}
                            />
                            {/* Display Screen Error Mesages */}
                            {errorState !== '' ? (
                                <FormErrorMessage error={errorState} visible={true} />
                            ) : null}
                            {/* Signup button */}
                            <Button style={styles.button} isLoading={isLoading} onPress={() => handleSubmit()}>
                                <Text style={styles.buttonText}>Signup</Text>
                            </Button>
                        </>
                    )}
                </Formik>
                {/* Button to navigate to Login screen */}
                <Button
                    style={styles.borderlessButtonContainer}
                    borderless
                    title={'Already have an account?'}
                    onPress={() => navigation.navigate('Login')}
                />
                <Button
                    style={styles.borderlessButtonContainer}
                    borderless
                    title={'Go back to app'}
                    onPress={() => setNeedsLogin(false)}
                />
            </KeyboardAwareScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white,
        paddingHorizontal: 12,
    },
    logoContainer: {
        alignItems: 'center',
        marginTop: -30
    },
    screenTitle: {
        fontSize: 32,
        fontWeight: '700',
        color: Colors.black,
        paddingTop: 20
    },
    button: {
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
        backgroundColor: Colors.black,
        padding: 18,
        borderRadius: 8,
        borderColor: 'black',
        borderWidth: 2,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '500',
        color: "#fff"
    },
    borderlessButtonContainer: {
        marginTop: 16,
        alignItems: 'center',
        justifyContent: 'center',
    }
});
