import React, {useState, useEffect, useContext, useRef} from 'react';
import firebase from 'firebase/app';
import 'firebase/auth';
import PropTypes from 'prop-types';
import {AuthContext} from './contexts';
import {MIN_PWD_LENGTH} from './Constants';
import {handleAuthError} from './common';

const useProvideAuth = (onSignIn, onSignOut, showGlobalError) => {
  const [user, setUser] = useState(null);
  const [authStateLoaded, setAuthStateLoaded] = useState(false);
  const tokenExpTimeSecsRef = useRef(null);

  const setTokenExpTimeSecsRef = (claims) => {
    tokenExpTimeSecsRef.current = claims.exp;
  };

  // if some method is called with no error handler, we will show error in global
  // handler after catching it rather than throwing
  const handlerOrShowGlobalError = (error, handler) => {
    if (handler) {
      handler(error);
      return;
    }
    handleAuthError(error, showGlobalError);
  };

  const signInPostProcess = (userCredentials, onSuccess = null) => {
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
        signInPostProcess(userCredentials, onSuccess);
      })
      .catch((error) => handlerOrShowGlobalError(error, onError));
  };

  const signInUsingToken = (token, onSuccess = null, onError = null) => {
    firebase
      .auth()
      .signInWithCustomToken(token)
      .then((userCredentials) => {
        signInPostProcess(userCredentials, onSuccess);
      })
      .catch((error) => handlerOrShowGlobalError(error, onError));
  };

  const signInWithCredential = (
    credential,
    onSuccess = null,
    onError = null
  ) => {
    firebase
      .auth()
      .signInWithCredential(credential)
      .then((userCredentials) => {
        signInPostProcess(userCredentials, onSuccess);
      })
      .catch((error) => handlerOrShowGlobalError(error, onError));
  };

  const signOut = (onSuccess = null, onError = null) => {
    firebase
      .auth()
      .signOut()
      .then(() => {
        setUser(null);
        onSignOut();
        if (onSuccess) {
          onSuccess();
        }
      })
      .catch((error) => handlerOrShowGlobalError(error, onError));
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
      .catch((error) => handlerOrShowGlobalError(error, onError));
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
    onError = null,
    onFinally = null
  ) => {
    if (!user) {
      throw new TypeError('user is null');
    }
    if (!newPassword || newPassword.trim().length < MIN_PWD_LENGTH) {
      throw new TypeError(`New password must be ${MIN_PWD_LENGTH}+ chars`);
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
          .catch((error) => handleAuthError(error, showGlobalError));
      })
      .catch((error) => handlerOrShowGlobalError(error, onError))
      .finally(() => {
        if (onFinally) {
          onFinally();
        }
      });
  };

  const getToken0 = (_user, onSuccess, onError = null) => {
    if (!_user) {
      throw new TypeError('user is null');
    }
    _user
      .getIdTokenResult()
      .then((res) => {
        setTokenExpTimeSecsRef(res.claims);
        onSuccess(res.token);
      })
      .catch((error) => handlerOrShowGlobalError(error, onError));
  };

  const getToken = (onSuccess, onError = null) => {
    getToken0(user, onSuccess, onError);
  };

  /**
   * Use this over getToken when user needs to be passed externally rather than
   * from auth state.
   * @param _user_ Firebase user
   * @param onSuccess Callback to invoke on success
   */
  const getTokenOfUser = (_user_, onSuccess, onError = null) => {
    getToken0(_user_, onSuccess, onError);
  };

  const getSignInMethodsForEmail = (email, onSuccess) => {
    firebase
      .auth()
      .fetchSignInMethodsForEmail(email)
      .then((methods) => onSuccess(methods));
  };

  // Whenever user is signed in or out, this observer gets invoked and reset the
  // state causing the page to re render, so a page can know if user is no more
  // signed in or user just signed in.
  useEffect(() => {
    const unsubscribe = firebase.auth().onAuthStateChanged((u) => {
      // console.log('onAuthStateChanged invoked', u);
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
          u.getIdTokenResult()
            .then((res) => {
              setTokenExpTimeSecsRef(res.claims);
              onSignIn(u.uid, res.token, u.email);
              setUser(u);
              setAuthStateLoaded(true);
            })
            .catch((error) => handleAuthError(error, showGlobalError));
        }
        return;
      }
      onSignOut();
      setUser(null);
      setAuthStateLoaded(true);
    });
    return () => unsubscribe(); // runs when component providing context is unmounted
  }, [onSignIn, onSignOut, showGlobalError]);

  return {
    user,
    authStateLoaded,
    tokenExpTimeSecsRef,
    signIn,
    signInUsingToken,
    signInWithCredential,
    signOut,
    signInAnonymously,
    updatePassword,
    getToken,
    getTokenOfUser,
    getSignInMethodsForEmail,
    GOOGLE_SIGN_IN_METHOD:
      firebase.auth.GoogleAuthProvider.GOOGLE_SIGN_IN_METHOD,
    EMAIL_PASSWORD_SIGN_IN_METHOD:
      firebase.auth.EmailAuthProvider.EMAIL_PASSWORD_SIGN_IN_METHOD,
  };
};

/**
 * @param {*} onInit (authContext) => any, must be a useCallback.
 * @param {*} onSignIn (uid, idToken, email) => any, must be a useCallback
 * @param {*} onSignOut () => any, must be a useCallback
 * @param {*} showGlobalError () => any, function that can display user an error message on any page in the app, must be a useCallback
 */
const ProvideAuth = React.memo(
  ({children, onInit, onSignIn, onSignOut, showGlobalError}) => {
    const auth = useProvideAuth(onSignIn, onSignOut, showGlobalError);
    // whatever we send to onInit will be closed over, thus auth can't be sent as
    // it changes on state change. Containers like ref or functions can be sent.
    onInit(auth.getTokenOfUser, auth.tokenExpTimeSecsRef);
    return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
  }
);

ProvideAuth.propTypes = {
  children: PropTypes.node.isRequired,
  onInit: PropTypes.func.isRequired,
  onSignIn: PropTypes.func.isRequired,
  onSignOut: PropTypes.func.isRequired,
  showGlobalError: PropTypes.func.isRequired,
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
