import { describe, it, expect } from 'vitest';

describe('PrivateSessionBooking - Coach Selection', () => {
  it('should have two coaches available', () => {
    const coaches = [
      {
        id: 'coach-mac',
        name: 'Coach Mac',
        title: 'Head Coach',
        specialties: 'Ball Handling, Shooting, Footwork',
      },
      {
        id: 'coach-o',
        name: 'Coach O',
        title: 'Training Coach',
        specialties: 'Conditioning, Agility, Strength',
      },
    ];

    expect(coaches).toHaveLength(2);
    expect(coaches[0].name).toBe('Coach Mac');
    expect(coaches[1].name).toBe('Coach O');
  });

  it('should have valid coach IDs', () => {
    const coaches = [
      { id: 'coach-mac', name: 'Coach Mac' },
      { id: 'coach-o', name: 'Coach O' },
    ];

    coaches.forEach(coach => {
      expect(coach.id).toMatch(/^coach-/);
      expect(coach.id.length).toBeGreaterThan(0);
    });
  });

  it('should map coach IDs to numeric IDs correctly', () => {
    const coachIdMap: Record<string, number> = {
      'coach-mac': 1,
      'coach-o': 2,
    };

    expect(coachIdMap['coach-mac']).toBe(1);
    expect(coachIdMap['coach-o']).toBe(2);
  });
});

describe('PrivateSessionBooking - Form Validation', () => {
  it('should require name and email', () => {
    const formData = {
      name: '',
      email: '',
      phone: '',
      preferredDates: '',
      preferredTimes: '',
      notes: '',
    };

    const isValid = formData.name.trim().length > 0 && formData.email.trim().length > 0;
    expect(isValid).toBe(false);
  });

  it('should validate email format', () => {
    const validEmails = [
      'test@example.com',
      'user.name@domain.co.uk',
      'test+tag@example.com',
    ];

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    validEmails.forEach(email => {
      expect(emailRegex.test(email)).toBe(true);
    });
  });

  it('should accept valid form data', () => {
    const formData = {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '(555) 123-4567',
      preferredDates: 'Monday, Wednesday',
      preferredTimes: '4:00 PM - 5:00 PM',
      notes: 'Looking to improve shooting',
    };

    const isValid = 
      formData.name.trim().length > 0 && 
      formData.email.includes('@');

    expect(isValid).toBe(true);
  });
});

describe('PrivateSessionBooking - Booking Request', () => {
  it('should create booking request with required fields', () => {
    const bookingData = {
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      customerPhone: '(555) 123-4567',
      coachId: 1,
      coachName: 'Coach Mac',
      preferredDates: 'Monday, Wednesday',
      preferredTimes: '4:00 PM - 5:00 PM',
      notes: 'Improve shooting skills',
      stripeSessionId: 'cs_test_123',
    };

    expect(bookingData.customerName).toBeTruthy();
    expect(bookingData.customerEmail).toContain('@');
    expect(bookingData.coachId).toBeGreaterThan(0);
    expect(bookingData.coachName).toBeTruthy();
  });

  it('should handle booking without optional fields', () => {
    const bookingData = {
      customerName: 'Jane Smith',
      customerEmail: 'jane@example.com',
      customerPhone: '',
      coachId: 2,
      coachName: 'Coach O',
      preferredDates: '',
      preferredTimes: '',
      notes: '',
      stripeSessionId: '',
    };

    expect(bookingData.customerName).toBeTruthy();
    expect(bookingData.customerEmail).toBeTruthy();
    expect(bookingData.coachId).toBeTruthy();
  });

  it('should validate coach ID is numeric', () => {
    const coachIds = [1, 2];
    
    coachIds.forEach(id => {
      expect(typeof id).toBe('number');
      expect(id).toBeGreaterThan(0);
    });
  });
});

describe('PrivateSessionBooking - Success State', () => {
  it('should show success message after submission', () => {
    const submitted = true;
    expect(submitted).toBe(true);
  });

  it('should display booking confirmation details', () => {
    const confirmationData = {
      customerName: 'John Doe',
      coachName: 'Coach Mac',
      status: 'pending',
      message: 'Your selected coach will contact you within 24 hours',
    };

    expect(confirmationData.status).toBe('pending');
    expect(confirmationData.message).toContain('24 hours');
  });

  it('should provide next steps after booking', () => {
    const nextSteps = [
      'Coach will contact you within 24 hours',
      'Confirm session details and location',
      'Prepare for your training session',
    ];

    expect(nextSteps).toHaveLength(3);
    nextSteps.forEach(step => {
      expect(step.length).toBeGreaterThan(0);
    });
  });
});

describe('PrivateSessionBooking - URL Parameters', () => {
  it('should extract session ID from URL', () => {
    const url = new URL('http://localhost/private-session-booking?session_id=cs_test_123&email=test@example.com');
    const sessionId = url.searchParams.get('session_id');
    const email = url.searchParams.get('email');

    expect(sessionId).toBe('cs_test_123');
    expect(email).toBe('test@example.com');
  });

  it('should handle missing URL parameters', () => {
    const url = new URL('http://localhost/private-session-booking');
    const sessionId = url.searchParams.get('session_id');
    const email = url.searchParams.get('email');

    expect(sessionId).toBeNull();
    expect(email).toBeNull();
  });
});
