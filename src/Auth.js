import React, {useState, useEffect, useContext, useRef} from 'react';
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

const useProvideAuth = (onSignIn, onSignOut) => {
  const [user, setUser] = useState(null);
  const [authStateLoaded, setAuthStateLoaded] = useState(false);
  const tokenExpTimeSecsRef = useRef(null);

  const setTokenExpTimeSecsRef = (claims) => {
    tokenExpTimeSecsRef.current = claims.exp;
  };

  // remember setting was removed because Session persistence of firebase only
  // persist login auth in current tab, if a new tab is opened, user has to relogin.
  // There is option of only Local persistence that persist state across tabs and
  // reopening of browsers. To allow remember me, we would need a persistence option
  // that persists across tabs and clears only when entire browser window is closed
  // but this is not available with firebase so we can't use remember me option.
  const signIn = (email, password, onSuccess = null, onError = null) => {
    firebase
      .auth()
      .signInWithEmailAndPassword(email, password)
      .then((userCredentials) => {
        const u = userCredentials.user;
        setUser(u);
        // invoke onSignIn form here so that when some code
        // tries to invoke something in onSuccess handler that depends on
        // initializations done in the callback, it works without having to
        // wait for observer to run. For example axios default header values
        // before making api calls must be ready.
        u.getIdTokenResult().then((res) => {
          setTokenExpTimeSecsRef(res.claims);
          onSignIn(u.uid, res.token, u.email);
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

  const signOut = (onSuccess = null) => {
    firebase
      .auth()
      .signOut()
      .then(() => {
        setUser(null);
        onSignOut();
        if (onSuccess) {
          onSuccess();
        }
      });
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

  const getToken0 = (_user, onSuccess) => {
    if (!_user) {
      throw new TypeError('user is null');
    }
    _user.getIdTokenResult().then((res) => {
      setTokenExpTimeSecsRef(res.claims);
      onSuccess(res.token);
    });
  };

  const getToken = (onSuccess) => {
    getToken0(user, onSuccess);
  };

  /**
   * Use this over getToken when user needs to be passed externally rather than
   * from auth state.
   * @param _user_ Firebase user
   * @param onSuccess Callback to invoke on success
   */
  const getTokenOfUser = (_user_, onSuccess) => {
    getToken0(_user_, onSuccess);
  };

  // Whenever user is signed in or out, this observer gets invoked and reset the
  // state causing the page to re render, so a page can know if user is no more
  // signed in or user just signed in.
  useEffect(() => {
    const unsubscribe = firebase.auth().onAuthStateChanged((u) => {
      console.log('onAuthStateChanged invoked', u);
      // !!order is precise
      // when there is a user:
      // if it's anonymous don't do anything, we don't need anything from observer
      // as we signIn and signOut an anonymous user before and after an api call
      // and onSignIn is run by signIn function.
      // Otherwise, get user's token and in the callback invoke onSignIn before
      // setting user or authState to true so that any page that checks one of
      // these before accessing api will have all credentials ready to make that
      // call.
      // when there is no user:
      // just call onSignOut, set user to null and mark authState loaded
      if (u) {
        if (!u.isAnonymous) {
          u.getIdTokenResult().then((res) => {
            setTokenExpTimeSecsRef(res.claims);
            onSignIn(u.uid, res.token, u.email);
            setUser(u);
            setAuthStateLoaded(true);
          });
        }
        return;
      }
      onSignOut();
      setUser(null);
      setAuthStateLoaded(true);
    });
    return () => unsubscribe(); // runs when component providing context is unmounted
  }, [onSignIn, onSignOut]);

  return {
    user,
    authStateLoaded,
    tokenExpTimeSecsRef,
    signIn,
    signOut,
    signInAnonymously,
    updatePassword,
    updateName,
    getToken,
    getTokenOfUser,
  };
};

/**
 * onInit: (authContext) => any, must be a useCallback.
 * onSignIn: (uid, idToken, email) => any, must be a useCallback to keep observer
 * from creating more than once.
 * * onSignOut: () => any, must be a useCallback to keep observer
 * from creating more than once.
 */
const ProvideAuth = React.memo(({children, onInit, onSignIn, onSignOut}) => {
  const auth = useProvideAuth(onSignIn, onSignOut);
  // whatever we send to onInit will be closed over, thus auth can't be sent as
  // it changes on state change. Containers like ref or functions can be sent.
  onInit(auth.getTokenOfUser, auth.tokenExpTimeSecsRef);
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
});

ProvideAuth.propTypes = {
  children: PropTypes.node.isRequired,
  onInit: PropTypes.func.isRequired,
  onSignIn: PropTypes.func.isRequired,
  onSignOut: PropTypes.func.isRequired,
};

/*
Authentication on zylitics work using react context. We use auth context at top
level and all components consume it using following context consumer. Once the
context's value is initialized, it doesn't change component by component and
all use the same context state. So when a page is loaded, context initialize,
all it's states initialized too. Once authStateChange fires first time it remains
same and all components see that it has fired. Once user state is set, all component
knows that something is reset is user state at the same time. Only when the app is
loaded in a new tab/window, the context is initialized for that tab and states are
initialized with fresh values.
*/
const useAuthContext = () => {
  return useContext(AuthContext);
};

export {ProvideAuth, useAuthContext};
