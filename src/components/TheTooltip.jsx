
import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Tooltip from '@material-ui/core/Tooltip';
import * as actions from '../actions/map';
import * as mapActions from '@boundlessgeo/sdk/actions/map';


const styles = theme => ({
  root: {
    marginLeft: '20px',
    color: 'currentColor'
  },
  customWidth: {
    //maxWidth: 500,
    maxWidth: '80%',
  },
});

class TheTooltip extends React.Component {

  render() {
    console.log("TheTooltip.render()");
    const { classes, title } = this.props;

    return (
      <div className={classes.root}>
        <Tooltip title={title} classes={{ tooltip: classes.customWidth }}>
          <i className="material-icons">info_outline</i>
        </Tooltip>
      </div>
    );
  }
}

TheTooltip.propTypes = {
  classes: PropTypes.object.isRequired,
};

const mapStateToProps = (state) => {
  return {
    map: state.map,
    local: state.local,
    mapinfo: state.mapinfo
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    changeRegProvComponent: (params) => {
      dispatch(actions.changeRegProvComponent(params));
    },
    updateLayersWithViewparams: (params) => {
      dispatch(actions.updateLayersWithViewparams(params));
    },
    addFeatures: (sourceName, features) => {
      dispatch(mapActions.addFeatures(sourceName, features));
    },
    removeFeatures: (sourceName, filter) => {
      dispatch(mapActions.removeFeatures(sourceName, filter));
    },
    fitExtent: (extent, size, projection) => {
      dispatch(mapActions.fitExtent(extent, size, projection));
    },
    zoomOut: () => {
      dispatch(mapActions.zoomOut());
    },
  };
};

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(TheTooltip)));