
import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types';
import keycode from 'keycode';
import Downshift from 'downshift';
import { withStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import Paper from '@material-ui/core/Paper';
import MenuItem from '@material-ui/core/MenuItem';
import Chip from '@material-ui/core/Chip';
import Typography from '@material-ui/core/Typography';
import GeoJSON from 'ol/format/geojson';
import WKT from 'ol/format/wkt';
import { mylocalizedstrings } from '../services/localizedstring';
import * as actions from '../actions/map';
import * as mapActions from '@boundlessgeo/sdk/actions/map';


var axios = require('axios');

const styles = theme => ({
  root: {
    margin: '15px',
    width: 'calc(60% - 160px)',
    color: 'currentColor'
  },
  container: {
    flexGrow: 1,
    position: 'relative',
  },
  paper: {
    position: 'absolute',
    zIndex: 1,
    marginTop: theme.spacing.unit,
    left: 0,
    right: 0,
  },
  chip: {
    height: '25px',
    margin: '2px',
  },
  inputRoot: {
    flexWrap: 'wrap',
    color: 'currentColor'
  },
});



function renderInput(inputProps) {
  const { InputProps, classes, ref, ...other } = inputProps;
  console.log("RegProvAutocomplete.renderInput()");
  return (
    <TextField
      InputProps={{
        inputRef: ref,
        classes: {
          root: classes.inputRoot,
        },
        ...InputProps,
      }}
      {...other}
    />
  );
}

function renderSuggestion({ suggestion, index, itemProps, highlightedIndex, selectedItem }) {
  console.log("RegProvAutocomplete.renderSuggestion()", JSON.stringify(suggestion));
  const isHighlighted = highlightedIndex === index;
  const isSelected = (selectedItem || '').indexOf(suggestion.label) > -1;

  return (
    <MenuItem
      {...itemProps}
      key={mylocalizedstrings.getString(suggestion.sublabel, mylocalizedstrings.getLanguage()) + ' ' + suggestion.label}
      selected={isHighlighted}
      component="div"
      style={{
        fontWeight: isSelected ? 500 : 400,
      }}
    >
      <Typography variant="subheading">
        {suggestion.label}
      </Typography>
      &nbsp;
      <Typography variant="caption" style={{ fontStyle: 'italic', }}>
        {mylocalizedstrings.getString(suggestion.sublabel, mylocalizedstrings.getLanguage())}
      </Typography>
    </MenuItem>
  );
}
renderSuggestion.propTypes = {
  highlightedIndex: PropTypes.number,
  index: PropTypes.number,
  itemProps: PropTypes.object,
  selectedItem: PropTypes.string,
  suggestion: PropTypes.shape({ label: PropTypes.string }).isRequired,
};



class RegProvAutocomplete extends React.Component {

  constructor(props) {
    super(props);

    let permalinkmask = this.props.local.mapConfig.permalinkmask.replace(/^\//, '');
    let thehash = decodeURIComponent(window.location.hash).replace(/^#\//, '');
    const _permalinkmaskarray = permalinkmask.split("/");
    const _locationarray = thehash.split("/");

    let selectedItem = [];
    try {
      _permalinkmaskarray.forEach((_record, _index) => {
        if (_record === '<REGPROV>') {
          if (_locationarray[_index] && _locationarray[_index] !== '*' && _locationarray[_index] !== '<REGPROV>') {
            selectedItem = [_locationarray[_index]];
          }
        }
      });
    } catch (error) {
    }

    this.state = {
      inputValue: '',
      selectedItem: selectedItem,
      suggestions: []
    };

    console.log("RegProvAutocomplete() this.state:", JSON.stringify(this.state));

    this.props.local.mapConfig.regprovconf.forEach(_record => {
      const url = _record.url + _record.cql_filter + '&outputFormat=application/json&propertyName=' + _record.propertyname + ',' + _record.intersectproperty
      console.log("RegProvAutocomplete() GET", url);
      axios.get(url)
        .then((response) => {
          console.log("RegProvAutocomplete() response:", JSON.stringify(response.data));
          this.setState(prevState => {
            try {
              return {
                suggestions: prevState.suggestions.concat(
                  response.data.features.map(_feature => {
                    return ({
                      feature: _feature,
                      label: _feature.properties[_record.propertyname],
                      sublabel: _record.propertyname,
                      url: _record.url,
                      wpsserviceurl: _record.wpsserviceurl,
                      intersectfilter: _record.intersectfilter.replace("<KEY>", _feature.properties[_record.intersectproperty]),
                    });
                  })
                )
              }
            } catch (error) {
              return {};
            }
          });
          if (this.state.selectedItem[0]) {
            this.handleChange(this.state.selectedItem[0]);
          }
        })
        .catch((error) => {
          console.error(error);
        });
    });

    // STF: devo invocare l'indicizzatore
    const url = '/habitat.json';
    console.log("GET", url);
    axios.get(url)
      .then((response) => {
        console.log("response:", response.data);
        this.setState(prevState => {
          try {
            return {
              suggestions: prevState.suggestions.concat(
                response.data.features.map(_feature => {
                  return ({
                    feature: _feature,
                    label: _feature.properties.cod_habitat + ' ' + _feature.properties.nome_habitat,
                    sublabel: 'habitat',
                    url: 'http://193.206.192.107/geoserver/wfs?service=wfs&version=2.0.0&request=GetFeature&typeNames=nnb:habitat_geom',
                    wpsserviceurl: 'http://193.206.192.107/geoserver/ows?strict:true',
                    intersectfilter: "&cql_filter=INTERSECTS(geom,collectGeometries(queryCollection('nnb:habitat_geom','geom','cod_habitat=<KEY>')))"
                      .replace("<KEY>", _feature.properties.cod_habitat),
                  });
                })
              )
            }
          } catch (error) {
            return {};
          }
        });
      })
      .catch((error) => {
        console.error(error);
      });
  }


  handleKeyDown = event => {
    console.log("RegProvAutocomplete.handleKeyDown()");
    const { inputValue, selectedItem } = this.state;
    if (selectedItem.length && !inputValue.length && keycode(event) === 'backspace') {
      this.setState({
        selectedItem: selectedItem.slice(0, selectedItem.length - 1),
      });
    }
  };

  handleInputChange = event => {
    console.log("RegProvAutocomplete.handleInputChange()", event.target.value);
    this.setState({ inputValue: event.target.value });
  };

  handleChange = item => {
    console.log("RegProvAutocomplete.handleChange()", item);

    this.setState({
      inputValue: '',
      selectedItem: [item],
    });

    let selectedRecord = this.getSuggestions(item).filter(_record => _record.label === item)[0];

    let filter = selectedRecord.intersectfilter;

    console.log("RegProvAutocomplete.handleChange() filter -->", filter);
    this.props.changeRegProvComponent({ filter: filter });
    this.handlePermalinkMask(selectedRecord);
    this.props.updateLayersWithViewparams(decodeURIComponent(window.location.hash).replace(/^#\//, '').split("/"));
  }

  handleDelete = item => () => {
    const selectedItem = [...this.state.selectedItem];
    selectedItem.splice(selectedItem.indexOf(item), 1);
    this.setState({ selectedItem });
    console.log("RegProvAutocomplete.handleDelete()", item);
    this.props.changeRegProvComponent({});
    this.handlePermalinkMask();
    this.props.removeFeatures("regioni_province");
  };

  handlePermalinkMask(selectedRecord = {}) {
    console.log("RegProvAutocomplete.handlePermalinkMask()", JSON.stringify(selectedRecord));
    let permalinkmask = this.props.local.mapConfig.permalinkmask.replace(/^\//, '');
    let thehash = decodeURIComponent(window.location.hash).replace(/^#\//, '');
    console.log("RegProvAutocomplete.handlePermalinkMask() permalinkmask:", permalinkmask, "window.location.hash:", thehash);

    const _permalinkmaskarray = permalinkmask.split("/");
    const _locationarray = thehash.split("/");

    let _newpermalinkmaskarray = _permalinkmaskarray.map((_record, _index) => {
      let returnvalue = '';
      if (_record === '<REGPROV>') {
        returnvalue = selectedRecord.label ? selectedRecord.label : '*';
      } else {
        try {
          returnvalue = _locationarray[_index];
        } catch (error) {
          returnvalue = '*';
        }
      }
      console.log("RegProvAutocomplete.handlePermalinkMask() sostituisco", _record, "con", returnvalue);
      return returnvalue;
    });

    permalinkmask = '/' + _newpermalinkmaskarray.join('/');
    console.log("RegProvAutocomplete.handlePermalinkMask() permalinkmask:", permalinkmask);

    try {
      let _array = [
        this.props.map.zoom,
        '' + Math.round(this.props.map.center[0] * 100) / 100,
        '' + Math.round(this.props.map.center[1] * 100) / 100,
        this.props.map.bearing
      ];
      permalinkmask += '/' + _array.join('/');
      console.log("RegProvAutocomplete.handlePermalinkMask() permalinkmask:", permalinkmask);
    } catch (error) {
      console.error(error);
    }

    this.props.history.push(permalinkmask);
  }

  getSuggestions(inputValue) {
    console.log("RegProvAutocomplete.getSuggestions()", inputValue);
    let count = 0;

    return this.state.suggestions.filter(suggestion => {
      const keep = (!inputValue || suggestion.label.toLowerCase().indexOf(inputValue.toLowerCase()) !== -1) && count < 12;
      if (keep) {
        count += 1;
      }
      return keep;
    });
  }

  render() {
    console.log("RegProvAutocomplete.render()");
    const { classes } = this.props;
    const { inputValue, selectedItem } = this.state;

    return (
      <div className={classes.root}>
        <Downshift inputValue={inputValue} onChange={this.handleChange} selectedItem={selectedItem} classes={classes}>
          {({
            getInputProps,
            getItemProps,
            isOpen,
            inputValue: inputValue2,
            selectedItem: selectedItem2,
            highlightedIndex,
          }) => (
              <div className={classes.container}>
                {renderInput({
                  fullWidth: true,
                  classes,
                  InputProps: getInputProps({
                    startAdornment: selectedItem.map(item => (
                      <Chip
                        key={item}
                        tabIndex={-1}
                        label={item}
                        className={classes.chip}
                        onDelete={this.handleDelete(item)}
                      />
                    )),
                    onChange: this.handleInputChange,
                    onKeyDown: this.handleKeyDown,
                    placeholder: `${mylocalizedstrings.regprovlabel}`,
                    id: 'integration-downshift-multiple',
                  }),
                })}
                {isOpen ? (
                  <Paper className={classes.paper} square>
                    {this.getSuggestions(inputValue2).map((suggestion, index) =>
                      renderSuggestion({
                        suggestion,
                        index,
                        itemProps: getItemProps({ item: suggestion.label }),
                        highlightedIndex,
                        selectedItem: selectedItem2,
                      }),
                    )}
                  </Paper>
                ) : null}
              </div>
            )}
        </Downshift>
      </div>
    );
  }
}

RegProvAutocomplete.propTypes = {
  classes: PropTypes.object.isRequired,
};

const mapStateToProps = (state) => {
  //console.log("RegProvAutocomplete.mapStateToProps()");
  return {
    map: state.map,
    local: state.local,
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
  };
};

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(RegProvAutocomplete)));