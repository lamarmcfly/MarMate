import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';

// WebSocket connection status
export enum ConnectionStatus {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting',
  FAILED = 'failed',
}

// WebSocket message types
export enum MessageType {
  CONVERSATION_UPDATE = 'conversation_update',
  SPECIFICATION_READY = 'specification_ready',
  CODE_GENERATION_PROGRESS = 'code_generation_progress',
  CODE_GENERATION_COMPLETE = 'code_generation_complete',
  ERROR = 'error',
  HEARTBEAT = 'heartbeat',
}

// WebSocket message interface
export interface WebSocketMessage {
  type: MessageType | string;
  payload: any;
  timestamp: string;
  channel?: string;
}

// Channel configuration
export interface ChannelConfig {
  url: string;
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
  reconnectInterval?: number;
  heartbeatInterval?: number;
}

// WebSocket context type
interface WebSocketContextType {
  // Connection management
  connect: (channel: string, config: ChannelConfig) => void;
  disconnect: (channel: string) => void;
  disconnectAll: () => void;
  getStatus: (channel: string) => ConnectionStatus;
  isConnected: (channel: string) => boolean;
  
  // Message handling
  sendMessage: (channel: string, type: string, payload: any) => boolean;
  
  // Event subscription
  subscribe: <T = any>(
    channel: string,
    type: string | string[],
    callback: (message: WebSocketMessage & { payload: T }) => void
  ) => () => void;
  
  // Last message access
  getLastMessage: <T = any>(channel: string, type?: string) => (WebSocketMessage & { payload: T }) | null;
}

// Create context with default values
const WebSocketContext = createContext<WebSocketContextType>({
  connect: () => {},
  disconnect: () => {},
  disconnectAll: () => {},
  getStatus: () => ConnectionStatus.DISCONNECTED,
  isConnected: () => false,
  sendMessage: () => false,
  subscribe: () => () => {},
  getLastMessage: () => null,
});

// Hook for using WebSocket context
export const useWebSocket = () => useContext(WebSocketContext);

// WebSocket provider props
interface WebSocketProviderProps {
  children: ReactNode;
  baseUrl?: string;
}

