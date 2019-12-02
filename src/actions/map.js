import * as mapActions from '@boundlessgeo/sdk/actions/map';
import { createWMSSourceWithLayerName } from '../services/wms/wmslayer'

export const viewparams = [];


export const updateLayersWithViewparams = (params) => {
  console.log("map.updateLayersWithViewparams()", params);
  return function (dispatch, getState) {
    const { local } = getState();

    let permalinkmask = local.mapConfig.permalinkmask.replace(/^\//, '');    
    let permalinkmaskarray = permalinkmask.split("/");
    
    viewparams.length = 0;
    /*params.forEach((param, i) => {
      if (param !== '*') {
        let paramEscaped = param.replace(",", "\\,").replace(";", "\\;");
        viewparams.push(local.mapConfig.viewparams[i] + ':' + paramEscaped);
      }
    });*/

    let counter = 0;
    for (let i = 0; i < local.mapConfig.tassonomialength; i++) {
      if (params[i]) {
        if (params[i] !== '*') {
          let paramEscaped = params[i].replace(",", "\\,").replace(";", "\\;");
          if (local.mapConfig.viewparams[i]) {
            viewparams.push(local.mapConfig.viewparams[i] + ':' + paramEscaped);
            counter++;
          }
        }
      }
    }
    if (counter === 0) {
      let _item = local.mapConfig.viewparams[0] + ':none';
      console.log("map.updateLayersWithViewparams() aggiungo ", _item);
      viewparams.push(_item);
    }

    counter = 0;
    for (let i = local.mapConfig.tassonomialength; i < local.mapConfig.tassonomialength*2; i++) {
      if (params[i]) {
        if (params[i] !== '*') {
          let paramEscaped = params[i].replace(",", "\\,").replace(";", "\\;");
          if (local.mapConfig.viewparams[i]) {
            viewparams.push(local.mapConfig.viewparams[i] + ':' + paramEscaped);
            counter++;
          }
        }
      }
    }
    if (counter === 0) {
      let _item = local.mapConfig.viewparams[local.mapConfig.tassonomialength] + ':none';
      console.log("map.updateLayersWithViewparams() aggiungo ", _item);
      viewparams.push(_item);
    }

    permalinkmaskarray.forEach((item, index) => {
      //console.log("map.updateLayersWithViewparams() item->", item, "index->",index);
      if (item === '<HABITAT>') {
        if (params[index] !== '*') {
          try {
            let cod_habitat = 'cod_habitat:'+params[index].split(' ')[0];
            console.log("map.updateLayersWithViewparams() aggiungo ", cod_habitat);
            viewparams.push(cod_habitat);  
          } catch(err) {}
        }            
      }
    })

    let filter='';
    if (local.regProvComponent['filter']) {
      filter=local.regProvComponent['filter'];
      console.log("map.updateLayersWithViewparams()", filter);
    }    
    local.mapConfig.layers.forEach((rec, i) => {
      if (rec.flag_filter) {
        let sourceUrl = encodeURI(local.mapConfig.source + '&viewparams=' + viewparams.join(';') + filter);
        console.log("map.updateLayersWithViewparams()", rec.id, sourceUrl);
        let source = createWMSSourceWithLayerName(sourceUrl, rec.name, rec.styles);
        const sourceId = 'source_' + i + local.mapConfig.viewparams[0] + (Math.floor(Math.random() * 1000) + 1);
        dispatch(mapActions.addSource(sourceId, source));
        let _layer = Object.assign({source: sourceId}, rec);
        dispatch(mapActions.updateLayer(rec.id, _layer));
        dispatch(mapActions.orderLayer(rec.id));
      }
    })
  }
}

export const setConfig = (config) => {
  return {
    type: 'SET_CONFIG',
    config
  };
}

export const setViewParams = (viewparams) => {
  const _viewparams = viewparams.replace(/^#\//g, "");
  return {
    type: 'SET_VIEWPARAMS',
    payload: {
      viewparams: _viewparams
    }
  };
}

export const fitextent = (layername) => {
  return {
    type: 'LOCAL.FITEXTENT',
    payload: {
      layername: layername
    }
  };
}

export const changerefreshindicator = (refreshIndicator) => {
  return {
    type: 'LOCAL.CHANGEREFRESHINDICATOR',
    payload: {
      refreshIndicator: refreshIndicator
    }
  };
}

export const changeMeasureComponent = (measureComponent) => {
  return {
    type: 'LOCAL.CHANGEMEASURECOMPONENT',
    payload: {
      measureComponent: measureComponent
    }
  };
}

export const changeRegProvComponent = (regProvComponent) => {
  return {
    type: 'LOCAL.CHANGEREGPROVCOMPONENT',
    payload: {
      regProvComponent: regProvComponent
    }
  };
}

export const changeOptions = (params) => {
  return {
    type: 'LOCAL.CHANGEOPTIONS',
    ...params,
  };
}