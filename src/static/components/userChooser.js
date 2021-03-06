import React, {PureComponent} from "react";
import Grid from "@material-ui/core/Grid";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import PropTypes from "prop-types";
import UserTypes from "./enums/userTypes";

class UserChooser extends PureComponent {
    handleUserClick = userType => () => this.props.onChooseUser(userType);

    render() {
        return (
            <Grid item container direction="column">
                <Grid item container justify="center" style={{marginTop: "20px"}}>
                    <Typography>What are you here for?</Typography>
                </Grid>
                <Grid item container justify="center" alignItems="center">
                    <Grid item style={{paddingRight:"10px"}}>
                        <Button onClick={this.handleUserClick(UserTypes.TRANSLATOR)} color="primary" size="large" variant="contained">{UserTypes.TRANSLATOR}</Button>
                    </Grid>
                    <Grid item>
                        <Button onClick={this.handleUserClick(UserTypes.USER)} color="primary" size="large" variant="contained">{UserTypes.USER}</Button>
                    </Grid>
                </Grid>
            </Grid>
        );
    }
}

UserChooser.propTypes = {
    onChooseUser: PropTypes.func.isRequired
}

export default UserChooser;
