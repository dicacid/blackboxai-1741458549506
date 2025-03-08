import type { ApiResponse } from '../types';

export interface Notification {
  id: string;
  type: 'event' | 'ticket' | 'price' | 'security' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  link?: string;
  metadata?: {
    eventId?: string;
    ticketId?: string;
    transactionHash?: string;
    [key: string]: any;
  };
}

export class NotificationService {
  private static instance: NotificationService;
  private websocket: WebSocket | null = null;
  private readonly wsUrl: string;
  private readonly apiUrl: string;

  private constructor() {
    this.wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8080';
    this.apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  public async getNotifications(limit: number = 10): Promise<Notification[]> {
    try {
      const response = await fetch(`${this.apiUrl}/notifications?limit=${limit}`);
      const data: ApiResponse<Notification[]> = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to fetch notifications');
      }

      return data.data!;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  public async markAsRead(notificationId: string): Promise<void> {
    try {
      const response = await fetch(`${this.apiUrl}/notifications/${notificationId}/read`, {
        method: 'POST',
      });
      const data: ApiResponse<void> = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to mark notification as read');
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  public async markAllAsRead(): Promise<void> {
    try {
      const response = await fetch(`${this.apiUrl}/notifications/read-all`, {
        method: 'POST',
      });
      const data: ApiResponse<void> = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to mark all notifications as read');
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  public subscribeToNotifications(callback: (notification: Notification) => void): () => void {
    if (!this.websocket) {
      this.websocket = new WebSocket(this.wsUrl);

      this.websocket.onopen = () => {
        console.log('WebSocket connection established');
        if (this.websocket) {
          this.websocket.send(JSON.stringify({ type: 'subscribe', channel: 'notifications' }));
        }
      };

      this.websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'notification') {
            callback(data.notification);
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      };

      this.websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      this.websocket.onclose = () => {
        console.log('WebSocket connection closed');
        this.websocket = null;
      };
    }

    return () => {
      if (this.websocket) {
        this.websocket.close();
        this.websocket = null;
      }
    };
  }

  public getNotificationIcon(type: Notification['type']): string {
    switch (type) {
      case 'event':
        return 'event';
      case 'ticket':
        return 'confirmation_number';
      case 'price':
        return 'trending_up';
      case 'security':
        return 'security';
      case 'system':
        return 'info';
      default:
        return 'notifications';
    }
  }

  public getNotificationColor(priority: Notification['priority']): string {
    switch (priority) {
      case 'high':
        return '#ff4444';
      case 'medium':
        return '#ffbb33';
      case 'low':
        return '#00C851';
      default:
        return '#33b5e5';
    }
  }
}

export default NotificationService.getInstance();
