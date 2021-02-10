import React from 'react';
import Button from '@material-ui/core/Button';
import {Link, useHistory, useLocation} from 'react-router-dom';
import useRequiredAuth from './hooks/useRequiredAuth';
import PageLoadingIndicator from './components/PageLoadingIndicator';
import {PageUrl} from './Constants';

const Home = () => {
  const auth = useRequiredAuth();
  const history = useHistory();
  const location = useLocation();

  if (!auth.authStateLoaded) {
    return <PageLoadingIndicator />;
  }

  const signOut = () => {
    auth.signOut(() =>
      history.push({
        pathname: PageUrl.LOGIN,
        state: {location},
      })
    );
  };

  return (
    <div>
      <ul>
        <li>
          <Link to={PageUrl.HOME}>Home</Link>
        </li>
        <li>
          <Link to={PageUrl.IDE}>IDE</Link>
        </li>
      </ul>
      <Button onClick={signOut}>Logout</Button>
    </div>
  );
};

export default Home;
