import React from 'react';

import {makeStyles} from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import NewVariable from './NewVariable';
import GlobalFilter from '../../../components/GlobalFilter';
import {VarTypes} from '../../../Constants';

const useToolbarStyles = makeStyles((theme) => ({
  root: {
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(1),
  },
  title: {
    flex: '1 1 100%',
  },
}));

const TableToolbar = (props) => {
  const classes = useToolbarStyles();
  const {
    addHandler,
    varType,
    preGlobalFilteredRows,
    setGlobalFilter,
    globalFilter,
  } = props;
  return (
    <Toolbar className={classes.root}>
      <NewVariable addHandler={addHandler} varType={varType} />
      <Typography className={classes.title} variant="h6" id="tableTitle">
        Variables
      </Typography>

      <GlobalFilter
        preGlobalFilteredRows={preGlobalFilteredRows}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
      />
    </Toolbar>
  );
};

TableToolbar.propTypes = {
  addHandler: PropTypes.func.isRequired,
  varType: PropTypes.oneOf(Object.values(VarTypes)).isRequired,
  setGlobalFilter: PropTypes.func.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  preGlobalFilteredRows: PropTypes.array.isRequired,
  globalFilter: PropTypes.string,
};

TableToolbar.defaultProps = {
  globalFilter: null,
};

export default TableToolbar;
