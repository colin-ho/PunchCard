import { FirebaseAuthTypes } from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";

export const Fave = (id: string, fav: boolean,user:FirebaseAuthTypes.User | null | undefined) => {
    if(user){
        if (fav) {
            const sub = firestore().collection('customers').doc(user?.uid)
            sub.update({favorites:firestore.FieldValue.arrayRemove(id)})
        } else {
            const sub = firestore().collection('customers').doc(user?.uid)
            sub.update({favorites:firestore.FieldValue.arrayUnion(id)});
        }
    }
}