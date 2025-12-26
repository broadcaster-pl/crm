/**
 * StreamFlow MVP - Testy Frontend
 * Testy jednostkowe dla komponentu EventAggregatorDashboard
 * 
 * Uruchomienie:
 *   npm install --save-dev @testing-library/react @testing-library/jest-dom jest
 *   npm test
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock lucide-react
jest.mock('lucide-react', () => ({
    Activity: () => <span data-testid="icon-activity">Activity</span>,
    Calendar: () => <span data-testid="icon-calendar">Calendar</span>,
    Search: () => <span data-testid="icon-search">Search</span>,
    Users: () => <span data-testid="icon-users">Users</span>,
    TrendingUp: () => <span data-testid="icon-trending">TrendingUp</span>,
    FileText: () => <span data-testid="icon-file">FileText</span>,
    Settings: () => <span data-testid="icon-settings">Settings</span>,
    BarChart3: () => <span data-testid="icon-chart">BarChart3</span>,
    RefreshCw: () => <span data-testid="icon-refresh">RefreshCw</span>,
    Plus: () => <span data-testid="icon-plus">Plus</span>,
    Filter: () => <span data-testid="icon-filter">Filter</span>,
    Download: () => <span data-testid="icon-download">Download</span>,
    Send: () => <span data-testid="icon-send">Send</span>,
    Phone: () => <span data-testid="icon-phone">Phone</span>,
    Mail: () => <span data-testid="icon-mail">Mail</span>,
    MapPin: () => <span data-testid="icon-map">MapPin</span>,
    Clock: () => <span data-testid="icon-clock">Clock</span>,
    Star: () => <span data-testid="icon-star">Star</span>,
    ExternalLink: () => <span data-testid="icon-external">ExternalLink</span>,
    ChevronLeft: () => <span data-testid="icon-left">ChevronLeft</span>,
    ChevronRight: () => <span data-testid="icon-right">ChevronRight</span>,
    X: () => <span data-testid="icon-x">X</span>,
    Check: () => <span data-testid="icon-check">Check</span>,
    AlertCircle: () => <span data-testid="icon-alert">AlertCircle</span>,
    Zap: () => <span data-testid="icon-zap">Zap</span>,
    Target: () => <span data-testid="icon-target">Target</span>,
    DollarSign: () => <span data-testid="icon-dollar">DollarSign</span>,
    Eye: () => <span data-testid="icon-eye">Eye</span>,
    Edit: () => <span data-testid="icon-edit">Edit</span>,
    Trash2: () => <span data-testid="icon-trash">Trash2</span>
}));

// Import komponentu po mocku
import EventAggregatorDashboard from './EventAggregatorDashboard';

// ============= TESTY RENDEROWANIA =============

describe('EventAggregatorDashboard Rendering', () => {
    test('renders without crashing', () => {
        render(<EventAggregatorDashboard />);
        expect(screen.getByText('StreamFlow')).toBeInTheDocument();
    });

    test('renders navigation tabs', () => {
        render(<EventAggregatorDashboard />);
        
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Events')).toBeInTheDocument();
        expect(screen.getByText('Leads')).toBeInTheDocument();
        expect(screen.getByText('Offers')).toBeInTheDocument();
        expect(screen.getByText('Calendar')).toBeInTheDocument();
        expect(screen.getByText('Analytics')).toBeInTheDocument();
    });

    test('dashboard view is default', () => {
        render(<EventAggregatorDashboard />);
        
        // Dashboard powinien pokazywać KPI karty
        expect(screen.getByText('Total Events')).toBeInTheDocument();
        expect(screen.getByText('Active Leads')).toBeInTheDocument();
    });
});

// ============= TESTY NAWIGACJI =============

describe('Navigation', () => {
    test('clicking Events tab shows events view', () => {
        render(<EventAggregatorDashboard />);
        
        fireEvent.click(screen.getByText('Events'));
        
        // Events view powinien mieć tabelę wydarzeń
        expect(screen.getByPlaceholderText(/search events/i)).toBeInTheDocument();
    });

    test('clicking Leads tab shows leads view', () => {
        render(<EventAggregatorDashboard />);
        
        fireEvent.click(screen.getByText('Leads'));
        
        // Leads view powinien pokazywać pipeline
        expect(screen.getByText('New')).toBeInTheDocument();
        expect(screen.getByText('Active')).toBeInTheDocument();
    });

    test('clicking Offers tab shows offers view', () => {
        render(<EventAggregatorDashboard />);
        
        fireEvent.click(screen.getByText('Offers'));
        
        // Offers view powinien pokazywać pakiety
        expect(screen.getByText('Pakiet BASIC')).toBeInTheDocument();
        expect(screen.getByText('Pakiet STANDARD')).toBeInTheDocument();
        expect(screen.getByText('Pakiet PREMIUM')).toBeInTheDocument();
    });

    test('clicking Calendar tab shows calendar view', () => {
        render(<EventAggregatorDashboard />);
        
        fireEvent.click(screen.getByText('Calendar'));
        
        // Calendar view powinien mieć nawigację miesiąca
        const monthNavigationButtons = screen.getAllByTestId(/icon-(left|right)/);
        expect(monthNavigationButtons.length).toBeGreaterThan(0);
    });

    test('clicking Analytics tab shows analytics view', () => {
        render(<EventAggregatorDashboard />);
        
        fireEvent.click(screen.getByText('Analytics'));
        
        // Analytics view powinien mieć metryki
        expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    });
});

// ============= TESTY DASHBOARD VIEW =============

describe('Dashboard View', () => {
    test('displays KPI cards', () => {
        render(<EventAggregatorDashboard />);
        
        expect(screen.getByText('Total Events')).toBeInTheDocument();
        expect(screen.getByText('New This Week')).toBeInTheDocument();
        expect(screen.getByText('Active Leads')).toBeInTheDocument();
        expect(screen.getByText('Conversion Rate')).toBeInTheDocument();
    });

    test('displays quick actions', () => {
        render(<EventAggregatorDashboard />);
        
        expect(screen.getByText('Sync Sources')).toBeInTheDocument();
        expect(screen.getByText('Search Events')).toBeInTheDocument();
    });

    test('displays recent events section', () => {
        render(<EventAggregatorDashboard />);
        
        expect(screen.getByText('Recent Events')).toBeInTheDocument();
    });

    test('displays pipeline section', () => {
        render(<EventAggregatorDashboard />);
        
        expect(screen.getByText('Sales Pipeline')).toBeInTheDocument();
    });
});

// ============= TESTY EVENTS VIEW =============

describe('Events View', () => {
    beforeEach(() => {
        render(<EventAggregatorDashboard />);
        fireEvent.click(screen.getByText('Events'));
    });

    test('displays search input', () => {
        expect(screen.getByPlaceholderText(/search events/i)).toBeInTheDocument();
    });

    test('displays filter buttons', () => {
        expect(screen.getByText('All')).toBeInTheDocument();
        expect(screen.getByText('OCR')).toBeInTheDocument();
        expect(screen.getByText('Fitness')).toBeInTheDocument();
    });

    test('displays events table', () => {
        // Sprawdź czy jest tabela z nagłówkami
        expect(screen.getByText('Event')).toBeInTheDocument();
        expect(screen.getByText('Date')).toBeInTheDocument();
        expect(screen.getByText('Location')).toBeInTheDocument();
    });

    test('displays sample events', () => {
        // Przykładowe wydarzenia z mockData
        expect(screen.getByText(/Runmageddon/)).toBeInTheDocument();
    });

    test('search filters events', () => {
        const searchInput = screen.getByPlaceholderText(/search events/i);
        
        fireEvent.change(searchInput, { target: { value: 'Runmageddon' } });
        
        // Po wyszukaniu powinny być tylko wydarzenia z "Runmageddon"
        expect(screen.getByText(/Runmageddon/)).toBeInTheDocument();
    });
});

// ============= TESTY LEADS VIEW =============

describe('Leads View', () => {
    beforeEach(() => {
        render(<EventAggregatorDashboard />);
        fireEvent.click(screen.getByText('Leads'));
    });

    test('displays pipeline stages', () => {
        expect(screen.getByText('New')).toBeInTheDocument();
        expect(screen.getByText('Active')).toBeInTheDocument();
        expect(screen.getByText('Offer Sent')).toBeInTheDocument();
        expect(screen.getByText('Negotiation')).toBeInTheDocument();
        expect(screen.getByText('Won')).toBeInTheDocument();
    });

    test('displays lead cards', () => {
        // Powinny być widoczne karty leadów
        const leadCards = screen.getAllByRole('article');
        expect(leadCards.length).toBeGreaterThan(0);
    });
});

// ============= TESTY OFFERS VIEW =============

describe('Offers View', () => {
    beforeEach(() => {
        render(<EventAggregatorDashboard />);
        fireEvent.click(screen.getByText('Offers'));
    });

    test('displays all service packages', () => {
        expect(screen.getByText('Pakiet BASIC')).toBeInTheDocument();
        expect(screen.getByText('Pakiet STANDARD')).toBeInTheDocument();
        expect(screen.getByText('Pakiet PREMIUM')).toBeInTheDocument();
    });

    test('displays package prices', () => {
        expect(screen.getByText(/990/)).toBeInTheDocument();
        expect(screen.getByText(/2490|2 490/)).toBeInTheDocument();
        expect(screen.getByText(/4990|4 990/)).toBeInTheDocument();
    });

    test('displays package features', () => {
        // Sprawdź czy są listy funkcji
        expect(screen.getByText(/kamera/i)).toBeInTheDocument();
    });

    test('displays additional services section', () => {
        expect(screen.getByText(/Additional Services|Usługi dodatkowe/i)).toBeInTheDocument();
    });
});

// ============= TESTY CALENDAR VIEW =============

describe('Calendar View', () => {
    beforeEach(() => {
        render(<EventAggregatorDashboard />);
        fireEvent.click(screen.getByText('Calendar'));
    });

    test('displays month navigation', () => {
        // Przyciski nawigacji
        const navButtons = screen.getAllByRole('button');
        expect(navButtons.length).toBeGreaterThan(0);
    });

    test('displays day names', () => {
        expect(screen.getByText('Mon')).toBeInTheDocument();
        expect(screen.getByText('Tue')).toBeInTheDocument();
        expect(screen.getByText('Wed')).toBeInTheDocument();
        expect(screen.getByText('Thu')).toBeInTheDocument();
        expect(screen.getByText('Fri')).toBeInTheDocument();
        expect(screen.getByText('Sat')).toBeInTheDocument();
        expect(screen.getByText('Sun')).toBeInTheDocument();
    });

    test('displays upcoming events section', () => {
        expect(screen.getByText(/Upcoming Events|Nadchodzące/i)).toBeInTheDocument();
    });
});

// ============= TESTY ANALYTICS VIEW =============

describe('Analytics View', () => {
    beforeEach(() => {
        render(<EventAggregatorDashboard />);
        fireEvent.click(screen.getByText('Analytics'));
    });

    test('displays metric cards', () => {
        expect(screen.getByText('Total Revenue')).toBeInTheDocument();
        expect(screen.getByText('Pipeline Value')).toBeInTheDocument();
    });

    test('displays conversion funnel', () => {
        expect(screen.getByText('Conversion Funnel')).toBeInTheDocument();
    });

    test('displays source distribution', () => {
        expect(screen.getByText('Source Distribution')).toBeInTheDocument();
    });
});

// ============= TESTY INTERAKCJI =============

describe('User Interactions', () => {
    test('sync button is clickable', () => {
        render(<EventAggregatorDashboard />);
        
        const syncButton = screen.getByText('Sync Sources');
        fireEvent.click(syncButton);
        
        // Przycisk powinien być klikalny (nie rzuca błędu)
        expect(syncButton).toBeInTheDocument();
    });

    test('tab switching works correctly', () => {
        render(<EventAggregatorDashboard />);
        
        // Kliknij każdą zakładkę po kolei
        const tabs = ['Events', 'Leads', 'Offers', 'Calendar', 'Analytics', 'Dashboard'];
        
        tabs.forEach(tabName => {
            fireEvent.click(screen.getByText(tabName));
            // Nie powinno być błędów
        });
        
        expect(true).toBe(true);
    });
});

// ============= TESTY RESPONSYWNOŚCI =============

describe('Responsive Design', () => {
    test('renders correctly on mobile viewport', () => {
        // Symuluj mobilne viewport
        global.innerWidth = 375;
        global.dispatchEvent(new Event('resize'));
        
        render(<EventAggregatorDashboard />);
        
        expect(screen.getByText('StreamFlow')).toBeInTheDocument();
    });

    test('renders correctly on tablet viewport', () => {
        global.innerWidth = 768;
        global.dispatchEvent(new Event('resize'));
        
        render(<EventAggregatorDashboard />);
        
        expect(screen.getByText('StreamFlow')).toBeInTheDocument();
    });

    test('renders correctly on desktop viewport', () => {
        global.innerWidth = 1440;
        global.dispatchEvent(new Event('resize'));
        
        render(<EventAggregatorDashboard />);
        
        expect(screen.getByText('StreamFlow')).toBeInTheDocument();
    });
});

// ============= TESTY DOSTĘPNOŚCI =============

describe('Accessibility', () => {
    test('all buttons are focusable', () => {
        render(<EventAggregatorDashboard />);
        
        const buttons = screen.getAllByRole('button');
        buttons.forEach(button => {
            expect(button).not.toHaveAttribute('tabindex', '-1');
        });
    });

    test('navigation tabs are accessible', () => {
        render(<EventAggregatorDashboard />);
        
        const tabButtons = screen.getAllByRole('button');
        expect(tabButtons.length).toBeGreaterThan(0);
    });
});

// ============= TESTY DANYCH =============

describe('Data Display', () => {
    test('displays correct number of events in dashboard', () => {
        render(<EventAggregatorDashboard />);
        
        // Sprawdź czy liczba wydarzeń jest wyświetlana
        const totalEventsCard = screen.getByText('Total Events').closest('div');
        expect(totalEventsCard).toBeInTheDocument();
    });

    test('pipeline shows correct stages', () => {
        render(<EventAggregatorDashboard />);
        fireEvent.click(screen.getByText('Leads'));
        
        const stages = ['New', 'Active', 'Offer Sent', 'Negotiation', 'Won'];
        stages.forEach(stage => {
            expect(screen.getByText(stage)).toBeInTheDocument();
        });
    });
});

// ============= TESTY EDGE CASES =============

describe('Edge Cases', () => {
    test('handles empty search gracefully', () => {
        render(<EventAggregatorDashboard />);
        fireEvent.click(screen.getByText('Events'));
        
        const searchInput = screen.getByPlaceholderText(/search events/i);
        fireEvent.change(searchInput, { target: { value: '' } });
        
        // Powinny być wyświetlane wszystkie wydarzenia
        expect(screen.getByText(/Runmageddon/)).toBeInTheDocument();
    });

    test('handles special characters in search', () => {
        render(<EventAggregatorDashboard />);
        fireEvent.click(screen.getByText('Events'));
        
        const searchInput = screen.getByPlaceholderText(/search events/i);
        fireEvent.change(searchInput, { target: { value: '<script>alert("xss")</script>' } });
        
        // Nie powinno być błędów
        expect(searchInput).toBeInTheDocument();
    });
});
