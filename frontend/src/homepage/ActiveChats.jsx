import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { webSocketService } from '../services/websocket';
import {
  Avatar,
  Badge,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
  Box,
  styled
} from '@mui/material';

const OnlineBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: '#44b700',
    color: '#44b700',
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    '&::after': {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      animation: 'ripple 1.2s infinite ease-in-out',
      border: '1px solid currentColor',
      content: '""',
    },
  },
  '@keyframes ripple': {
    '0%': {
      transform: 'scale(.8)',
      opacity: 1,
    },
    '100%': {
      transform: 'scale(2.4)',
      opacity: 0,
    },
  },
}));

const OfflineBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: '#bdbdbd',
    color: '#bdbdbd',
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
  },
}));

const ActiveChats = () => {
  const [activeChats, setActiveChats] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Get initial active chats
    setActiveChats(webSocketService.getActiveChats());

    // Listen for active chats updates
    const handleActiveChatsUpdate = (chats) => {
      setActiveChats(chats);
    };

    webSocketService.addListener('active-chats-update', handleActiveChatsUpdate);

    return () => {
      webSocketService.removeListener('active-chats-update', handleActiveChatsUpdate);
    };
  }, []);

  const handleChatClick = (userId) => {
    // Reset unread count when entering chat
    webSocketService.resetUnreadCount(userId);
    
    // Navigate to chat page
    navigate(`/chat/${userId}`, {
      state: { 
        user: activeChats.find(chat => chat.userId === userId)
      }
    });
  };

  if (activeChats.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="textSecondary">
          No active chats. Start a conversation with someone!
        </Typography>
      </Box>
    );
  }

  return (
    <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
      {activeChats.map((chat) => (
        <ListItem
          key={chat.userId}
          alignItems="flex-start"
          button
          onClick={() => handleChatClick(chat.userId)}
          sx={{
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
            },
          }}
        >
          <ListItemAvatar>
            {chat.online ? (
              <OnlineBadge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                variant="dot"
              >
                <Avatar alt={chat.name} src={chat.profilePhoto} />
              </OnlineBadge>
            ) : (
              <OfflineBadge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                variant="dot"
              >
                <Avatar alt={chat.name} src={chat.profilePhoto} />
              </OfflineBadge>
            )}
          </ListItemAvatar>
          <ListItemText
            primary={
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography component="span" variant="body1">
                  {chat.name}
                </Typography>
                {chat.unreadCount > 0 && (
                  <Badge
                    badgeContent={chat.unreadCount}
                    color="primary"
                    sx={{ marginLeft: 1 }}
                  />
                )}
              </Box>
            }
            secondary={
              <Typography
                component="span"
                variant="body2"
                color="textSecondary"
                sx={{
                  display: '-webkit-box',
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}
              >
                {chat.lastMessage || 'No messages yet'}
              </Typography>
            }
          />
        </ListItem>
      ))}
    </List>
  );
};

export default ActiveChats; 