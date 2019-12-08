
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
import { mylocalizedstrings } from '../services/localizedstring';
import * as actions from '../actions/map';
import * as mapActions from '@boundlessgeo/sdk/actions/map';


var axios = require('axios');

const styles = theme => ({
  root: {
    margin: '5px',
    width: 'calc(50% - 170px)',
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

function getStyle(sublabel) {
  let style = {}
  if (sublabel === 'habitat') {
    style = { backgroundColor: '#fec170', color: 'black' };
  } else if (sublabel === 'regione') {
    style = { backgroundColor: '#feb24c', color: 'black' };
  } else if (sublabel === 'provincia') {
    style = { backgroundColor: '#feb24c', color: 'black' };
  } else if (sublabel === 'den_cmpro') {
    style = { backgroundColor: '#feb24c', color: 'black' };
  }
  return style;
}

function renderSuggestion({ suggestion, index, itemProps, highlightedIndex, selectedItem }) {
  console.log("RegProvAutocomplete.renderSuggestion()", JSON.stringify(suggestion));
  const isHighlighted = highlightedIndex === index;
  const isSelected = (selectedItem || '').indexOf(suggestion.label) > -1;

  let style = getStyle(suggestion.sublabel);
  return (
    <MenuItem
      {...itemProps}
      key={mylocalizedstrings.getString(suggestion.sublabel, mylocalizedstrings.getLanguage()) + ' ' + suggestion.label}
      selected={isHighlighted}
      component="div"
      style={{
        height: 'max-content',
        maxHeight: 'unset',
        fontWeight: isSelected ? 500 : 400, ...style
      }}
    >
      <Typography variant="subheading" style={{ color: 'black', whiteSpace: 'pre-wrap' }}>
        {suggestion.label}
      </Typography>
      &nbsp;
      <Typography variant="caption" style={{ fontStyle: 'italic', color: 'black', whiteSpace: 'pre-wrap' }}>
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

    this.state = {
      inputValue: '',
      selectedItem: [],
      selectedItemRegProv: [],
      selectedItemGeocoding: [],
      suggestions: [],
      suggestionsInital: []
    };

    console.log("RegProvAutocomplete() this.state:", JSON.stringify(this.state));

    const url = this.props.local.mapConfig.regprovsuggestionsurl;
    console.log("RegProvAutocomplete() GET", url);
    axios.get(url)
      .then((response) => {
        console.log("RegProvAutocomplete() response:", JSON.stringify(response.data));
        this.setState({ suggestions: response.data.items, suggestionsInital: response.data.items });

        const hasharray = decodeURIComponent(window.location.hash)
          .replace(/^#\//, '')
          .split("/");

        this.props.local.mapConfig.permalinkmask
          .replace(/^\//, '')
          .split("/")
          .forEach((_record, _index) => {
            try {
              if (_record === '<HABITAT>') {
                if (hasharray[_index] !== '*') {
                  this.handleChange(hasharray[_index]);
                }
              } else if (_record === '<REGPROV>') {
                if (hasharray[_index] !== '*') {
                  this.handleChange(hasharray[_index]);
                }
              }
            } catch (error) {
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

    // const url = this.props.local.mapConfig.geocodingurl + event.target.value;
    // console.log("GET", url);
    // axios.get(url)
    //   .then((response) => {
    //     console.log("response:", JSON.stringify(response.data));
    //     let _suggestions = response.data.map(_record => {
    //       _record.label = _record.display_name;
    //       _record.sublabel = 'geocoding';
    //       return _record;
    //     })
    //     this.setState({ suggestions: this.state.suggestionsInital.concat(_suggestions) });
    //   })
    //   .catch((error) => {
    //     console.error(error);
    //   });
  };

  handleChange = item => {
    console.log("RegProvAutocomplete.handleChange()", item);

    let selectedRecord = this.getSuggestions(item).filter(_record => _record.label === item)[0];
    console.log("RegProvAutocomplete.handleChange() selectedRecord -->", selectedRecord);

    switch (selectedRecord.sublabel) {
      case 'geocoding':
        this.setState({
          inputValue: '',
          selectedItemGeocoding: [item],
          selectedItem: [...this.state.selectedItemRegProv, item],
        });

        this.props.removeFeatures("geocoding");
        this.props.addFeatures("geocoding", selectedRecord.geojson);

        // Nominatim API returns a boundingbox property of the form: south Latitude, north Latitude, west Longitude, east Longitude
        let _extent = [
          Number(selectedRecord.boundingbox[2]),
          Number(selectedRecord.boundingbox[0]),
          Number(selectedRecord.boundingbox[3]),
          Number(selectedRecord.boundingbox[1])
        ];
        if (_extent[0] !== 0 && _extent[1] !== 0 && _extent[2] !== -1 && _extent[3] !== -1) {
          this.props.fitExtent(_extent, this.props.mapinfo.size, "EPSG:4326");
          this.props.zoomOut();
        }
        break;

      case 'habitat':
        this.setState({
          inputValue: '',
          selectedItemRegProv: [item],
          selectedItem: [...this.state.selectedItemGeocoding, item],
        });

        this.props.removeFeatures("regioni_province");

        this.props.changeRegProvComponent({ filter: selectedRecord.intersectfilter });
        this.handlePermalinkMask(selectedRecord);
        this.props.updateLayersWithViewparams(decodeURIComponent(window.location.hash).replace(/^#\//, '').split("/"));

        // let url = selectedRecord.wfsGetFeaturesUrl;
        // console.log("RegProvAutocomplete().handleChange() GET", url);
        // axios.get(url)
        //   .then((response) => {
        //     console.log("RegProvAutocomplete().handleChange() response:", JSON.stringify(response.data));
        //     this.props.addFeatures("regioni_province", response.data.features);
        //   })
        //   .catch((error) => {
        //     console.error(error);
        //   });
        break;

      default:
        this.setState({
          inputValue: '',
          selectedItemRegProv: [item],
          selectedItem: [...this.state.selectedItemGeocoding, item],
        });

        this.props.removeFeatures("regioni_province");

        this.props.changeRegProvComponent({ filter: selectedRecord.intersectfilter });
        this.handlePermalinkMask(selectedRecord);
        this.props.updateLayersWithViewparams(decodeURIComponent(window.location.hash).replace(/^#\//, '').split("/"));

        let url = selectedRecord.wfsGetFeaturesUrl;
        console.log("RegProvAutocomplete().handleChange() GET", url);
        axios.get(url)
          .then((response) => {
            console.log("RegProvAutocomplete().handleChange() response:", JSON.stringify(response.data));
            this.props.addFeatures("regioni_province", response.data.features);
          })
          .catch((error) => {
            console.error(error);
          });
    }
  }

  handleDelete = item => () => {
    console.log("RegProvAutocomplete.handleDelete()", item);
    let deletedRecord = this.getSuggestions(item).filter(_record => _record.label === item)[0];
    console.log("RegProvAutocomplete.handleChange() deletedRecord -->", deletedRecord);

    if (item === this.state.selectedItemGeocoding[0]) {
      this.setState({
        selectedItemGeocoding: [],
        selectedItem: [...this.state.selectedItemRegProv],
      });
      this.props.removeFeatures("geocoding");

    } else {
      this.setState({
        selectedItemRegProv: [],
        selectedItem: [...this.state.selectedItemGeocoding],
      });

      this.props.changeRegProvComponent({});
      this.handlePermalinkMask();
      this.props.removeFeatures("regioni_province");
    }
  };

  handlePermalinkMask(selectedRecord = {}) {
    console.log("RegProvAutocomplete.handlePermalinkMask()", JSON.stringify(selectedRecord));
    let permalinkmask = this.props.local.mapConfig.permalinkmask.replace(/^\//, '');
    let thehash = decodeURIComponent(window.location.hash).replace(/^#\//, '');
    console.log("RegProvAutocomplete.handlePermalinkMask() permalinkmask:", permalinkmask, "window.location.hash:", thehash);

    const _permalinkmaskarray = permalinkmask.split("/");
    const _locationarray = thehash.split("/");

    let _newpermalinkmaskarray = _permalinkmaskarray.map((_record, _index) => {
      let returnvalue;
      try {
        returnvalue = _locationarray[_index];
      } catch (error) {
        returnvalue = '*';
      }
      switch (selectedRecord.sublabel) {
        case 'habitat':
          if (_record === '<HABITAT>') {
            returnvalue = selectedRecord.label;
          } else if (_record === '<REGPROV>') {
            returnvalue = '*';
          }
          break;
        case 'regione':
        case 'provincia':
        case 'den_cmpro':
          if (_record === '<HABITAT>') {
            returnvalue = '*';
          } else if (_record === '<REGPROV>') {
            returnvalue = selectedRecord.label;
          }
          break;
        default:
          if (_record === '<HABITAT>') {
            returnvalue = '*';
          } else if (_record === '<REGPROV>') {
            returnvalue = '*';
          }
          break;
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

  _getSuggestions(inputValue) {
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

  getSuggestions(inputValue) {
    console.log("RegProvAutocomplete.getSuggestions()", inputValue);

    let habitatArr = this.state.suggestions
      .filter(item => item.sublabel === 'habitat')
      .filter(suggestion => {
        const keep = (!inputValue || suggestion.label.toLowerCase().indexOf(inputValue.toLowerCase()) !== -1);
        return keep;
      })
      .slice(0, 5);

    let tassonomiaArr = this.state.suggestions
      .filter(item => item.sublabel !== 'habitat')
      .filter(suggestion => {
        const keep = (!inputValue || suggestion.label.toLowerCase().indexOf(inputValue.toLowerCase()) !== -1);
        return keep;
      })
      .slice(0, 5);

    return habitatArr.concat(tassonomiaArr);
  }

  getChip(item, index, classes) {
    let selectedRecord = this.getSuggestions(item).filter(_record => _record.label === item)[0];
    console.log("RegProvAutocomplete.getChip()", item, selectedRecord);
    let style = getStyle("");
    if (selectedRecord) {
      style = getStyle(selectedRecord.sublabel);
    }
    return (
      <Chip
        key={index}
        tabIndex={-1}
        label={item}
        className={classes.chip}
        onDelete={this.handleDelete(item)}
        style={style}
      />);
  }

  render() {
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
                    startAdornment: selectedItem.map((item, index, self) => (
                      this.getChip(item, index, classes)
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

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(RegProvAutocomplete)));