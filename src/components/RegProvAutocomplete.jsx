
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
    // margin: '5px',
    // padding: 0,
    // width: 'calc(50% - 170px)',
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
  if (sublabel === 'siczps') {
    style = { backgroundColor: '#fec170', color: 'black' };
  } else if (sublabel === 'regione') {
    style = { backgroundColor: '#9e5c05', color: 'black' };
  } else if (sublabel === 'provincia') {
    style = { backgroundColor: '#feb24c', color: 'black' };
  } else if (sublabel === 'den_cmpro') {
    style = { backgroundColor: '#feb24c', color: 'black' };
  } else if (sublabel === 'comune') {
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
        //height: 'max-content',
        height: '30%',
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
      suggestions: [],
      suggestionsInital: []
    };

    console.log("RegProvAutocomplete()", window.location.hash, "this.state:", JSON.stringify(this.state));

    const url = this.props.local.mapConfig.regprovsuggestionsurl;
    console.log("RegProvAutocomplete() GET", url);
    axios.get(url)
      .then((response) => {
        console.log("RegProvAutocomplete() response:", response.data);
        this.setState({ suggestions: response.data.items, suggestionsInital: response.data.items });

        const hasharray = decodeURIComponent(window.location.hash)
          .replace(/^#\//, '')
          .split("/");

        this.props.local.mapConfig.permalinkmask
          .replace(/^\//, '')
          .split("/")
          .forEach((_record, _index) => {
            try {
              if (_record === '<SICZPS>') {
                if (hasharray[_index] !== '*') {
                  //this.handleChange(hasharray[_index]);
                  let selectedRecord = this.state.suggestions
                    .filter(item => item.sublabel === 'siczps')
                    .filter(item => item.codice === hasharray[_index])[0];

                  let item = selectedRecord.label;

                  console.log("RegProvAutocomplete() selectedRecord -->", selectedRecord);

                  this.setState({
                    inputValue: '',
                    selectedItem: [item],
                  });

                  //this.props.removeFeatures("regioni_province");
                  this.props.changeRegProvComponent({ filter: selectedRecord.intersectfilter });
                  //this.handlePermalinkMask(selectedRecord);
                  this.props.updateLayersWithViewparams(decodeURIComponent(window.location.hash).replace(/^#\//, '').split("/"));

                  if (window.location.hash.includes("/6/12/42/")) {
                    let featuresUrl = selectedRecord.wfsGetFeaturesUrl;
                    axios.get(featuresUrl)
                      .then((response) => {
                        console.log("RegProvAutocomplete() GET", featuresUrl, "response:", response.data);
                        setTimeout(() => {
                          this.props.fitExtent(response.data.bbox, this.props.mapinfo.size, "EPSG:4326");
                          this.props.zoomOut();
                        }, 500);
                      })
                      .catch((error) => {
                        console.error("RegProvAutocomplete() GET", featuresUrl, error);
                      });
                  }
                }
              } else if (_record === '<REGPROV>') {
                if (hasharray[_index] !== '*') {
                  //this.handleChange(hasharray[_index]);
                  let selectedRecord = this.state.suggestions
                    .filter(item => item.sublabel !== 'siczps')
                    .filter(item => item.label === hasharray[_index])[0];

                  let item = selectedRecord.label;

                  console.log("RegProvAutocomplete() selectedRecord -->", selectedRecord);

                  this.setState({
                    inputValue: '',
                    selectedItem: [item],
                  });

                  //this.props.removeFeatures("regioni_province");
                  this.props.changeRegProvComponent({ filter: selectedRecord.intersectfilter });
                  //this.handlePermalinkMask(selectedRecord);
                  this.props.updateLayersWithViewparams(decodeURIComponent(window.location.hash).replace(/^#\//, '').split("/"));

                  let url = selectedRecord.wfsGetFeaturesUrl;
                  console.log("RegProvAutocomplete() GET", url);
                  axios.get(url)
                    .then((response) => {
                      console.log("RegProvAutocomplete() response:", response.data);
                      this.props.addFeatures("regioni_province", response.data.features);
                    })
                    .catch((error) => {
                      console.error(error);
                    });
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
  };

  handleChange = item => {
    console.log("RegProvAutocomplete.handleChange()", item);

    let selectedRecord = this.getSuggestions(item).filter(_record => _record.label === item)[0];
    console.log("RegProvAutocomplete.handleChange() selectedRecord -->", selectedRecord);

    switch (selectedRecord.sublabel) {
      case 'siczps':
        this.setState({
          inputValue: '',
          selectedItem: [item],
        });

        this.props.removeFeatures("regioni_province");

        this.props.changeRegProvComponent({ filter: selectedRecord.intersectfilter });
        this.handlePermalinkMask(selectedRecord);
        this.props.updateLayersWithViewparams(decodeURIComponent(window.location.hash).replace(/^#\//, '').split("/"));

        let featuresUrl = selectedRecord.wfsGetFeaturesUrl;
        axios.get(featuresUrl)
          .then((response) => {
            console.log("RegProvAutocomplete.handleChange() GET", featuresUrl, "response:", response.data);
            setTimeout(() => {
              this.props.fitExtent(response.data.bbox, this.props.mapinfo.size, "EPSG:4326");
              this.props.zoomOut();
            }, 500);
          })
          .catch((error) => {
            console.error("RegProvAutocomplete.handleChange() GET", featuresUrl, error);
          });
        break;

      default:
        this.setState({
          inputValue: '',
          selectedItem: [item],
        });

        this.props.removeFeatures("regioni_province");

        this.props.changeRegProvComponent({ filter: selectedRecord.intersectfilter });
        this.handlePermalinkMask(selectedRecord);
        this.props.updateLayersWithViewparams(decodeURIComponent(window.location.hash).replace(/^#\//, '').split("/"));

        let url = selectedRecord.wfsGetFeaturesUrl;
        console.log("RegProvAutocomplete().handleChange() GET", url);
        axios.get(url)
          .then((response) => {
            console.log("RegProvAutocomplete().handleChange() response:", response.data);
            this.props.addFeatures("regioni_province", response.data.features);
            setTimeout(() => {
              this.props.fitExtent(response.data.bbox, this.props.mapinfo.size, "EPSG:4326");
              this.props.zoomOut();
            }, 500);
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

    this.setState({
      selectedItem: [],
    });

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
      let returnvalue;
      try {
        returnvalue = _locationarray[_index];
      } catch (error) {
        returnvalue = '*';
      }
      switch (selectedRecord.sublabel) {
        case 'siczps':
          if (_record === '<SICZPS>') {
            returnvalue = selectedRecord.codice;
          } else if (_record === '<REGPROV>') {
            returnvalue = '*';
          }
          break;
        case 'regione':
        case 'provincia':
        case 'den_cmpro':
        case 'comune':
          if (_record === '<SICZPS>') {
            returnvalue = '*';
          } else if (_record === '<REGPROV>') {
            returnvalue = selectedRecord.label;
          }
          break;
        default:
          if (_record === '<SICZPS>') {
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

  getSuggestions(inputValue) {
    //console.log("RegProvAutocomplete.getSuggestions()", inputValue);

    // mostro i primi 5 sic-zps che rientrano nel filtro
    let array1 = this.state.suggestions
      .filter(item => item.sublabel === 'siczps')
      .filter(suggestion => {
        const keep = (!inputValue || suggestion.label.toLowerCase().indexOf(inputValue.toLowerCase()) !== -1);
        return keep;
      })
      .slice(0, 5);

    // ed altri 5 elementi tra regioni, province e comuni
    let array2 = this.state.suggestions
      .filter(item => item.sublabel !== 'siczps')
      .filter(suggestion => {
        const keep = (!inputValue || suggestion.label.toLowerCase().indexOf(inputValue.toLowerCase()) !== -1);
        return keep;
      })
      .slice(0, 5);

    return array1.concat(array2);
  }

  getChip(item, index, classes) {
    let selectedRecord = this.getSuggestions(item).filter(_record => _record.label === item)[0];
    //console.log("RegProvAutocomplete.getChip()", item, selectedRecord);
    let style = {};
    if (selectedRecord) {
      style = getStyle(selectedRecord.sublabel);

      switch (selectedRecord.sublabel) {
        case 'siczps':
          return (
            <Chip
              key={index}
              tabIndex={-1}
              label={selectedRecord.codice}
              className={classes.chip}
              onDelete={this.handleDelete(item)}
              style={style}
            />);
        default:
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

    let componentwhidth = 0;
    try {
      componentwhidth = document.getElementById("regprovautocomplete").clientWidth;
      //console.log("RegProvAutocomplete.render() componentwhidth ->", componentwhidth);
    } catch (ex) { }

    return (
      <div id="regprovautocomplete" className={classes.root}>
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
                    id: 'regprov-downshift-multiple',
                    multiline: componentwhidth < 210 ? true : false,
                    rows: componentwhidth < 130 ? 3 : 2,
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