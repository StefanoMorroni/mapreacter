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
  //console.log("SearchAutocomplete.renderInput()");
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
  //console.log("SearchAutocomplete.renderSuggestion()", JSON.stringify(suggestion));
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



class SearchAutocomplete extends React.Component {


  constructor(props) {
    super(props);

    let permalinkmask = this.props.local.mapConfig.permalinkmask.replace(/^\//, '');
    let thehash = decodeURIComponent(window.location.hash).replace(/^#\//, '');
    const _permalinkmaskarray = permalinkmask.split("/");
    const _locationarray = thehash.split("/");


    let selectedItemTassonomia = [];
    let selectedItemRegProv = [];
    let suggestions = [];
    try {
      _permalinkmaskarray.forEach((_record, _index) => {
        if (_locationarray[_index] && _locationarray[_index] !== '*') {
          if (_record === '<REGPROV>') {
            selectedItemRegProv = [...selectedItemRegProv, _locationarray[_index]];
          } else if (_record === '<HABITAT>') {

          } else {
            selectedItemTassonomia = [...selectedItemTassonomia, _locationarray[_index]];
            let suggestion = {
              label: _locationarray[_index],
              sublabel: this.props.local.mapConfig.routing[_index % 4].label,
              field: this.props.local.mapConfig.routing[_index % 4].field,
              mask: this.props.local.mapConfig.routing[_index % 4].mask,              
            };
            suggestions = [...suggestions, suggestion];
          }
        }
      });
    } catch (error) {
    }

    this.state = {
      inputValue: '',
      selectedItem: [...selectedItemRegProv, ...selectedItemTassonomia],
      selectedItemTassonomia,
      selectedItemRegProv,
      suggestions,
    };

    console.log("SearchAutocomplete() this.state:", JSON.stringify(this.state));

    this.props.local.mapConfig.regprovconf.forEach(_record => {
      const url = _record.url + _record.cql_filter + '&outputFormat=application/json&propertyName=' + _record.propertyname;
      console.log("SearchAutocomplete() GET", url);
      axios.get(url)
        .then((response) => {
          console.log("SearchAutocomplete() response:", JSON.stringify(response.data));
          this.setState(prevState => {
            try {
              return {
                suggestions: prevState.suggestions.concat(
                  response.data.features.map(_feature => {
                    return ({
                      label: _feature.properties[_record.propertyname],
                      sublabel: _record.propertyname,
                      mask: '<REGPROV>',
                      feature: _feature,
                      url: _record.url,
                      wpsserviceurl: _record.wpsserviceurl
                    });
                  })
                )
              }
            } catch (error) {
              return {};
            }
          });
          if (this.state.selectedItemRegProv[0]) {
            this.handleChange(this.state.selectedItemRegProv[0]);
          }
        })
        .catch((error) => {
          console.error(error);
        });
    });
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    //console.log("SearchAutocomplete.componentDidUpdate()",JSON.stringify(prevProps.local.searchAutocomplete.selectedItem),JSON.stringify(this.props.local.searchAutocomplete.selectedItem));
    if (this.props.local.searchAutocomplete.selectedItem) {
      //console.log("SearchAutocomplete.componentDidUpdate() step 2");
      if (this.props.local.searchAutocomplete.selectedItem !== prevProps.local.searchAutocomplete.selectedItem) {
        //console.log("SearchAutocomplete.componentDidUpdate() step 2.2");
        this.setState({ selectedItem: this.props.local.searchAutocomplete.selectedItem });
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
    console.log("SearchAutocomplete.handleInputChange() GET", url);
    axios.get(url)
      .then((response) => {
        console.log("SearchAutocomplete.handleInputChange() response:", JSON.stringify(response.data));
        this.props.local.mapConfig.routing.forEach(routingrecord => {
          if (response.data[routingrecord.field]) {
            if (response.data[routingrecord.field].length > 0) {
              response.data[routingrecord.field].forEach(element => {

                var found = this.state.suggestions.find((rec) => {
                  return rec.label === element;
                });
                if (!found) {
                  this.setState({
                    suggestions: [...this.state.suggestions, {
                      label: element,
                      sublabel: routingrecord.label,
                      field: routingrecord.field,
                      mask: routingrecord.mask,
                    }]
                  });
                }
              });
            }
          }
        });

      })
      .catch((error) => {
        console.error(error);
      });
  };

  handleChange = item => {
    console.log("SearchAutocomplete.handleChange()", item);

    let { selectedItem, selectedItemRegProv, selectedItemTassonomia } = this.state;

    let record = this.getSuggestions(item)[0];
    if (!record) return;
    if (record.mask === '<REGPROV>') {
      selectedItemRegProv = [item];
    } else {
      selectedItemTassonomia = [...selectedItemTassonomia, item];
      if (selectedItemTassonomia.length > 2) {
        selectedItemTassonomia = selectedItemTassonomia.slice(1, 3);
      }
    }
    selectedItem = [...selectedItemRegProv, ...selectedItemTassonomia];

    console.log("SearchAutocomplete.handleChange()", 
      "selectedItem ->", JSON.stringify(selectedItem), 
      "selectedItemRegProv ->", JSON.stringify(selectedItemRegProv),
      "selectedItemTassonomia ->", JSON.stringify(selectedItemTassonomia));

    this.setState({
      inputValue: '',
      selectedItem,
      selectedItemRegProv,
      selectedItemTassonomia,
    });

    let suggestions = selectedItem.map((_item) => {
      return this.getSuggestions(_item)[0];
    });
    console.log("SearchAutocomplete.handleChange() suggestions ->", JSON.stringify(suggestions));
    this.handlePermalinkMask(suggestions);
    
    if (record.mask === '<REGPROV>') {
      this.handleChangeRegProv(item, record);
    } else {
      this.props.changeSearchAutocomplete({ 
        selectedItem,
        selectedItemRegProv,
        selectedItemTassonomia,
        features: this.props.local.searchAutocomplete.features,
        filter: this.props.local.searchAutocomplete.filter
      });
      this.handleHistory({
        selectedItem,
        selectedItemRegProv,
        selectedItemTassonomia,
        features: this.props.local.searchAutocomplete.features,
        filter: this.props.local.searchAutocomplete.filter
      });      
    }
  };  


  handleChangeRegProv = (item, suggestions) => {
      
    this.props.removeFeatures("regioni_province");

    let _data =
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<wps:Execute version="1.0.0" service="WPS" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.opengis.net/wps/1.0.0" xmlns:wfs="http://www.opengis.net/wfs" xmlns:wps="http://www.opengis.net/wps/1.0.0" xmlns:ows="http://www.opengis.net/ows/1.1" xmlns:gml="http://www.opengis.net/gml" xmlns:ogc="http://www.opengis.net/ogc" xmlns:wcs="http://www.opengis.net/wcs/1.1.1" xmlns:xlink="http://www.w3.org/1999/xlink" xsi:schemaLocation="http://www.opengis.net/wps/1.0.0 http://schemas.opengis.net/wps/1.0.0/wpsAll.xsd">\n' +
      '  <ows:Identifier>vec:Reproject</ows:Identifier>\n' +
      '  <wps:DataInputs>\n' +
      '    <wps:Input>\n' +
      '      <ows:Identifier>features</ows:Identifier>\n' +
      '      <wps:Reference mimeType="text/xml" xlink:href="http://geoserver/wps" method="POST">\n' +
      '        <wps:Body>\n' +
      '          <wps:Execute version="1.0.0" service="WPS" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.opengis.net/wps/1.0.0" xmlns:wfs="http://www.opengis.net/wfs" xmlns:wps="http://www.opengis.net/wps/1.0.0" xmlns:ows="http://www.opengis.net/ows/1.1" xmlns:gml="http://www.opengis.net/gml" xmlns:ogc="http://www.opengis.net/ogc" xmlns:wcs="http://www.opengis.net/wcs/1.1.1" xmlns:xlink="http://www.w3.org/1999/xlink" xsi:schemaLocation="http://www.opengis.net/wps/1.0.0 http://schemas.opengis.net/wps/1.0.0/wpsAll.xsd">\n' +
      '            <ows:Identifier>vec:Simplify</ows:Identifier>\n' +
      '            <wps:DataInputs>\n' +
      '              <wps:Input>\n' +
      '                <ows:Identifier>features</ows:Identifier>\n' +
      '                <wps:Reference mimeType="application/json" xlink:href="<WFSURL>&amp;featureID=<FEATUREID>&amp;outputFormat=application/json" method="GET"/>\n\n' +
      '              </wps:Input>\n' +
      '              <wps:Input>\n' +
      '                <ows:Identifier>distance</ows:Identifier>\n' +
      '                <wps:Data>\n' +
      '                  <wps:LiteralData>1000</wps:LiteralData>\n' +
      '                </wps:Data>\n' +
      '              </wps:Input>\n' +
      '              <wps:Input>\n' +
      '                <ows:Identifier>preserveTopology</ows:Identifier>\n' +
      '                <wps:Data>\n' +
      '                  <wps:LiteralData>true</wps:LiteralData>\n' +
      '                </wps:Data>\n' +
      '              </wps:Input>\n' +
      '            </wps:DataInputs>\n' +
      '            <wps:ResponseForm>\n' +
      '              <wps:RawDataOutput mimeType="application/json">\n' +
      '                <ows:Identifier>result</ows:Identifier>\n' +
      '              </wps:RawDataOutput>\n' +
      '            </wps:ResponseForm>\n' +
      '          </wps:Execute>\n' +
      '        </wps:Body>\n' +
      '      </wps:Reference>\n' +
      '    </wps:Input>\n' +
      '    <wps:Input>\n' +
      '      <ows:Identifier>targetCRS</ows:Identifier>\n' +
      '      <wps:Data>\n' +
      '        <wps:LiteralData><SRSNAME></wps:LiteralData>\n' +
      '      </wps:Data>\n' +
      '    </wps:Input>\n' +
      '  </wps:DataInputs>\n' +
      '  <wps:ResponseForm>\n' +
      '    <wps:RawDataOutput mimeType="<MIMETYPE>">\n' +
      '      <ows:Identifier>result</ows:Identifier>\n' +
      '    </wps:RawDataOutput>\n' +
      '  </wps:ResponseForm>\n' +
      '</wps:Execute>';

    let _data2 = _data
      .replace("<WFSURL>", encodeURI(suggestions.url).replace(/&/g, '&amp;'))
      .replace("<FEATUREID>", suggestions.feature.id)
      .replace("<SRSNAME>", "EPSG:4326")
      .replace("<MIMETYPE>", "application/json");
    let url = suggestions.wpsserviceurl;
    console.log("POST", url, _data2);
    axios({
      method: 'post',
      url: url,
      headers: { 'content-type': 'text/xml' },
      data: _data2
    })
      .then((response) => {
        console.log("SearchAutocomplete.handleChange() response:", response.data);
        let feature_coll = (new GeoJSON()).readFeatures(response.data);
        console.log('SearchAutocomplete.handleChange() geojson -->', (new GeoJSON()).writeFeature(feature_coll[0]));
        let feature_wkt = (new WKT()).writeFeature(feature_coll[0]);

        let filter = '&cql_filter=INTERSECTS(geom,' + feature_wkt + ')';

        console.log("SearchAutocomplete.handleChange() filter -->", filter);
        let viewparams = decodeURIComponent(window.location.hash).replace(/^#\//, '');
        this.props.updateLayersWithViewparams(viewparams.split("/"));
        this.props.addFeatures("regioni_province", response.data);
        this.props.changeSearchAutocomplete({ 
          selectedItem: this.state.selectedItem,
          selectedItemRegProv: this.state.selectedItemRegProv,
          selectedItemTassonomia: this.state.selectedItemTassonomia,
          features: response.data, 
          filter: filter 
        });
        this.handleHistory({
          selectedItem: this.state.selectedItem,
          selectedItemRegProv: this.state.selectedItemRegProv,
          selectedItemTassonomia: this.state.selectedItemTassonomia,
          features: response.data,
          filter: filter
        });
      })
      .catch((error) => {
        console.error(error);
      });
  }

  handleHistory = (searchAutocomplete) => {
    let viewparams = decodeURIComponent(window.location.hash).replace(/^#\//, '');
    let doc = {
      _id: viewparams,
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

  handleDelete = item => () => {
    console.log("SearchAutocomplete.handleDelete()", item);

    let { selectedItem, selectedItemRegProv, selectedItemTassonomia } = this.state;

    let record = this.getSuggestions(item)[0];
    if (record.mask === '<REGPROV>') {
      selectedItemRegProv.splice(selectedItemRegProv.indexOf(item), 1);
    } else {
      selectedItemTassonomia.splice(selectedItemTassonomia.indexOf(item), 1);  
    }


    selectedItem = [...selectedItemRegProv, ...selectedItemTassonomia];

    console.log("SearchAutocomplete.handleDelete()",
      "selectedItem ->", JSON.stringify(selectedItem),
      "selectedItemRegProv ->", JSON.stringify(selectedItemRegProv),
      "selectedItemTassonomia ->", JSON.stringify(selectedItemTassonomia));

    this.setState({
      inputValue: '',
      selectedItem,
      selectedItemRegProv,
      selectedItemTassonomia,
    });

    let suggestions = selectedItem.map((_item) => {
      //return this.getSuggestions(_item).filter(_record => _record.label === _item)[0];
      return this.getSuggestions(_item)[0];
    });
    console.log("SearchAutocomplete.handleDelete() suggestions ->", JSON.stringify(suggestions));
    this.handlePermalinkMask(suggestions);   
    
    if (record.mask === '<REGPROV>') {
      this.props.removeFeatures("regioni_province");
      this.props.changeSearchAutocomplete({ 
        selectedItem,
        selectedItemRegProv,
        selectedItemTassonomia,        
      });
      this.handleHistory({ 
        selectedItem,
        selectedItemRegProv,
        selectedItemTassonomia,        
      });        
    } else {
      this.props.changeSearchAutocomplete({ 
        selectedItem,
        selectedItemRegProv,
        selectedItemTassonomia,
        features: this.props.local.searchAutocomplete.features,
        filter: this.props.local.searchAutocomplete.filter        
      });
      this.handleHistory({ 
        selectedItem,
        selectedItemRegProv,
        selectedItemTassonomia,
        features: this.props.local.searchAutocomplete.features,
        filter: this.props.local.searchAutocomplete.filter            
      });
    }    
  };

  handlePermalinkMask(suggestions) {
    console.log("SearchAutocomplete.handlePermalinkMask()", JSON.stringify(suggestions));
    let permalinkmask = this.props.local.mapConfig.permalinkmask.replace(/^\//, '');
    let thehash = decodeURIComponent(window.location.hash).replace(/^#\//, '');
    console.log("SearchAutocomplete.handlePermalinkMask() permalinkmask:", permalinkmask, "window.location.hash:", thehash);

    let _permalinkmaskarray = permalinkmask.split("/");
    //const _locationarray = thehash.split("/");

    _permalinkmaskarray = _permalinkmaskarray.map((_record, _index) => {
      let returnvalue = '*';

      suggestions.filter((_rec) => { return _rec.mask !== '<REGPROV>' }).forEach((_selectedRecord, idx) => {
        let _mask = _selectedRecord.mask.replace(/xx/g, '' + (idx + 1));
        if (_record === _mask) {
          returnvalue = _selectedRecord.label ? _selectedRecord.label : '*';
        }
      });

      suggestions.filter((_rec) => { return _rec.mask === '<REGPROV>' }).forEach((_selectedRecord, idx) => {
        let _mask = _selectedRecord.mask.replace(/xx/g, '' + (idx + 1));
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

  getSuggestions(inputValue) {
    //console.log("SearchAutocomplete.getSuggestions()", inputValue);
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
    //console.log("SearchAutocomplete.render()");
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

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(SearchAutocomplete)));