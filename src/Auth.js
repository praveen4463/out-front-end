import React, {useState, useEffect, useContext} from 'react';
import firebase from 'firebase/app';
import 'firebase/auth';
import PropTypes from 'prop-types';
import {AuthContext} from './contexts';

const firebaseConfig = {
  apiKey: 'AIzaSyDGDzeT2kbQxmdS_kCmjs4E4iZqOAU4ejQ',
  authDomain: 'zl-front-end.firebaseapp.com',
  projectId: 'zl-front-end',
  storageBucket: 'zl-front-end.appspot.com',
  messagingSenderId: '786012176086',
  appId: '1:786012176086:web:a1434a98dd522440a6d377',
  measurementId: 'G-KG989GGTNL',
};

firebase.initializeApp(firebaseConfig);

/**
 * onAuthStateChangedCallback: (u: User) => any, must be a useCallback to keep observer
 * from creating more than once.
 */
const useProvideAuth = (onSignIn, onSignOut) => {
  const [user, setUser] = useState(null);
  // when user signs in/out, the observer runs and allow us to perform actions.
  // After signing in, user may navigate through the app as authenticated user.
  // To check whether user is authorized, every page/component checks whether
  // user is defined. Since a single page app has just one page, every component
  // initializes auth on it's mount and detach it on unmount, this allows us to
  // have components that require auth and that don't. So, when a component mounts,
  // observer runs and contacts firebase to know whether there is any user signed
  // in, in the current browser. During this time, user is null. If component
  // checks user's state during this time, it may find it null and redirect to
  // login because it didn't wait for the observer to complete. This ref will
  // become true only after observer is done for the first time. Any component that
  // use auth must check this first, show some loading page during the time and
  // then decide whether to load component or direct to login.
  const [authStateLoaded, setAuthStateLoaded] = useState(false);

  const signIn = (
    email,
    password,
    onSuccess = null,
    onError = null,
    rememberUser = false
  ) => {
    const persistence = rememberUser
      ? firebase.auth.Auth.Persistence.LOCAL
      : firebase.auth.Auth.Persistence.SESSION;
    firebase
      .auth()
      .setPersistence(persistence)
      .then(() => {
        firebase
          .auth()
          .signInWithEmailAndPassword(email, password)
          .then((userCredentials) => {
            // don't set into state from here, let observer do it
            const u = userCredentials.user;
            // invoke onSignIn form here so that when some code
            // tries to invoke something in onSuccess handler that depends on
            // initializations done in the callback, it works without having to
            // wait for observer to run. For example axios default header values
            // before making api calls must be ready.
            u.getIdToken().then((token) => {
              onSignIn(u.uid, token, u.email);
              if (onSuccess) {
                onSuccess(u);
              }
            });
          })
          .catch((error) => {
            if (onError) {
              onError(error);
              return;
            }
            throw error;
          });
      });
  };

  const signOut = (onSuccess = null) => {
    firebase
      .auth()
      .signOut()
      .then(() => {
        if (onSuccess) {
          onSuccess();
        }
      }); // don't set into state from here, let observer do it
  };

  const signInAnonymously = (onSuccess = null, onError = null) => {
    firebase
      .auth()
      .signInAnonymously()
      .then((userCredentials) => {
        const u = userCredentials.user;
        u.getIdToken().then((token) => {
          onSignIn(u.uid, token, u.email);
          if (onSuccess) {
            onSuccess(u);
          }
        });
      })
      .catch((error) => {
        if (onError) {
          onError(error);
          return;
        }
        throw error;
      });
  };

  /**
   * For thrown errors, check.
   * https://firebase.google.com/docs/reference/js/firebase.User?authuser=0#reauthenticatewithcredential
   * https://firebase.google.com/docs/reference/js/firebase.User?authuser=0#updatepassword
   * For error codes and error object definition, check
   * https://firebase.google.com/docs/reference/js/firebase.auth.Error?authuser=0
   */
  const updatePassword = (
    currentPassword,
    newPassword,
    onSuccess = null,
    onError = null
  ) => {
    if (!user) {
      throw new TypeError('user is null');
    }
    if (!newPassword || newPassword.trim().length < 6) {
      throw new TypeError('New password must be 6+ chars');
    }
    // first re authenticate user
    const authCredentials = firebase.auth.EmailAuthProvider.credential(
      user.email,
      currentPassword
    );
    user
      .reauthenticateWithCredential(authCredentials)
      .then(() => {
        // if successful, update password
        user
          .updatePassword(newPassword)
          .then(() => {
            if (onSuccess) {
              onSuccess();
            }
          })
          .catch((error) => {
            if (onError) {
              onError(error);
            }
          });
      })
      .catch((error) => {
        if (onError) {
          onError(error);
          return;
        }
        throw error;
      });
  };

  const updateName = (newName, onSuccess = null, onError = null) => {
    if (!user) {
      throw new TypeError('user is null');
    }
    user
      .updateProfile({displayName: newName})
      .then(() => {
        if (onSuccess) {
          onSuccess();
        }
      })
      .catch((error) => {
        if (onError) {
          onError(error);
          return;
        }
        throw error;
      });
  };

  // Whenever user is signed in or out, this observer gets invoked and reset the
  // state causing the page to re render, so a page can know if user is no more
  // signed in or user just signed in.
  useEffect(() => {
    const unsubscribe = firebase.auth().onAuthStateChanged((u) => {
      // order is precise, first user should be set so that when auth state
      // changes and user is check, we get user rather than null if we set user
      // late here.
      setUser(u);
      console.log('onAuthStateChanged fired', u);
      if (!u || (u && !u.isAnonymous)) {
        setAuthStateLoaded(true);
      }
      if (u) {
        u.getIdToken().then((token) => {
          onSignIn(u.uid, token, u.email);
        });
      } else {
        onSignOut();
      }
    });
    return () => unsubscribe(); // runs when the component is unmounted so that observer is detached from it.
  }, [onSignIn, onSignOut]);

  return {
    user,
    authStateLoaded,
    signIn,
    signOut,
    signInAnonymously,
    updatePassword,
    updateName,
  };
};

/**
 * onSignIn: (uid, idToken, email) => any, must be a useCallback to keep observer
 * from creating more than once.
 * * onSignOut: () => any, must be a useCallback to keep observer
 * from creating more than once.
 */
const ProvideAuth = ({children, onSignIn, onSignOut}) => {
  const auth = useProvideAuth(onSignIn, onSignOut);
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

ProvideAuth.propTypes = {
  children: PropTypes.node.isRequired,
  onSignIn: PropTypes.func.isRequired,
  onSignOut: PropTypes.func.isRequired,
};

const useAuth = () => {
  return useContext(AuthContext);
};

export {ProvideAuth, useAuth};
