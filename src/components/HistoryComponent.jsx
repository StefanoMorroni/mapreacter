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
import * as actions from '../actions/map';
import * as mapActions from '@boundlessgeo/sdk/actions/map';

let PouchDB = require('pouchdb-browser');
let pouchdb = PouchDB.default.defaults();
export const historydb = new pouchdb('historydb');

historydb.info().then(info => console.log('historydb.info() ->', JSON.stringify(info)));


class HistoryComponent extends Component {

    state = {
        anchorEl: null,
        rows: []
    };

    handleOpenMenu = event => {
        this.setState({ anchorEl: event.currentTarget });
        historydb.allDocs({ include_docs: true }).then((doc) => {
            this.setState({ rows: doc.rows });
        }).catch(err => {
            console.error(err);
        });
    };

    handleCloseMenu = () => {
        console.log("HistoryComponent.handleCloseMenu()");
        this.setState({ anchorEl: null });
    };

    componentDidMount() {
        console.log("HistoryComponent.componentDidMount()");
    }

    deleteRecord = id => {
        console.log("HistoryComponent.deleteRecord() id ->", id);
        historydb.get(id).then(doc => {
            return historydb.remove(doc);
        }).then(() => {
            historydb.allDocs({ include_docs: true }).then((doc) => {
                this.setState({ rows: doc.rows });
            }).catch(err => {
                console.error(err);
            });
        }).catch(function (err) {
            console.error(err);
        });
    }

    goTo = id => {
        console.log("HistoryComponent.goTo() id ->", id);
        this.props.removeFeatures("regioni_province");
        historydb.get(id).then(doc => {
            console.log('HistoryComponent.goTo(), get ->', JSON.stringify(doc));
            this.props.changeSearchAutocomplete(doc.searchAutocomplete);
            if (doc.searchAutocomplete.features) {
                this.props.addFeatures("regioni_province", doc.searchAutocomplete.features);
            }
            this.props.setViewParams(doc._id);
            this.props.updateLayersWithViewparams(doc._id.split("/"));
            const thehash = '#/' + doc._id;
            window.history.pushState(thehash, 'map', thehash);
        });
    }

    render() {
        const { anchorEl, rows } = this.state;
        console.log("HistoryComponent.render() rows.length -> ", rows.length);
        return (
            <div>
                <Tooltip title='Storico delle ricerche'>
                    <IconButton onClick={this.handleOpenMenu}>
                        <i className="material-icons">play_circle_outline</i>
                    </IconButton>
                </Tooltip>
                <Menu
                    id="menu-history"
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
                        <DialogContent style={{ padding: '20px' }}>
                            <div className="history-supercontainer">
                                {rows.map(rec => {
                                    return (
                                        <div className="history-container" key={rec.key}>
                                            <div className="div1"><span className="title">{rec.doc._id}</span> </div>
                                            <div className="div2">
                                                <Button className="button"
                                                    onClick={() => {
                                                        this.goTo(rec.doc._id);
                                                    }}>
                                                    <i className="material-icons">play_circle_outline</i>
                                                </Button>
                                                <Button className="button"
                                                    onClick={(e) => {
                                                        this.deleteRecord(rec.doc._id);
                                                    }}>
                                                    <i className="material-icons">delete</i>
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
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

const mapDispatchToProps = (dispatch) => {
    return {
        updateLayersWithViewparams: (params) => {
            dispatch(actions.updateLayersWithViewparams(params));
        },
        setViewParams: (params) => {
            dispatch(actions.setViewParams(params));
        },
        changeRegProvComponent: (params) => {
            dispatch(actions.changeRegProvComponent(params));
        },
        addFeatures: (sourceName, features) => {
            dispatch(mapActions.addFeatures(sourceName, features));
        },
        removeFeatures: (sourceName, filter) => {
            dispatch(mapActions.removeFeatures(sourceName, filter));
        },
        changeSearchAutocomplete: (params) => {
            dispatch(actions.changeSearchAutocomplete(params));
        },                
    };
};

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(HistoryComponent));