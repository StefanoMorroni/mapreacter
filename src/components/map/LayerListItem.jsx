import React from 'react';
import { connect } from 'react-redux';
import { DragSource, DropTarget } from 'react-dnd';
import { types, layerListItemSource, layerListItemTarget, collect, collectDrop } from '@boundlessgeo/sdk/components/layer-list-item';
import SdkLayerListItem from '@boundlessgeo/sdk/components/layer-list-item';
import Button from '@material-ui/core/Button';
import * as actions from '../../actions/map';
import * as mapActions from '@boundlessgeo/sdk/actions/map';
import { viewparams } from '../../actions/map';

var axios = require('axios');

class LayerListItem extends SdkLayerListItem {
  render() {
    const layer = this.props.layer;
    const checkbox = this.getVisibilityControl(layer);

    let fitextentbutton = null;
    if (layer.flag_fitextent) {
      fitextentbutton = (
        <Button className="button"
          onClick={() => {
            
            const featuresUrl = this.props.local.mapConfig.geoserverurl +
              '/ows?service=WFS' +
              '&version=2.0.0' +
              '&request=GetFeature' +
              '&outputFormat=application/json' +
              '&srsName=EPSG:4326' +
              '&count=100' +
              '&typeName=' + this.props.layer.name +
              '&viewparams=' + viewparams.join(';') +
              this.props.local.regProvComponent.filter
              ;

            this.props.changerefreshindicator({ status: "loading" });
            axios.get(featuresUrl)
              .then((response) => {
                console.log("LayerListItem.onClick() GET", featuresUrl, "response:", response.data);
                setTimeout(() => {
                  this.props.changerefreshindicator({ status: "hide" });
                  this.props.fitExtent(response.data.bbox, this.props.mapinfo.size, "EPSG:4326");
                  this.props.zoomOut();
                }, 500);
              })
              .catch((error) => {
                console.error("LayerListItem.onClick() GET", featuresUrl, error);
                this.props.changerefreshindicator({ status: "hide" });
              });
          }}>
          <i className="material-icons">fullscreen</i>
        </Button>
      );
    }

    let moveButtons = (
      <span className="btn-container" style={{ width: '100%' }}>
        {/* <Button mini className="button"
          onClick={() => {
            this.moveLayerUp();
          }}>
          <i className="material-icons">arrow_upward</i>
        </Button>
        <Button className="button"
          onClick={() => {
            this.moveLayerDown();
          }}>
          <i className="material-icons">arrow_downward</i>
        </Button> */}
        {fitextentbutton}
      </span>
    );

    return this.props.connectDragSource(this.props.connectDropTarget((
      <li className="sdk-layer">
        <div className="toc-container">
          <div className="div1" dangerouslySetInnerHTML={{ __html: '<span class=' + (layer.class ? layer.class : 'name') + '>' + layer.id + (layer.description ? '<br/>' + layer.description : '') + '</span>' }} />
          <div className="div2">{checkbox} </div>
          <div className="div3">{moveButtons}</div>
        </div>
      </li>
    )));
  }
}

LayerListItem = DropTarget(types, layerListItemTarget, collectDrop)(DragSource(types, layerListItemSource, collect)(LayerListItem));

const mapStateToProps = (state) => {
  return {
    map: state.map,
    local: state.local,
    mapinfo: state.mapinfo
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    changerefreshindicator: (params) => {
      dispatch(actions.changerefreshindicator(params));
    },
    fitExtent: (extent, size, projection) => {
      dispatch(mapActions.fitExtent(extent, size, projection));
    },
    zoomOut: () => {
      dispatch(mapActions.zoomOut());
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(LayerListItem);