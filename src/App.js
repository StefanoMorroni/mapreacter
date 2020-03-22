import 'babel-polyfill';
import React, { Component } from 'react';
import { HashRouter, Switch, Route } from 'react-router-dom'
import { createStore, combineReducers, applyMiddleware } from 'redux';
import thunkMiddleware from 'redux-thunk';
import { Provider } from 'react-redux';
import SdkMapReducer from '@boundlessgeo/sdk/reducers/map';
import * as mapActions from '@boundlessgeo/sdk/actions/map';
import SdkPrintReducer from '@boundlessgeo/sdk/reducers/print';
import SdkMapInfoReducer from '@boundlessgeo/sdk/reducers/mapinfo';
import SdkDrawingReducer from '@boundlessgeo/sdk/reducers/drawing';
import * as drawingActions from '@boundlessgeo/sdk/actions/drawing';

import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';

import { createWMSSourceWithLayerName } from './services/wms/wmslayer'
import { createVectorSourceFromStyle, createRasterSourceFromStyle } from './services/mapbox'
import MapReducer from './reducers/map';
import * as configActions from './actions/map';
import Map from './components/Map';
import TassonomiaAutoComplete from './components/TassonomiaAutoComplete';
//import { mylocalizedstrings } from './services/localizedstring';
import RefreshIndicatorComponent from './components/RefreshIndicatorComponent';
import MeasureComponent from './components/MeasureComponent';
import TocComponent from './components/TocComponent';
import LangComponent from './components/LangComponent';
import ConfComponent from './components/ConfComponent';
import RegProvAutocomplete from './components/RegProvAutocomplete';
import TheTooltip from './components/TheTooltip';
//import OptionsComponent from './components/OptionsComponent';
//import GeocodingAutoComplete from './components/GeocodingAutoComplete';
import BrowserVerComponent from './components/BrowserVerComponent';
import ErrorBoundary from './ErrorBoundary';


import './App.css';
//import {} from 'dotenv/config';
require('dotenv').config();

export const themiddleware = store => next => action => {
  switch (action.type) {
    case 'MAPINFO.SET_MOUSE_POSITION':
    case 'DRAWING_SET_MEASURE_FEATURE':
      break;
    case 'NEWDATASOURCE':
      console.log('themiddleware() current action:', action.type);
      break;
    default:
      try {
        console.log('themiddleware() current action:', JSON.stringify(action));
      } catch (error) {
        console.log('themiddleware() current action:', action);
      }
      break;
  }

  let result = next(action);

  switch (action.type) {
    case 'MAP_SET_VIEW':
      if (store.getState().local['viewparams']) {
        //const _index = store.getState().local.mapConfig.routing.length;
        const _index = store.getState().local.mapConfig.permalinkmasklength;
        const _array = store.getState().local.viewparams.split("/");
        while (_array.length < (_index + store.getState().local.mapConfig.tassonomialength)) {
          _array.push('*');
        }

        _array[_index] = store.getState().map.zoom;
        _array[_index + 1] = '' + Math.round(store.getState().map.center[0] * 100) / 100;
        _array[_index + 2] = '' + Math.round(store.getState().map.center[1] * 100) / 100;
        _array[_index + 3] = store.getState().map.bearing;
        const thehash = '#/' + _array.join('/');
        console.log('themiddleware()', thehash);
        window.history.pushState(thehash, 'map', thehash);
      }
      break;

    case 'DRAWING_FINALIZE_MEASURE_FEATURE':
      store.dispatch(drawingActions.endDrawing());
      setTimeout(function () {
        console.log('timeout ...');
        store.dispatch(configActions.changeMeasureComponent({ open: false }));
      }, 2000);
      break;

    default:
      break;
  }

  /*console.log('themiddleware() current state:', JSON.stringify(store.getState(), (key, value) => {
    if (key === 'component') return '...';
    return value;
  }));*/
  return result;
}

export const store = createStore(
  combineReducers({
    map: SdkMapReducer,
    mapinfo: SdkMapInfoReducer,
    print: SdkPrintReducer,
    drawing: SdkDrawingReducer,
    local: MapReducer,
  }),
  window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__(),
  applyMiddleware(themiddleware, thunkMiddleware));

class App extends Component {

  config = {};
  state = {
    sharedialog: false,
  };

