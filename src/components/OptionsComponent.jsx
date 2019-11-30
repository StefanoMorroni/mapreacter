import React, { Component } from 'react';
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import Menu from '@material-ui/core/Menu';
import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import { mylocalizedstrings } from '../services/localizedstring';

class OptionsComponent extends Component {

    state = {
        anchorEl: null
    };

    handleOpenMenu = event => {
        this.setState({ anchorEl: event.currentTarget });
    };

    handleCloseMenu = () => {
        console.log("OptionsComponent.handleCloseMenu()");
        this.setState({ anchorEl: null });
    };

    componentDidMount() {
        console.log("OptionsComponent.componentDidMount() this.props=", JSON.stringify(this.props));
    }

    render() {
        console.log("OptionsComponent.render()");
        const { anchorEl } = this.state;
        return (
            <div>
                <Tooltip title={mylocalizedstrings.options}>
                    <IconButton onClick={this.handleOpenMenu}>
                        <i className="material-icons">tune</i>
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

export default withRouter(connect(mapStateToProps)(OptionsComponent));