import { css } from '@emotion/css';
import {
  Box,
  Button,
  Container,
  IconButton,
  List,
  ListItem,
  ListSubheader,
  Paper,
  TextField,
  Typography,
} from '@material-ui/core';
import Delete from '@material-ui/icons/Delete';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import io from 'socket.io-client';

const messageCss = css`
  label: message;
  &:nth-child(odd) {
    color: black;
  }
`;

const CONNECT_STATUS = {
  CONNECTED: 'connected',
  CONNECTING: 'connecting',
  DISCONNECTED: 'disconnected',
};

const buttonTextMap = (() => {
  const map = new Map();
  map.set(CONNECT_STATUS.CONNECTED, 'disconnect');
  map.set(CONNECT_STATUS.CONNECTING, 'cancel');
  map.set(CONNECT_STATUS.DISCONNECTED, 'connect');
  return map;
})();

const Connector = () => {
  const ioRef = useRef(null);
  const inputRef = useRef(null);
  const eventRef = useRef(null);
  const [url, setUrl] = useState('');
  const [listenedEvents, setListenedEvents] = useState([]);
  const [connectStatus, setConnectStatus] = useState(CONNECT_STATUS.DISCONNECTED);

  const [messages, setMessages] = useState([]);

  const appendMessage = useCallback((message) => {
    setMessages((prev) => prev.concat(message));
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const addEventListener = useCallback(() => {
    if (listenedEvents.find((event) => event.trim() === eventRef.current?.value?.trim())) {
      return;
    }
    setListenedEvents((prev) => prev.concat(eventRef.current?.value ?? ''));
    eventRef.current.value = '';
  }, [listenedEvents]);

  const removeEventListener = useCallback(
    (event) => () => {
      setListenedEvents((prev) => {
        const arr = Array.from(prev);
        const index = prev.findIndex((e) => e.trim() === event.trim());
        arr.splice(index, 1);
        return arr;
      });
    },
    [],
  );

  const connect = useCallback((e) => {
    setUrl(String(inputRef.current?.value ?? '').trim());
  }, []);

  const disconnect = useCallback((e) => {
    setUrl('');
  }, []);

  const cancelConnect = useCallback(() => {
    setUrl('');
    setConnectStatus(CONNECT_STATUS.DISCONNECTED);
  }, []);

  const buttonClickHandlerMap = useMemo(() => {
    const map = new Map();
    map.set(CONNECT_STATUS.CONNECTED, disconnect);
    map.set(CONNECT_STATUS.CONNECTING, cancelConnect);
    map.set(CONNECT_STATUS.DISCONNECTED, connect);
    return map;
  }, [cancelConnect, connect, disconnect]);

  useEffect(() => {
    if (url) {
      try {
        setConnectStatus(CONNECT_STATUS.CONNECTING);
        ioRef.current = io(url, {
          reconnectionDelayMax: 10000,
        });

        ioRef.current.on('connect', () => {
          console.log(ioRef.current.connected);
          appendMessage(`Connect to ${url} successfully.`);
          setConnectStatus(CONNECT_STATUS.CONNECTED);
        });

        ioRef.current.on('predictanomalydata', (...args) => {
          console.log(...args);
          appendMessage(args[0]);
        });

        ioRef.current.on('disconnect', (reason) => {
          if (reason === 'io client disconnect') {
            appendMessage(`Disconnect to ${url} successfully.`);
            setConnectStatus(CONNECT_STATUS.DISCONNECTED);
          }
          console.log(reason);
          if (reason === 'io server disconnect') {
            appendMessage('reconnecting to server.');
            // the disconnection was initiated by the server, you need to reconnect manually
            ioRef.current.connect();
          }
          // else the socket will automatically try to reconnect
        });
        return () => {
          ioRef.current.disconnect();
        };
      } catch (e) {
        console.error(e);
      }
    }
  }, [url, appendMessage]);

  useEffect(() => {
    const eventHandlerMap = new Map();
    if (connectStatus === CONNECT_STATUS.CONNECTED) {
      listenedEvents.forEach((event) => {
        const eh = (e) => {
          console.log(e);
          appendMessage(`${event}: ${e}`);
        };
        eventHandlerMap.set(event, eh);
        ioRef.current.addEventListener(event, eh);
      });
      return () => {
        listenedEvents.forEach((event) => {
          ioRef.current.removeEventListener(event, eventHandlerMap.get(event));
        });
      };
    }
  }, [listenedEvents, appendMessage, connectStatus]);

  return (
    <Container maxWidth="md">
      <Box display="flex" flexDirection="column" gap={2} pt={2} pb={2}>
        <Box display="flex" gap={1} alignItems="center">
          <TextField
            className={css`
              flex: 1;
            `}
            label="address"
            placeholder="Socket.IO server address(includes protocol)"
            variant="filled"
            size="small"
            inputRef={inputRef}
            disabled={connectStatus === CONNECT_STATUS.CONNECTING}
          />
          <Button onClick={buttonClickHandlerMap.get(connectStatus)}>
            {buttonTextMap.get(connectStatus)}
          </Button>
        </Box>
        <Box>
          <List
            subheader={
              <ListSubheader component="div" id="nested-list-subheader">
                Listened Events
              </ListSubheader>
            }
          >
            {listenedEvents.map((event) => (
              <ListItem key={event} dense>
                {event}

                <IconButton edge="end" aria-label="delete" onClick={removeEventListener(event)}>
                  <Delete />
                </IconButton>
              </ListItem>
            ))}
          </List>
          <Box display="flex" alignItems="center">
            <TextField
              label="event"
              variant="filled"
              size="small"
              inputRef={eventRef}
              disabled={connectStatus !== CONNECT_STATUS.CONNECTED}
            />
            <Button
              onClick={addEventListener}
              disabled={connectStatus !== CONNECT_STATUS.CONNECTED}
            >
              add Event
            </Button>
          </Box>
        </Box>
        <Box>
          <Button onClick={clearMessages}>Clear Messages</Button>
        </Box>
        <Box height="100%" width="100%">
          <Paper
            sx={{
              padding: '8px 16px',
              background: '#939597',
              height: '100%',
              minHeight: '200px',
              maxHeight: '400px',
              overflow: 'auto',
            }}
          >
            {messages.map((message, index) => (
              <Typography key={`${index}: ${message}`} className={messageCss}>
                {message}
              </Typography>
            ))}
          </Paper>
        </Box>
      </Box>
    </Container>
  );
};
export default memo(Connector);
