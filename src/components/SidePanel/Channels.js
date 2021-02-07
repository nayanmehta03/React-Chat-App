import React from "react";
import firebase from "../../firebase";
import { setCurrentChannel } from "../../actions";
import { connect } from "react-redux";
import { Menu, Icon, Modal, Form, Input, Button, Label } from "semantic-ui-react";
import { ToastContainer, toast } from "react-toastify";

import "react-toastify/dist/ReactToastify.css";

const addedChannel = () =>
  toast.success("😃 Channel was successfully created.", {
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
  });

const wrongId = () =>
  toast.error("😢 Wrong Join Id", {
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
  });

const joinedChannel = (name) =>
  toast.info(`😃 Welcome to ${name}.`, {
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
  });

class Channels extends React.Component {
  state = {
    firstLoad: true,
    activeChannel: "",
    user: this.props.currentUser,
    channel: null,
    channels: [],
    joinId: "",
    channelName: "",
    channelDetails: "",
    channelsRef: firebase.database().ref("channels"),
    messagesRef: firebase.database().ref("messages"),
    notifications: [],
    addModal: false,
    selectModal: false,
    joinModal: false,
    hoverAdd: false,
  };

  componentDidMount() {
    this.addListeners();
  }
  componentWillUnmount() {
    this.removeListeners();
  }

  setFirstChannel = () => {
    const firstChannel = this.state.channels[0];
    if (this.state.firstLoad && this.state.channels.length > 0) {
      this.props.setCurrentChannel(firstChannel);
      this.setActiveChannel(firstChannel);
      this.setState({channel: firstChannel});
    }
    this.setState({ firstLoad: false });
  };
  removeListeners = () => {
    this.state.channelsRef.off();
    this.state.channel.forEach(channel => {
      this.state.messagesRef.child(channel.id).off()
    })
  };
  addListeners = () => {
    let loadedChannels = [];
    this.state.channelsRef.on("child_added", (snap) => {
      if (snap.val().participants.find((e) => 
       e.id === this.state.user.uid
      )) {
        loadedChannels.push(snap.val());
      }
      this.setState({ channels: loadedChannels }, () => this.setFirstChannel());
      this.addNotificationListener(snap.key)
    });
  };
  addNotificationListener = channelId => {
    this.state.messagesRef.child(channelId).on("value", (snap) => {
      if (this.state.channel) {
        this.handleNotifications(
          channelId,
          this.state.channel.id,
          this.state.notifications,
          snap
        );
      }
    });
  };
  handleNotifications = (channelId, currentChannelId, notifications,snap) => {
    let lastTotal = 0;
    let index = notifications.findIndex((notification) => notification.id === channelId);
    if(index !== -1){
      if(channelId !== currentChannelId){
        lastTotal = notifications[index].total; 
        if(snap.numChildren() - lastTotal >0){
          notifications[index].count = snap.numChildren() - lastTotal;
        }
      }
      notifications[index].lastTotal = snap.numChildren();
    }else{
      notifications.push({
        id: channelId,
        total: snap.numChildren(),
        lastKnownTotal:snap.numChildren(),
        count:0
      })
    }
    this.setState({notifications})
  }

  addChannel = () => {
    const { channelsRef, channelName, channelDetails, user } = this.state;

    const key = channelsRef.push().key;

    const newChannel = {
      id: key,
      name: channelName,
      details: channelDetails,
      createdBy: {
        name: user.displayName,
        avatar: user.photoURL,
      },
      participants: [{id:user.uid,name: user.displayName,
        avatar: user.photoURL,}],
    };

    channelsRef
      .child(key)
      .update(newChannel)
      .then(() => {
        this.setState({ channelName: "", channelDetails: "" });
        this.closeSelectModal();
        this.closeAddModal();
        console.log("channel added");
        addedChannel();
        this.displayChannels();
      })
      .catch((err) => {
        console.error(err);
      });
  };

  handleAddSubmit = (event) => {
    event.preventDefault();
    if (this.isFormValid(this.state)) {
      this.addChannel();
    }
  };

  handleChange = (event) => {
    this.setState({ [event.target.name]: event.target.value });
  };
  changeChannel = (channel) => {
    this.setActiveChannel(channel);
    this.clearNotifications();
    this.props.setCurrentChannel(channel);
    this.setState({channel: channel});
  };

  clearNotifications = () => {
    let index = this.state.notifications.findIndex(
      notification => notification.id === this.state.channel.id
    );

    if (index !== -1) {
      let updatedNotifications = [...this.state.notifications];
      updatedNotifications[index].total = this.state.notifications[
        index
      ].lastKnownTotal;
      updatedNotifications[index].count = 0;
      this.setState({ notifications: updatedNotifications });
    }
  };


  setActiveChannel = (channel) => {
    this.setState({ activeChannel: channel.id });
  };

  getNotificationCount = channel => {
    let count = 0;

    this.state.notifications.forEach(notification => {
      if (notification.id === channel.id) {
        count = notification.count;
      }
    });

    if (count > 0) return count;
  };