  constructor(props) {
    super(props);
    console.log("App()");

    this.config = window.config;
    store.dispatch(configActions.setConfig(this.config));

    store.dispatch(mapActions.updateMetadata(this.config.groups));

    // Background layers change the background color of
    // the map. They are not attached to a source.
    store.dispatch(mapActions.addLayer({
      id: 'background',
      type: 'background',
      paint: {
        'background-color': '#eee',
      },
      metadata: {
        'bnd:hide-layerlist': true,
      },
    }));

    if (this.config.source && this.config.layers) {
      this._createLayers(this.config.source, this.config.layers);
    }

    const _array = window.location.hash
      .split("/")
      .filter(item => item !== '#');
    if (_array.length >= store.getState().local.mapConfig.permalinkmasklength + 3) {
      let center = [Number(_array[store.getState().local.mapConfig.permalinkmasklength + 1]), Number(_array[store.getState().local.mapConfig.permalinkmasklength + 2])];
      let zoom = Number(_array[store.getState().local.mapConfig.permalinkmasklength]);
      store.dispatch(mapActions.setView(center, zoom));
    } else if (this.config.map && this.config.map.center) {
      store.dispatch(mapActions.setView(this.config.map.center, this.config.map.zoom || 2));
    }

    store.dispatch(mapActions.addSource('regioni_province', {
      type: 'geojson',
      name: 'regioni_province',
      //crs: { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
      data: {
        type: "FeatureCollection",
        features: []
      }
    }));
    store.dispatch(mapActions.addLayer({
      id: 'regioni_province',
      source: 'regioni_province',
      type: 'fill',
      paint: {
        'fill-opacity': 0.5,
        'fill-color': '#feb24c',
        'fill-outline-color': '#f03b20',
      },
      metadata: {
        'bnd:hide-layerlist': true,
        'bnd:queryable': false,
      },
    }));

    store.dispatch(mapActions.addSource('geocoding', {
      type: 'geojson',
      name: 'geocoding',
      //crs: { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
      data: {
        type: "FeatureCollection",
        features: []
      }
    }));
    store.dispatch(mapActions.addLayer({
      id: 'geocoding',
      source: 'geocoding',
      type: 'fill',
      paint: {
        'fill-opacity': 0.5,
        'fill-color': '#46f46f',
        'fill-outline-color': '#f03b20',
      },
      metadata: {
        'bnd:hide-layerlist': true,
        'bnd:queryable': false,
      },
    }));
  }

  componentDidMount() {
    console.log("App.componentDidMount()");
  }

  render() {
    console.log("App.render()");
    return (
      <div style={{ width: '100%', height: '100%' }}>
        <ErrorBoundary>
          <MuiThemeProvider theme={createMuiTheme(this.config.ispraTheme)}>
            <Provider store={store}>
              <HashRouter>
                <div style={{ width: '100%', height: '100%' }}>

                  <RefreshIndicatorComponent />
                  <MeasureComponent />

                  <AppBar position="static">
                    <Toolbar id="toolbar">

                      <BrowserVerComponent />

                      <ConfComponent />

                      <TocComponent />

                      {/* <OptionsComponent /> */}

                      <TheTooltip id="tooltip1" label='tassonomiainfo' />

                      <TassonomiaAutoComplete />

                      <TheTooltip id="tooltip2" label='regprovinfo' />

                      <RegProvAutocomplete />

                      <LangComponent style={{ position: 'absolute', top: '20px', right: '40px', width: '70px', color: 'currentColor' }} />

                    </Toolbar>
                  </AppBar>

                  <ErrorBoundary>
                    <Switch>
                      <Route path="/:viewparams+" render={(props) => (
                        <Map {...props} />
                      )} />
                      <Route exact path="/" component={Map} />
                    </Switch>
                  </ErrorBoundary>
                </div>
              </HashRouter>
            </Provider>
          </MuiThemeProvider>
        </ErrorBoundary>
      </div>
    );
  }


  _createLayers(sourceUrl, layers) {
    console.log("_createLayers()", sourceUrl, layers);
    layers.forEach((rec, i) => {
      if (rec.id === 'osm') {
        // add the OSM source
        store.dispatch(mapActions.addOsmSource('osm'));

        // and an OSM layer.
        // Raster layers need not have any paint styles.
        store.dispatch(mapActions.addLayer(rec));

      } else if (rec.id === 'mapbox') {
        let source;
        switch (this.config.mapbox.type) {
          case 'raster':
            source = createRasterSourceFromStyle(this.config.mapbox.style, this.config.mapbox.token);
            break;
          default:
            source = createVectorSourceFromStyle(this.config.mapbox.style);
        }
        store.dispatch(mapActions.addSource('mapbox', source));
        store.dispatch(mapActions.addLayer(rec));

      } else {
        let source = createWMSSourceWithLayerName(sourceUrl, rec.name, rec.styles);
        const sourceId = 'source_' + i;
        store.dispatch(mapActions.addSource(sourceId, source));
        let _layer = Object.assign({ source: sourceId }, rec);
        store.dispatch(mapActions.addLayer(_layer));
      }
    });
  }

}

export default App;
