import React, { Component } from 'react';
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { withStyles } from '@material-ui/core/styles';
import SdkLayerList from '@boundlessgeo/sdk/components/layer-list';
import LayerListItem from './map/LayerListItem';
import Menu from '@material-ui/core/Menu';
import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import { mylocalizedstrings } from '../services/localizedstring';

const styles = theme => ({
    root: {
        margin: 0,
        padding: 0,
    },    
    tooltip: {
        fontSize: '16px'
    },
});

class TocComponent extends Component {

    state = {
        anchorEl: null
    };

    handleOpenMenu = event => {
        this.setState({ anchorEl: event.currentTarget });
    };

    handleCloseMenu = () => {
        console.log("TocComponent.handleCloseMenu()");
        this.setState({ anchorEl: null });
    };

    componentDidMount() {
        console.log("TocComponent.componentDidMount() this.props=", JSON.stringify(this.props));
    }

    render() {
        console.log("TocComponent.render()");
        const { anchorEl } = this.state;
        const { classes } = this.props;
        return (
            <div id="toccomponent" className={classes.root}>
                <Tooltip title={mylocalizedstrings.toc} classes={{ tooltip: classes.tooltip }}>
                    <IconButton onClick={this.handleOpenMenu}>
                        <i className="material-icons">folder_open</i>
                    </IconButton>
                </Tooltip>
                <Menu
                    id="menu-toc"
                    anchorEl={anchorEl}
                    anchorOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                    }}
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                    }}
                    open={Boolean(anchorEl)}
                    onClose={this.handleCloseMenu}
                >
                    <Dialog
                        fullWidth={true}
                        maxWidth='sm'
                        open={Boolean(anchorEl)}
                        onClose={() => { this.handleCloseMenu(); }}
                    >
                        <DialogContent style={{ padding: '10px' }}>
                        <div style={{ overflowY: 'scroll', maxHeight: '300px' }}>
                            <ul className="sdk-layer-list" >
                                <li className="sdk-layer" >
                                    <div className="toc-container">
                                        <div className="div1"><span className="title">{mylocalizedstrings.layer}</span> </div>
                                        <div className="div2"><span className="title">{mylocalizedstrings.onoff}</span> </div>
                                        <div className="div3"><span className="title">{mylocalizedstrings.fitextent}</span> </div>
                                    </div>
                                </li>
                            </ul>
                            <SdkLayerList layerClass={LayerListItem} />
                        </div>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => { this.handleCloseMenu(); }}>
                                {mylocalizedstrings.close}
                            </Button>
                        </DialogActions>
                    </Dialog>
                </Menu>
            </div>
        );
    }
}

const mapStateToProps = (state) => {
    return {
        local: state.local,
    }
}

export default withRouter(connect(mapStateToProps)(withStyles(styles)(TocComponent)));