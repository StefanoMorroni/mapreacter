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
import Tooltip from '@material-ui/core/Tooltip';

import { mylocalizedstrings } from '../services/localizedstring';
import * as actions from '../actions/map';
import { historydb } from './HistoryComponent'

var axios = require('axios');

const styles = theme => ({
  root: {
    margin: '15px',
    width: '30%',
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
  console.log("SearchAutocomplete.renderInput()");
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
  console.log("SearchAutocomplete.renderSuggestion()", JSON.stringify(suggestion));
  const isHighlighted = highlightedIndex === index;
  const isSelected = (selectedItem || '').indexOf(suggestion.label) > -1;

  return (
    <MenuItem
      {...itemProps}
      key={mylocalizedstrings.getString(suggestion.routingrecord.label, mylocalizedstrings.getLanguage()) + ' ' + suggestion.label}
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



class SearchAutocomplete extends React.Component {


  constructor(props) {
    super(props);
    let selectedItem = [];
    let selectedRecord = [];
    let thehash = decodeURIComponent(window.location.hash).replace(/#\//, '');
    let _array = thehash.split('/');
    console.log("SearchAutocomplete()", thehash, JSON.stringify(_array));
    _array.forEach((_record, index) => {
      if (index < 8) {
        if (_record !== '*' && _record !== '') {
          selectedItem = [...selectedItem, _record];
          let _selectedRecord = {
            routingrecord: this.props.local.mapConfig.routing[index % 4],
            label: _record,
          };
          console.log("SearchAutocomplete() -> ", JSON.stringify(_selectedRecord));
          selectedRecord = [...selectedRecord, _selectedRecord];
        }
      }
    });
    this.state = {
      inputValue: '',
      selectedItem: selectedItem,
      selectedRecord: selectedRecord,
      suggestions: []
    };

    console.log("SearchAutocomplete() this.state:", JSON.stringify(this.state));
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    //console.log("SearchAutocomplete.componentDidUpdate()",JSON.stringify(prevProps.local.searchAutocomplete.selectedItem),JSON.stringify(this.props.local.searchAutocomplete.selectedItem));
    if (this.props.local.searchAutocomplete.selectedItem) {
      //console.log("SearchAutocomplete.componentDidUpdate() step 2");
      if (this.props.local.searchAutocomplete.selectedItem !== prevProps.local.searchAutocomplete.selectedItem) {
        //console.log("SearchAutocomplete.componentDidUpdate() step 2.2");
        this.setState({ 
          selectedItem: this.props.local.searchAutocomplete.selectedItem,
          selectedRecord: this.props.local.searchAutocomplete.selectedRecord,
         });
        console.log("SearchAutocomplete.componentDidUpdate() this.state.selectedItem ->", JSON.stringify(this.props.local.searchAutocomplete.selectedItem));
      }
    }
  }

  handleKeyDown = event => {
    console.log("SearchAutocomplete.handleKeyDown()");
    const { inputValue, selectedItem } = this.state;
    if (selectedItem.length && !inputValue.length && keycode(event) === 'backspace') {
      this.setState({
        selectedItem: selectedItem.slice(0, selectedItem.length - 1),
      });
    }
  };

  handleInputChange = event => {
    console.log("SearchAutocomplete.handleInputChange()", event.target.value);
    this.setState({ inputValue: event.target.value });

    const url = this.props.local.mapConfig.tassonomiaserviceurl + event.target.value;
    console.log("GET", url);
    axios.get(url)
      .then((response) => {
        console.log("response:", JSON.stringify(response.data));
        const _datasource = [];
        this.props.local.mapConfig.routing.forEach(routingrecord => {
          if (response.data[routingrecord.field]) {
            if (response.data[routingrecord.field].length > 0) {
              response.data[routingrecord.field].forEach(element => {
                _datasource.push({
                  routingrecord: routingrecord,
                  label: element,
                });
              });
            }
          }
        });
        this.setState({ suggestions: _datasource });
      })
      .catch((error) => {
        console.error(error);
      });
  };

  handleChange = item => {
    let { selectedItem, selectedRecord, suggestions } = this.state;

    if (selectedItem.indexOf(item) === -1) {
      selectedItem = [...selectedItem, item];
    }

    if (selectedItem.length > 2) {
      selectedItem = selectedItem.slice(1, 3);
    }

    this.setState({
      inputValue: '',
      selectedItem,
    });

    let _selectedRecord = suggestions.filter(_record => _record.label === item)[0];
    //this.props.history.push(_selectedRecord.routingrecord.routinglevel + _selectedRecord.label);
    selectedRecord = [...selectedRecord, _selectedRecord];
    if (selectedRecord.length > 2) {
      selectedRecord = selectedRecord.slice(1, 3);
    }
    this.setState({ selectedRecord });
    console.log("SearchAutocomplete.handleChange()", JSON.stringify(selectedRecord));
    this.handlePermalinkMask(selectedRecord);
    this.handleHistory({ 
      selectedItem,
      selectedRecord
    });
    this.props.changeSearchAutocomplete({ 
      selectedItem,
      selectedRecord
    });
  };

  handleDelete = item => () => {
    const selectedItem = [...this.state.selectedItem];
    selectedItem.splice(selectedItem.indexOf(item), 1);
    this.setState({ selectedItem });
    const selectedRecord = this.state.selectedRecord.filter(_record => _record.label !== item);
    this.setState({ selectedRecord });
    console.log("SearchAutocomplete.handleDelete()", item);
    this.handlePermalinkMask(selectedRecord);
    this.handleHistory({ 
      selectedItem,
      selectedRecord
    });
    this.props.changeSearchAutocomplete({ 
      selectedItem,
      selectedRecord
    });      
  };

  handlePermalinkMask(selectedRecord) {
    console.log("SearchAutocomplete.handlePermalinkMask()", JSON.stringify(selectedRecord));
    let permalinkmask = this.props.local.mapConfig.permalinkmask.replace(/^\//, '');
    let thehash = decodeURIComponent(window.location.hash).replace(/^#\//, '');
    console.log("SearchAutocomplete.handlePermalinkMask() permalinkmask:", permalinkmask, "window.location.hash:", thehash);

    let _permalinkmaskarray = permalinkmask.split("/");
    const _locationarray = thehash.split("/");

    _permalinkmaskarray = _permalinkmaskarray.map((_record, _index) => {
      let returnvalue = '*';
      if (_record === '<HABITAT>') {
        returnvalue = _locationarray[_index];
      } else if (_record === '<REGPROV>') {
        returnvalue = _locationarray[_index];
      }

      selectedRecord.forEach((_selectedRecord, _selectedRecordIndex) => {
        let _mask = _selectedRecord.routingrecord.mask.replace(/xx/g, '' + (_selectedRecordIndex + 1));
        if (_record === _mask) {
          returnvalue = _selectedRecord.label ? _selectedRecord.label : '*';
        }
      });

      console.log("SearchAutocomplete.handlePermalinkMask() sostituisco", _record, "con", returnvalue);
      return returnvalue;
    });

    permalinkmask = '/' + _permalinkmaskarray.join('/');
    console.log("SearchAutocomplete.handlePermalinkMask() permalinkmask:", permalinkmask);

    try {
      let _array = [
        this.props.map.zoom,
        '' + Math.round(this.props.map.center[0] * 100) / 100,
        '' + Math.round(this.props.map.center[1] * 100) / 100,
        this.props.map.bearing
      ];
      permalinkmask += '/' + _array.join('/');
      console.log("SearchAutocomplete.handlePermalinkMask() permalinkmask:", permalinkmask);
    } catch (error) {
      console.error(error);
    }

    this.props.history.push(permalinkmask);
  }

  handleHistory(searchAutocomplete) {
    let viewparams = decodeURIComponent(window.location.hash).replace(/^#\//, '');
    let doc = {
      _id: viewparams,
      regProvAutocomplete: {
        selectedItem: this.props.local.regProvAutocomplete.selectedItem,
        features: this.props.local.regProvAutocomplete.features,
        filter: this.props.local.regProvAutocomplete.filter,
      },
      searchAutocomplete: searchAutocomplete,
    }
    historydb.put(doc).then( () => {
      console.log('SearchAutocomplete.handleHistory(), insert ->', JSON.stringify(doc));
    }).catch( err => {
      if (err.name === 'conflict') {
        historydb.get(viewparams).then( doc => {
          console.log('SearchAutocomplete.handleHistory(), get ->', JSON.stringify(doc));
          doc.searchAutocomplete = searchAutocomplete;
          historydb.put(doc).then( () => {
            console.log('SearchAutocomplete.handleHistory(), update ->', JSON.stringify(doc));
          }).catch( err => {
            console.error('SearchAutocomplete.handleHistory()', err);
          });
        });
      } else {
        console.error('SearchAutocomplete.handleHistory()', err);
      }
    }); 
  }

  getSuggestions(inputValue) {
    console.log("SearchAutocomplete.getSuggestions()", inputValue);
    let count = 0;
    return this.state.suggestions.filter(suggestion => {
      return (count++ < 12)
    });
  }



  render() {
    console.log("SearchAutocomplete.render()");
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
                    placeholder: `${mylocalizedstrings.searchlabel}`,
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

SearchAutocomplete.propTypes = {
  classes: PropTypes.object.isRequired,
};

const mapStateToProps = (state) => {
  //console.log("SearchAutocomplete.mapStateToProps()");
  return {
    map: state.map,
    local: state.local,
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    changeSearchAutocomplete: (params) => {
      dispatch(actions.changeSearchAutocomplete(params));
    },
  };
};

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(SearchAutocomplete)));