import type { Event, ApiResponse, VenueSection } from '../types';
import web3Service from './web3Service';

interface EventFilters {
  category?: string;
  date?: string;
  location?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  status?: Event['status'];
}

export class EventService {
  private static instance: EventService;
  private readonly apiUrl: string;

  private constructor() {
    this.apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
  }

  public static getInstance(): EventService {
    if (!EventService.instance) {
      EventService.instance = new EventService();
    }
    return EventService.instance;
  }

  public async getEvents(filters?: EventFilters): Promise<Event[]> {
    try {
      const queryParams = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) {
            if (key === 'priceRange' && typeof value === 'object') {
              queryParams.append('minPrice', value.min.toString());
              queryParams.append('maxPrice', value.max.toString());
            } else if (typeof value === 'string') {
              queryParams.append(key, value);
            }
          }
        });
      }

      const response = await fetch(`${this.apiUrl}/events?${queryParams}`);
      const data: ApiResponse<Event[]> = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to fetch events');
      }

      return data.data!;
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  }

  public async getEventById(eventId: string): Promise<Event> {
    try {
      const response = await fetch(`${this.apiUrl}/events/${eventId}`);
      const data: ApiResponse<Event> = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to fetch event');
      }

      return data.data!;
    } catch (error) {
      console.error('Error fetching event:', error);
      throw error;
    }
  }

  public async purchaseTickets(
    eventId: string,
    quantity: number,
    sectionId?: string
  ): Promise<string> {
    try {
      // Get ticket price from smart contract
      const ticketPrice = await this.getTicketPrice(eventId, sectionId);
      const totalPrice = ticketPrice * quantity;

      // Call smart contract to purchase tickets
      const tx = await web3Service.deposit(totalPrice.toString());
      return tx;
    } catch (error) {
      console.error('Error purchasing tickets:', error);
      throw error;
    }
  }

  public async getTicketPrice(eventId: string, sectionId?: string): Promise<number> {
    try {
      const response = await fetch(
        `${this.apiUrl}/events/${eventId}/price${sectionId ? `?sectionId=${sectionId}` : ''}`
      );
      const data: ApiResponse<{ price: number }> = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to fetch ticket price');
      }

      return data.data!.price;
    } catch (error) {
      console.error('Error fetching ticket price:', error);
      throw error;
    }
  }

  public async getEventCategories(): Promise<string[]> {
    try {
      const response = await fetch(`${this.apiUrl}/events/categories`);
      const data: ApiResponse<string[]> = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to fetch categories');
      }

      return data.data!;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  public async getEventLocations(): Promise<string[]> {
    try {
      const response = await fetch(`${this.apiUrl}/events/locations`);
      const data: ApiResponse<string[]> = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to fetch locations');
      }

      return data.data!;
    } catch (error) {
      console.error('Error fetching locations:', error);
      throw error;
    }
  }

  public async getVenueSections(eventId: string): Promise<VenueSection[]> {
    try {
      const event = await this.getEventById(eventId);
      if (!event.venue?.sections) {
        throw new Error('No venue sections found for this event');
      }
      return event.venue.sections;
    } catch (error) {
      console.error('Error fetching venue sections:', error);
      throw error;
    }
  }

  public formatEventDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });
  }

  public formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(price);
  }
}

export default EventService.getInstance();