// WebSocket provider component
export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ 
  children,
  baseUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:5678',
}) => {
  // State and refs
  const [connectionStatus, setConnectionStatus] = useState<Record<string, ConnectionStatus>>({});
  const [lastMessages, setLastMessages] = useState<Record<string, Record<string, WebSocketMessage>>>({});
  
  // Refs to store WebSocket instances and configs
  const websocketsRef = useRef<Record<string, WebSocket>>({});
  const configsRef = useRef<Record<string, ChannelConfig>>({});
  const reconnectAttemptsRef = useRef<Record<string, number>>({});
  const reconnectTimersRef = useRef<Record<string, number>>({});
  const heartbeatTimersRef = useRef<Record<string, number>>({});
  const subscribersRef = useRef<Record<string, Record<string, Set<(message: WebSocketMessage) => void>>>>({});
  
  // Clean up function for timers and WebSocket connections
  const cleanup = useCallback((channel?: string) => {
    if (channel) {
      // Clean up specific channel
      if (websocketsRef.current[channel]) {
        websocketsRef.current[channel].close();
        delete websocketsRef.current[channel];
      }
      
      if (reconnectTimersRef.current[channel]) {
        window.clearTimeout(reconnectTimersRef.current[channel]);
        delete reconnectTimersRef.current[channel];
      }
      
      if (heartbeatTimersRef.current[channel]) {
        window.clearInterval(heartbeatTimersRef.current[channel]);
        delete heartbeatTimersRef.current[channel];
      }
      
      delete reconnectAttemptsRef.current[channel];
      delete configsRef.current[channel];
      delete subscribersRef.current[channel];
    } else {
      // Clean up all channels
      Object.keys(websocketsRef.current).forEach((ch) => {
        if (websocketsRef.current[ch]) {
          websocketsRef.current[ch].close();
        }
      });
      
      Object.keys(reconnectTimersRef.current).forEach((ch) => {
        if (reconnectTimersRef.current[ch]) {
          window.clearTimeout(reconnectTimersRef.current[ch]);
        }
      });
      
      Object.keys(heartbeatTimersRef.current).forEach((ch) => {
        if (heartbeatTimersRef.current[ch]) {
          window.clearInterval(heartbeatTimersRef.current[ch]);
        }
      });
      
      websocketsRef.current = {};
      reconnectTimersRef.current = {};
      heartbeatTimersRef.current = {};
      reconnectAttemptsRef.current = {};
      configsRef.current = {};
      subscribersRef.current = {};
    }
  }, []);
  
  // Handle WebSocket message
  const handleMessage = useCallback((channel: string, event: MessageEvent) => {
    try {
      // Parse message
      const message: WebSocketMessage = JSON.parse(event.data);
      
      // Add channel and timestamp if not present
      message.channel = message.channel || channel;
      message.timestamp = message.timestamp || new Date().toISOString();
      
      // Store last message by type
      setLastMessages((prev) => ({
        ...prev,
        [channel]: {
          ...(prev[channel] || {}),
          [message.type]: message,
        },
      }));
      
      // Notify subscribers
      if (subscribersRef.current[channel]) {
        // Notify type-specific subscribers
        if (subscribersRef.current[channel][message.type]) {
          subscribersRef.current[channel][message.type].forEach((callback) => {
            try {
              callback(message);
            } catch (error) {
              console.error(`Error in WebSocket subscriber callback for ${message.type}:`, error);
            }
          });
        }
        
        // Notify wildcard subscribers
        if (subscribersRef.current[channel]['*']) {
          subscribersRef.current[channel]['*'].forEach((callback) => {
            try {
              callback(message);
            } catch (error) {
              console.error(`Error in WebSocket wildcard subscriber callback:`, error);
            }
          });
        }
      }
      
      // Handle heartbeat response
      if (message.type === MessageType.HEARTBEAT) {
        // Reset heartbeat timer
        if (heartbeatTimersRef.current[channel]) {
          window.clearInterval(heartbeatTimersRef.current[channel]);
        }
        
        const config = configsRef.current[channel];
        if (config && config.heartbeatInterval) {
          startHeartbeat(channel, config.heartbeatInterval);
        }
      }
    } catch (error) {
      console.error(`Error handling WebSocket message for channel ${channel}:`, error);
    }
  }, []);
  
  // Start heartbeat for a channel
  const startHeartbeat = useCallback((channel: string, interval: number) => {
    if (heartbeatTimersRef.current[channel]) {
      window.clearInterval(heartbeatTimersRef.current[channel]);
    }
    
    heartbeatTimersRef.current[channel] = window.setInterval(() => {
      const ws = websocketsRef.current[channel];
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: MessageType.HEARTBEAT,
          payload: { timestamp: new Date().toISOString() },
        }));
      }
    }, interval);
  }, []);
  
  // Connect to a WebSocket channel
  const connect = useCallback((channel: string, config: ChannelConfig) => {
    // Store config
    configsRef.current[channel] = config;
    
    // Clean up existing connection
    cleanup(channel);
    
    // Update status
    setConnectionStatus((prev) => ({
      ...prev,
      [channel]: ConnectionStatus.CONNECTING,
    }));
    
    try {
      // Create WebSocket
      const ws = new WebSocket(config.url);
      websocketsRef.current[channel] = ws;
      
      // Set up event handlers
      ws.onopen = () => {
        console.log(`WebSocket connected for channel: ${channel}`);
        
        // Reset reconnect attempts
        reconnectAttemptsRef.current[channel] = 0;
        
        // Update status
        setConnectionStatus((prev) => ({
          ...prev,
          [channel]: ConnectionStatus.CONNECTED,
        }));
        
        // Start heartbeat if configured
        if (config.heartbeatInterval) {
          startHeartbeat(channel, config.heartbeatInterval);
        }
      };
      
      ws.onmessage = (event) => handleMessage(channel, event);
      
      ws.onclose = (event) => {
        console.log(`WebSocket closed for channel: ${channel}`, event);
        
        // Clear heartbeat timer
        if (heartbeatTimersRef.current[channel]) {
          window.clearInterval(heartbeatTimersRef.current[channel]);
          delete heartbeatTimersRef.current[channel];
        }
        
        // Update status
        setConnectionStatus((prev) => ({
          ...prev,
          [channel]: ConnectionStatus.DISCONNECTED,
        }));
        
        // Attempt reconnect if enabled
        if (config.autoReconnect !== false) {
          const maxAttempts = config.maxReconnectAttempts || 10;
          const baseInterval = config.reconnectInterval || 1000;
          
          // Get current attempt count
          const attempts = reconnectAttemptsRef.current[channel] || 0;
          
          if (attempts < maxAttempts) {
            // Update status
            setConnectionStatus((prev) => ({
              ...prev,
              [channel]: ConnectionStatus.RECONNECTING,
            }));
            
            // Calculate backoff interval with jitter
            const jitter = Math.random() * 0.3 + 0.85; // 0.85-1.15
            const interval = Math.min(baseInterval * Math.pow(1.5, attempts) * jitter, 30000);
            
            // Schedule reconnect
            reconnectTimersRef.current[channel] = window.setTimeout(() => {
              reconnectAttemptsRef.current[channel] = attempts + 1;
              connect(channel, config);
            }, interval);
          } else {
            // Max attempts reached
            setConnectionStatus((prev) => ({
              ...prev,
              [channel]: ConnectionStatus.FAILED,
            }));
            
            console.error(`WebSocket reconnection failed after ${maxAttempts} attempts for channel: ${channel}`);
          }
        }
      };
      
      ws.onerror = (error) => {
        console.error(`WebSocket error for channel: ${channel}`, error);
      };
    } catch (error) {
      console.error(`Error connecting to WebSocket for channel: ${channel}`, error);
      
      // Update status
      setConnectionStatus((prev) => ({
        ...prev,
        [channel]: ConnectionStatus.FAILED,
      }));
    }
  }, [cleanup, handleMessage, startHeartbeat]);
  
  // Disconnect from a WebSocket channel
  const disconnect = useCallback((channel: string) => {
    cleanup(channel);
    
    // Update status
    setConnectionStatus((prev) => ({
      ...prev,
      [channel]: ConnectionStatus.DISCONNECTED,
    }));
  }, [cleanup]);
  
  // Disconnect from all WebSocket channels
  const disconnectAll = useCallback(() => {
    cleanup();
    
    // Update status for all channels
    setConnectionStatus({});
  }, [cleanup]);
  
  // Get connection status for a channel
  const getStatus = useCallback((channel: string) => {
    return connectionStatus[channel] || ConnectionStatus.DISCONNECTED;
  }, [connectionStatus]);
  
  // Check if a channel is connected
  const isConnected = useCallback((channel: string) => {
    return connectionStatus[channel] === ConnectionStatus.CONNECTED;
  }, [connectionStatus]);
  
  // Send a message to a channel
  const sendMessage = useCallback((channel: string, type: string, payload: any): boolean => {
    const ws = websocketsRef.current[channel];
    
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify({
          type,
          payload,
          timestamp: new Date().toISOString(),
        }));
        return true;
      } catch (error) {
        console.error(`Error sending WebSocket message to channel ${channel}:`, error);
        return false;
      }
    }
    
    return false;
  }, []);
  
  // Subscribe to messages from a channel
  const subscribe = useCallback(<T = any>(
    channel: string,
    type: string | string[],
    callback: (message: WebSocketMessage & { payload: T }) => void
  ): (() => void) => {
    // Initialize subscribers for channel if not exists
    if (!subscribersRef.current[channel]) {
      subscribersRef.current[channel] = {};
    }
    
    // Convert single type to array
    const types = Array.isArray(type) ? type : [type];
    
    // Add subscriber for each type
    types.forEach((t) => {
      if (!subscribersRef.current[channel][t]) {
        subscribersRef.current[channel][t] = new Set();
      }
      
      subscribersRef.current[channel][t].add(callback as any);
    });
    
    // Return unsubscribe function
    return () => {
      types.forEach((t) => {
        if (subscribersRef.current[channel]?.[t]) {
          subscribersRef.current[channel][t].delete(callback as any);
          
          // Clean up empty sets
          if (subscribersRef.current[channel][t].size === 0) {
            delete subscribersRef.current[channel][t];
          }
        }
      });
      
      // Clean up empty channels
      if (subscribersRef.current[channel] && Object.keys(subscribersRef.current[channel]).length === 0) {
        delete subscribersRef.current[channel];
      }
    };
  }, []);
  
  // Get last message from a channel
  const getLastMessage = useCallback(<T = any>(
    channel: string,
    type?: string
  ): (WebSocketMessage & { payload: T }) | null => {
    if (!lastMessages[channel]) {
      return null;
    }
    
    if (type) {
      return (lastMessages[channel][type] as (WebSocketMessage & { payload: T })) || null;
    }
    
    // Return most recent message of any type
    const messages = Object.values(lastMessages[channel]);
    if (messages.length === 0) {
      return null;
    }
    
    return messages.reduce((latest, current) => {
      const latestTime = new Date(latest.timestamp).getTime();
      const currentTime = new Date(current.timestamp).getTime();
      return currentTime > latestTime ? current : latest;
    }) as (WebSocketMessage & { payload: T });
  }, [lastMessages]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);
  
  // Provide WebSocket context to children
  return (
    <WebSocketContext.Provider
      value={{
        connect,
        disconnect,
        disconnectAll,
        getStatus,
        isConnected,
        sendMessage,
        subscribe,
        getLastMessage,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export default WebSocketProvider;
