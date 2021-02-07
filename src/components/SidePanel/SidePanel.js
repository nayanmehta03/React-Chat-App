import React from "react";
import Channels from "./Channels";
import UserPanel from "./UserPanel";
import { Menu } from "semantic-ui-react";

class SidePanel extends React.Component {
  render() {
    const { currentUser } = this.props;

    return (
      <Menu
        size="large"
        inverted
        fixed="left"
        vertical
        style={{
          background: "#061A40",
          fontSize: "1.2rem",
        }}
      >
        <UserPanel currentUser={currentUser} />
        <Channels currentUser={currentUser} />
        {/* <DirectMessages /> */}
      </Menu>
    );
  }
}

export default SidePanel;
