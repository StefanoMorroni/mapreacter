import React, { Component } from 'react';
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { withStyles } from '@material-ui/core/styles';
import Menu from '@material-ui/core/Menu';
import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';
import { mylocalizedstrings } from '../services/localizedstring';



const styles = theme => ({
    formControl: {
        margin: '5px',
    },
});



class OptionsComponent extends Component {

    state = {
        anchorEl: null,
        osservazioni: true,
        citizenscience: true,
        provider: true,
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

    handleChange = name => event => {
        console.log("OptionsComponent.handleChange()", name, event.target.checked);
        this.setState({ [name]: event.target.checked });
    };

    render() {
        console.log("OptionsComponent.render()");
        const { anchorEl } = this.state;
        const { classes } = this.props;
        return (
            <div style={{ padding: '10px' }}>
                <Tooltip title={mylocalizedstrings.options.tooltip}>
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
                        <DialogActions>
                            <Button onClick={() => { this.handleCloseMenu(); }}>
                                <i className="material-icons">close</i>
                            </Button>
                        </DialogActions>
                        <DialogContent style={{ paddingLeft: '20px' }}>
                            <FormGroup>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={this.state.osservazioni}
                                            onChange={this.handleChange('osservazioni')}
                                            //value={this.state.osservazioni}
                                            color="secondary"
                                        />
                                    }
                                    label={this.state.osservazioni ? mylocalizedstrings.options.osservazioni.trueLabel : mylocalizedstrings.options.osservazioni.falseLabel}
                                />
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={this.state.citizenscience}
                                            onChange={this.handleChange('citizenscience')}
                                            //value={this.state.osservazioni}
                                            color="secondary"
                                        />
                                    }
                                    label={this.state.citizenscience ? mylocalizedstrings.options.citizenscience.trueLabel : mylocalizedstrings.options.citizenscience.falseLabel}
                                />
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={this.state.provider}
                                            onChange={this.handleChange('provider')}
                                            //value={this.state.osservazioni}
                                            color="secondary"
                                        />
                                    }
                                    label={this.state.provider ? mylocalizedstrings.options.provider.trueLabel : mylocalizedstrings.options.provider.falseLabel}
                                />
                            </FormGroup>
                        </DialogContent>

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

export default withRouter(connect(mapStateToProps)(withStyles(styles)(OptionsComponent)));