  displayChannels = (channels) =>
    channels.length > 0 &&
    channels.map((channel) => (
      <Menu.Item
        key={channel.id}
        onClick={() => this.changeChannel(channel)}
        name={channel.name}
        style={{ opacity: 0.7 }}
        active={channel.id === this.state.activeChannel}
      >
         {this.getNotificationCount(channel) && (
          <Label color="red">{this.getNotificationCount(channel)}</Label>
        )}
        #{channel.name}
      </Menu.Item>
    ));

  joinChannel = (id) => {
    const { channelsRef, user, channels } = this.state;
    let self = this;
    firebase
      .database()
      .ref("/channels/" + id)
      .once("value")
      .then(function (snapshot) {
        if (snapshot.val()) {
          channelsRef.child(id).update({
            participants: [...snapshot.val().participants, {id:user.uid,name: user.displayName,
              avatar: user.photoURL,}],
          });
          self.displayChannels(channels);
          joinedChannel(snapshot.val().name);
        } else {
          wrongId();
        }
      });
  };

  handleJoinSubmit = (event) => {
    event.preventDefault();
    if (this.state.joinId) {
      this.closeJoinModal();
      this.closeSelectModal();
      this.joinChannel(this.state.joinId);
    }
  };

  handleMouseEnter = () => this.setState({ hoverAdd: true });

  handleMouseLeave = () => this.setState({ hoverAdd: false });

  isFormValid = ({ channelName, channelDetails }) =>
    channelName && channelDetails;

  openAddModal = () => this.setState({ addModal: true });

  closeAddModal = () => this.setState({ addModal: false });
  openSelectModal = () => this.setState({ selectModal: true });

  closeSelectModal = () => this.setState({ selectModal: false });

  openJoinModal = () => this.setState({ joinModal: true });

  closeJoinModal = () => this.setState({ joinModal: false });

  render() {
    const { channels, addModal, selectModal, joinModal } = this.state;

    return (
      <React.Fragment>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
        <Menu.Menu className="menu" style={{ paddingBottom: "2em" }}>
          <Menu.Item style={{ color: "#B9D6F2" }}>
            <span>
              <Icon name="chain" /> CHANNELS
            </span>{" "}
            ({channels.length}){" "}
            <Icon
              name="add"
              color={this.state.hoverAdd ? "blue" : "#B9D6F2"}
              onClick={this.openSelectModal}
              onMouseEnter={this.handleMouseEnter}
              onMouseLeave={this.handleMouseLeave}
            />
          </Menu.Item>
          {/* Channels */}
          <div style={{ paddingLeft: 22 }}>
            {this.displayChannels(channels)}
          </div>
        </Menu.Menu>

        {/* Option to Add or Join Modal */}
        <Modal open={selectModal} closeIcon onClose={this.closeSelectModal}>
          <Modal.Header>Join a channel or Create one yourself</Modal.Header>
          <Modal.Actions>
            <Button color="green" inverted onClick={this.openAddModal}>
              <Icon name="add" /> Create a Channel
            </Button>

            <Button color="red" inverted onClick={this.openJoinModal}>
              <Icon name="share" />
              Join a Channel
            </Button>
          </Modal.Actions>
        </Modal>

        {/* Join Channels */}
        <Modal open={joinModal} closeIcon onClose={this.closeJoinModal}>
          <Modal.Header>Join a Channel</Modal.Header>
          <Modal.Content>
            <Form>
              <Form.Field>
                <Input
                  fluid
                  label="Enter channel code"
                  name="joinId"
                  onChange={this.handleChange}
                />
              </Form.Field>
            </Form>
          </Modal.Content>
          <Modal.Actions>
            <Button color="green" inverted onClick={this.handleJoinSubmit}>
              <Icon name="checkmark" /> Join
            </Button>
            <Button color="red" inverted onClick={this.closeJoinModal}>
              <Icon name="remove" /> Cancel
            </Button>
          </Modal.Actions>
        </Modal>

        {/* Add Channel Modal */}
        <Modal open={addModal} closeIcon onClose={this.closeAddModal}>
          <Modal.Header>Add a Channel</Modal.Header>
          <Modal.Content>
            <Form onSubmit={this.handleAddSubmit}>
              <Form.Field>
                <Input
                  fluid
                  label="Name of Channel"
                  name="channelName"
                  onChange={this.handleChange}
                />
              </Form.Field>

              <Form.Field>
                <Input
                  fluid
                  label="About the Channel"
                  name="channelDetails"
                  onChange={this.handleChange}
                />
              </Form.Field>
            </Form>
          </Modal.Content>

          <Modal.Actions>
            <Button color="green" inverted onClick={this.handleAddSubmit}>
              <Icon name="checkmark" /> Add
            </Button>
            <Button color="red" inverted onClick={this.closeAddModal}>
              <Icon name="remove" /> Cancel
            </Button>
          </Modal.Actions>
        </Modal>
      </React.Fragment>
    );
  }
}

export default connect(null, { setCurrentChannel })(Channels);
