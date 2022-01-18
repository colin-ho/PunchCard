import React,{useEffect,useState,createContext} from 'react';
import {GOOGLE_API_KEY} from '@env';
import firestore ,{FirebaseFirestoreTypes}from '@react-native-firebase/firestore';
import Geolocation from 'react-native-geolocation-service';
import { Alert, Linking } from 'react-native';
import Geocoder from 'react-native-geocoding';

Geocoder.init(GOOGLE_API_KEY);
const geofire = require('geofire-common');

const hasPermissionIOS = async () => {
  const openSetting = () => {
    Linking.openSettings().catch(() => {
      Alert.alert('Unable to open settings');
    });
  };
  const status = await Geolocation.requestAuthorization('whenInUse');

  if (status === 'granted') {
    return true;
  }

  if (status === 'denied') {
    Alert.alert('Location permission denied');
  }

  if (status === 'disabled') {
    Alert.alert(
      `Turn on Location Services to allow PunchCard to determine your location.`,
      '',
      [
        { text: 'Go to Settings', onPress: openSetting },
        { text: "Don't Use Location", onPress: () => {} },
      ],
    );
  }

  return false;
};

const hasLocationPermission = async () => {
  const hasPermission = await hasPermissionIOS();
  return hasPermission;
};

export const BusinessContext = createContext({});
export const BusinessContextProvider = ({ children }:any) => {
    const [location, setLocation] = useState<any>(null);
    const [address,setAddress] = useState<string>('');
    const [businesses, setBusinesses] = useState<any>(null);
    const [refreshing,setRefreshing] = useState(false);
  
    const getStuff = ()=>{
        const center = [location.latitude,location.longitude];
        const radiusInM = 20 * 1000;
        const bounds = geofire.geohashQueryBounds(center, radiusInM);
        const promises = [];
        for (const b of bounds) {
          const q = firestore().collection('businesses')
            .orderBy('geohash')
            .startAt(b[0])
            .endAt(b[1]);
    
          promises.push(q.get());
        }
        Promise.all(promises).then((snapshots) => {
          let matchingDocs = [];
        
          for (const snap of snapshots) {
            for (const doc of snap.docs) {
              const lat = doc.get('lat');
              const lng = doc.get('lng');
        
              // We have to filter out a few false positives due to GeoHash
              // accuracy, but most will match
              const distanceInKm = geofire.distanceBetween([lat, lng], center);
              const distanceInM = distanceInKm * 1000;
              if (distanceInM <= radiusInM) {
                let data = doc.data();
                data.distance = distanceInM;
                matchingDocs.push(data);
              }
            }
            
          }
          matchingDocs.sort((a, b) => (a.distance > b.distance) ? 1 : -1)
          return matchingDocs;
        }).then((matchingDocs) => {
          setBusinesses(matchingDocs);
        });
    }

    useEffect(() => {
      (async () => {
        const hasPermission = await hasLocationPermission();
        if (!hasPermission) {
          return;
        }

        Geolocation.getCurrentPosition(
          (position) => {
            setLocation(position.coords);
            console.log(position)
            Geocoder.from({lat:position.coords.latitude,lng:position.coords.longitude}).then(json => {
              setAddress(json.results[0].address_components[0].long_name + " "+json.results[0].address_components[1].long_name)
              })
          },
          (error) => {
            Alert.alert(`Code ${error.code}`, error.message);
            setLocation(null);
            console.log(error);
          },
          {
            accuracy: {
              android: 'high',
              ios: 'best',
            },
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 10000,
          },
        );
      })();

    }, [])
  
    useEffect(() => {
      if(location){
        getStuff();
      }
      else{
        setBusinesses(null);
      }
      setTimeout(function(){ setRefreshing(false); }, 2000);
    }, [location,refreshing])

  return (
    <BusinessContext.Provider value={{ businesses,refreshing,setRefreshing,address }}>
      {children}
    </BusinessContext.Provider>
  );
};
