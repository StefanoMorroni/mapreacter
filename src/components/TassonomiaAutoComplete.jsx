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
//import * as actions from '../actions/map';

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
  console.log("TassonomiaAutoComplete.renderInput()");
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
  console.log("TassonomiaAutoComplete.getStyle()", sublabel);
  let style = {}
  if (sublabel === 'ordo') {
    style = { backgroundColor: '#FEB24C', color: 'black' };
  } else if (sublabel === 'family') {
    style = { backgroundColor: '#FEC170', color: 'black' };
  } else if (sublabel === 'genus') {
    style = { backgroundColor: '#FECD8D', color: 'black' };
  } else if (sublabel === 'canonicalname') {
    style = { backgroundColor: '#FED7A4', color: 'black' };
  } else if (sublabel === 'provider') {
    style = { backgroundColor: '#FEDFB6', color: 'black' };
  } else if (sublabel === 'habitat') {
    style = { backgroundColor: '#EBD7BE', color: 'black' };
  }
  return style;
}

function renderSuggestion({ suggestion, index, itemProps, highlightedIndex, selectedItem }) {
  console.log("TassonomiaAutoComplete.renderSuggestion()", JSON.stringify(suggestion));
  const isHighlighted = highlightedIndex === index;
  const isSelected = (selectedItem || '').indexOf(suggestion.label) > -1;

  let style = getStyle(suggestion.routingrecord.field);
  return (
    <MenuItem
      {...itemProps}
      key={mylocalizedstrings.getString(suggestion.routingrecord.label, mylocalizedstrings.getLanguage()) + ' ' + suggestion.label}
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
        {mylocalizedstrings.getString(suggestion.routingrecord.label, mylocalizedstrings.getLanguage())}
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



class TassonomiaAutoComplete extends React.Component {


  constructor(props) {
    super(props);
    this.state = {
      inputValue: '',
      selectedItem: [],
      selectedRecord: [],
      suggestions: [],
      habitat: [],
    };

    const url = this.props.local.mapConfig.habitatsuggestionsurl;
    console.log("TassonomiaAutoComplete() GET", url);
    axios.get(url)
      .then((response) => {
        console.log("TassonomiaAutoComplete() response:", response.data);
        this.setState({ habitat: response.data.habitat });

        let selectedItem = [];
        let selectedRecord = [];

        const hasharray = decodeURIComponent(window.location.hash)
          .replace(/^#\//, '')
          .split("/");

        this.props.local.mapConfig.permalinkmask
          .replace(/^\//, '')
          .split("/")
          .forEach((item, index) => {
            try {
              console.log("TassonomiaAutoComplete()", index, item, hasharray[index]);
              if (item === '<ORDER1>') {
                if (hasharray[index] && hasharray[index] !== '*') {
                  selectedItem = [...selectedItem, hasharray[index]];
                  let _selectedRecord = {
                    routingrecord: this.props.local.mapConfig.routing[0],
                    label: hasharray[index],
                  };
                  selectedRecord = [...selectedRecord, _selectedRecord];
                }
              } else if (item === '<FAMILY1>') {
                if (hasharray[index] && hasharray[index] !== '*') {
                  selectedItem = [...selectedItem, hasharray[index]];
                  let _selectedRecord = {
                    routingrecord: this.props.local.mapConfig.routing[1],
                    label: hasharray[index],
                  };
                  selectedRecord = [...selectedRecord, _selectedRecord];
                }
              } else if (item === '<GENUS1>') {
                if (hasharray[index] && hasharray[index] !== '*') {
                  selectedItem = [...selectedItem, hasharray[index]];
                  let _selectedRecord = {
                    routingrecord: this.props.local.mapConfig.routing[2],
                    label: hasharray[index],
                  };
                  selectedRecord = [...selectedRecord, _selectedRecord];
                }
              } else if (item === '<SPECIES1>') {
                if (hasharray[index] && hasharray[index] !== '*') {
                  selectedItem = [...selectedItem, hasharray[index]];
                  let _selectedRecord = {
                    routingrecord: this.props.local.mapConfig.routing[3],
                    label: hasharray[index],
                  };
                  selectedRecord = [...selectedRecord, _selectedRecord];
                }
              } else if (item === '<ORDER2>') {
                if (hasharray[index] && hasharray[index] !== '*') {
                  selectedItem = [...selectedItem, hasharray[index]];
                  let _selectedRecord = {
                    routingrecord: this.props.local.mapConfig.routing[0],
                    label: hasharray[index],
                  };
                  selectedRecord = [...selectedRecord, _selectedRecord];
                }
              } else if (item === '<FAMILY2>') {
                if (hasharray[index] && hasharray[index] !== '*') {
                  selectedItem = [...selectedItem, hasharray[index]];
                  let _selectedRecord = {
                    routingrecord: this.props.local.mapConfig.routing[1],
                    label: hasharray[index],
                  };
                  selectedRecord = [...selectedRecord, _selectedRecord];
                }
              } else if (item === '<GENUS2>') {
                if (hasharray[index] && hasharray[index] !== '*') {
                  selectedItem = [...selectedItem, hasharray[index]];
                  let _selectedRecord = {
                    routingrecord: this.props.local.mapConfig.routing[2],
                    label: hasharray[index],
                  };
                  selectedRecord = [...selectedRecord, _selectedRecord];
                }
              } else if (item === '<SPECIES2>') {
                if (hasharray[index] && hasharray[index] !== '*') {
                  selectedItem = [...selectedItem, hasharray[index]];
                  let _selectedRecord = {
                    routingrecord: this.props.local.mapConfig.routing[3],
                    label: hasharray[index],
                  };
                  selectedRecord = [...selectedRecord, _selectedRecord];
                }
              } else if (item === '<PROVIDER>') {
                if (hasharray[index] && hasharray[index] !== '*') {
                  selectedItem = [...selectedItem, hasharray[index]];
                  let _selectedRecord = {
                    routingrecord: this.props.local.mapConfig.routing[4],
                    label: hasharray[index],
                  };
                  selectedRecord = [...selectedRecord, _selectedRecord];
                }
              } else if (item === '<HABITAT>') {
                if (hasharray[index] && hasharray[index] !== '*') {
                  let thehabitat = this.state.habitat.filter(item => item.codice === hasharray[index])[0];
                  selectedItem = [...selectedItem, thehabitat.descrizione];
                  let _selectedRecord = {
                    routingrecord: this.props.local.mapConfig.routing[5],
                    label: thehabitat.descrizione,
                    codice: thehabitat.codice,
                  };
                  selectedRecord = [...selectedRecord, _selectedRecord];
                }
              }
            } catch (error) {
            }
          });

        this.setState({ selectedItem, selectedRecord });
        console.log("TassonomiaAutoComplete() this.state:", this.state);
      })
      .catch((error) => {
        console.error(error);
      });


  }

  handleKeyDown = event => {
    console.log("TassonomiaAutoComplete.handleKeyDown()");
    const { inputValue, selectedItem } = this.state;
    if (selectedItem.length && !inputValue.length && keycode(event) === 'backspace') {
      this.setState({
        selectedItem: selectedItem.slice(0, selectedItem.length - 1),
      });
    }
  };

  handleInputChange = event => {
    console.log("TassonomiaAutoComplete.handleInputChange()", event.target.value);
    this.setState({ inputValue: event.target.value });

    const url = this.props.local.mapConfig.tassonomiaserviceurl + event.target.value;
    console.log("GET", url);
    axios.get(url, { params: { ...this.props.local.options } })
      .then((response) => {
        console.log("response:", response.data);
        const suggestions = [];
        this.props.local.mapConfig.routing
          .forEach(routingrecord => {
            if (response.data[routingrecord.field]) {
              response.data[routingrecord.field]
                .forEach(item => {
                  suggestions.push({
                    routingrecord: routingrecord,
                    label: item,
                  });
                });
            }
          });
        // aggiungo gli habitat ai suggestions
        this.state.habitat
          .filter(item => item.descrizione.toUpperCase().indexOf(this.state.inputValue.toUpperCase()) >= 0)
          .forEach(item => {
            suggestions.push({
              routingrecord: this.props.local.mapConfig.routing[5],
              label: item.descrizione,
              codice: item.codice,
            });
          });

        this.setState({ suggestions });
      })
      .catch((error) => {
        console.error(error);
      });
  };

  handleChange = item => {
    console.log("TassonomiaAutoComplete.handleChange()", item);
    let { selectedItem, selectedRecord, suggestions } = this.state;

    let newRecord = suggestions.filter(_record => _record.label === item)[0];
    if (newRecord.routingrecord.mask === '<HABITAT>') {
      let otherRecord = selectedRecord.filter(record => record.routingrecord.mask !== '<HABITAT>');
      selectedRecord = [...otherRecord, newRecord];

    } else if (newRecord.routingrecord.mask === '<PROVIDER>') {
      let otherRecord = selectedRecord.filter(record => record.routingrecord.mask !== '<PROVIDER>');
      selectedRecord = [...otherRecord, newRecord];

    } else {
      let tassonomiaRecord = selectedRecord.filter(record => record.routingrecord.mask !== '<PROVIDER>' && record.routingrecord.mask !== '<HABITAT>');
      let otherRecord = selectedRecord.filter(record => record.routingrecord.mask === '<PROVIDER>' || record.routingrecord.mask === '<HABITAT>');
      tassonomiaRecord = [...tassonomiaRecord, newRecord];
      if (tassonomiaRecord.length > 2) {
        tassonomiaRecord = tassonomiaRecord.slice(1, 3);
      }
      selectedRecord = [...tassonomiaRecord, ...otherRecord];
    }

    selectedItem = selectedRecord.map(item => item.label);
    this.setState({ inputValue: '', selectedRecord, selectedItem });

    this.handlePermalinkMask(selectedRecord);
  };

  handleDelete = item => () => {
    console.log("TassonomiaAutoComplete.handleDelete()", item);
    let selectedRecord = this.state.selectedRecord.filter(record => record.label !== item);
    let selectedItem = selectedRecord.map(record => record.label);
    this.setState({ selectedRecord, selectedItem });
    this.handlePermalinkMask(selectedRecord);
  };

  handlePermalinkMask(selectedRecord) {
    console.log("TassonomiaAutoComplete.handlePermalinkMask()", selectedRecord);
    let permalinkmask = this.props.local.mapConfig.permalinkmask.replace(/^\//, '');
    let thehash = decodeURIComponent(window.location.hash).replace(/^#\//, '');
    console.log("TassonomiaAutoComplete.handlePermalinkMask() permalinkmask:", permalinkmask, "window.location.hash:", thehash);

    let _permalinkmaskarray = permalinkmask.split("/");
    const _locationarray = thehash.split("/");

    _permalinkmaskarray = _permalinkmaskarray.map((_record, _index) => {
      let returnvalue = '*';
      if (_record === '<SICZPS>') {
        returnvalue = _locationarray[_index];
      } else if (_record === '<REGPROV>') {
        returnvalue = _locationarray[_index];
      } else {
        selectedRecord.forEach((_selectedRecord, _selectedRecordIndex) => {
          let _mask = _selectedRecord.routingrecord.mask.replace(/xx/g, '' + (_selectedRecordIndex + 1));
          if (_record === _mask) {
            if (_selectedRecord.codice) {
              returnvalue = _selectedRecord.codice;
            } else if (_selectedRecord.label) {
              returnvalue = _selectedRecord.label;
            } else {
              returnvalue = '*';
            }
          }
        });
      }
      console.log("TassonomiaAutoComplete.handlePermalinkMask() sostituisco", _record, "con", returnvalue);
      return returnvalue;
    });

    permalinkmask = '/' + _permalinkmaskarray.join('/');
    console.log("TassonomiaAutoComplete.handlePermalinkMask() permalinkmask:", permalinkmask);

    try {
      let _array = [
        this.props.map.zoom,
        '' + Math.round(this.props.map.center[0] * 100) / 100,
        '' + Math.round(this.props.map.center[1] * 100) / 100,
        this.props.map.bearing
      ];
      permalinkmask += '/' + _array.join('/');
      console.log("TassonomiaAutoComplete.handlePermalinkMask() permalinkmask:", permalinkmask);
    } catch (error) {
      console.error(error);
    }

    this.props.history.push(permalinkmask);
  }

  getSuggestions(inputValue) {
    console.log("TassonomiaAutoComplete.getSuggestions()", inputValue);
    let count = 0;
    return this.state.suggestions.filter(suggestion => {
      return (count++ < 12)
    });
  }

  getChip(item, index, classes) {
    //let selectedRecord = this.getSuggestions(item).filter(_record => _record.label === item)[0];
    let selectedRecord = this.state.selectedRecord.filter(_record => _record.label === item)[0];
    console.log("TassonomiaAutoComplete.getChip()", item, selectedRecord);
    let style = {}
    if (selectedRecord) {
      style = getStyle(selectedRecord.routingrecord.field);
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
    console.log("TassonomiaAutoComplete.render()");
    const { classes } = this.props;
    const { inputValue, selectedItem } = this.state;

    let componentwhidth = 0;
    try {
      componentwhidth = document.getElementById("regprovautocomplete").clientWidth;
      //console.log("TassonomiaAutoComplete.render() componentwhidth ->", componentwhidth);
    } catch (ex) { }

    return (
      <div id="tassonomiaautocomplete" className={classes.root}>
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
                    placeholder: `${mylocalizedstrings.tassonomialabel}`,
                    id: 'integration-downshift-multiple',
                    multiline: componentwhidth < 170 ? true : false,
                    rows: 2,
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

TassonomiaAutoComplete.propTypes = {
  classes: PropTypes.object.isRequired,
};

const mapStateToProps = (state) => {
  //console.log("TassonomiaAutoComplete.mapStateToProps()");
  return {
    map: state.map,
    local: state.local,
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
  };
};

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(TassonomiaAutoComplete)));