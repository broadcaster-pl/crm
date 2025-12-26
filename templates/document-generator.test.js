/**
 * StreamFlow MVP - Testy generatora dokumentów
 * Testy jednostkowe dla document-generator.js
 * 
 * Uruchomienie:
 *   npm install --save-dev jest
 *   npm test
 */

const fs = require('fs');
const path = require('path');
const { Packer } = require('docx');

// Import funkcji do testowania
const { 
    generateOffer, 
    generateContract, 
    SERVICE_PACKAGES, 
    ADDITIONAL_SERVICES 
} = require('./document-generator');

// ============= TESTY KONFIGURACJI =============

describe('Service Packages Configuration', () => {
    test('should have all required packages', () => {
        expect(SERVICE_PACKAGES).toHaveProperty('basic');
        expect(SERVICE_PACKAGES).toHaveProperty('standard');
        expect(SERVICE_PACKAGES).toHaveProperty('premium');
        expect(SERVICE_PACKAGES).toHaveProperty('enterprise');
    });

    test('basic package should have correct price', () => {
        expect(SERVICE_PACKAGES.basic.price).toBe(990);
    });

    test('standard package should have correct price', () => {
        expect(SERVICE_PACKAGES.standard.price).toBe(2490);
    });

    test('premium package should have correct price', () => {
        expect(SERVICE_PACKAGES.premium.price).toBe(4990);
    });

    test('enterprise package should have zero price (custom)', () => {
        expect(SERVICE_PACKAGES.enterprise.price).toBe(0);
    });

    test('all packages should have features array', () => {
        Object.values(SERVICE_PACKAGES).forEach(pkg => {
            expect(Array.isArray(pkg.features)).toBe(true);
            expect(pkg.features.length).toBeGreaterThan(0);
        });
    });

    test('all packages should have name and description', () => {
        Object.values(SERVICE_PACKAGES).forEach(pkg => {
            expect(pkg.name).toBeDefined();
            expect(pkg.description).toBeDefined();
        });
    });
});

describe('Additional Services Configuration', () => {
    test('should have drone service', () => {
        expect(ADDITIONAL_SERVICES.drone).toBeDefined();
        expect(ADDITIONAL_SERVICES.drone.price).toBe(800);
    });

    test('should have commentator service', () => {
        expect(ADDITIONAL_SERVICES.commentator).toBeDefined();
        expect(ADDITIONAL_SERVICES.commentator.price).toBe(600);
    });

    test('should have highlights service', () => {
        expect(ADDITIONAL_SERVICES.highlights).toBeDefined();
        expect(ADDITIONAL_SERVICES.highlights.price).toBe(500);
    });

    test('all services should have name, price and unit', () => {
        Object.values(ADDITIONAL_SERVICES).forEach(service => {
            expect(service.name).toBeDefined();
            expect(typeof service.price).toBe('number');
            expect(service.unit).toBeDefined();
        });
    });
});

// ============= TESTY GENERATORA OFERT =============

describe('Offer Generator', () => {
    const sampleOfferData = {
        clientName: 'Jan Testowy',
        clientCompany: 'Test Company Sp. z o.o.',
        clientEmail: 'jan@testcompany.pl',
        clientPhone: '+48 500 000 000',
        eventName: 'Test Event 2026',
        eventDate: '15 czerwca 2026',
        eventLocation: 'Warszawa, Test Arena',
        eventDescription: 'Testowe wydarzenie sportowe',
        selectedPackage: 'standard',
        additionalServices: ['drone', 'highlights'],
        customNotes: 'Notatka testowa',
        validDays: 14,
        discount: 10
    };

    test('should generate offer document', async () => {
        const doc = await generateOffer(sampleOfferData);
        expect(doc).toBeDefined();
    });

    test('should generate valid docx buffer', async () => {
        const doc = await generateOffer(sampleOfferData);
        const buffer = await Packer.toBuffer(doc);
        
        expect(buffer).toBeInstanceOf(Buffer);
        expect(buffer.length).toBeGreaterThan(0);
    });

    test('should handle offer without additional services', async () => {
        const dataWithoutServices = {
            ...sampleOfferData,
            additionalServices: []
        };
        
        const doc = await generateOffer(dataWithoutServices);
        expect(doc).toBeDefined();
    });

    test('should handle offer without discount', async () => {
        const dataWithoutDiscount = {
            ...sampleOfferData,
            discount: 0
        };
        
        const doc = await generateOffer(dataWithoutDiscount);
        expect(doc).toBeDefined();
    });

    test('should handle offer without custom notes', async () => {
        const dataWithoutNotes = {
            ...sampleOfferData,
            customNotes: ''
        };
        
        const doc = await generateOffer(dataWithoutNotes);
        expect(doc).toBeDefined();
    });

    test('should work with all packages', async () => {
        for (const pkgKey of ['basic', 'standard', 'premium', 'enterprise']) {
            const data = { ...sampleOfferData, selectedPackage: pkgKey };
            const doc = await generateOffer(data);
            expect(doc).toBeDefined();
        }
    });

    test('should work with all additional services', async () => {
        const allServices = Object.keys(ADDITIONAL_SERVICES);
        const data = { ...sampleOfferData, additionalServices: allServices };
        
        const doc = await generateOffer(data);
        expect(doc).toBeDefined();
    });
});

// ============= TESTY GENERATORA UMÓW =============

describe('Contract Generator', () => {
    const sampleContractData = {
        contractNumber: 'STREAM/2026/TEST/001',
        clientName: 'Jan Testowy',
        clientCompany: 'Test Company Sp. z o.o.',
        clientAddress: 'ul. Testowa 1, 00-001 Warszawa',
        clientNIP: '123-456-78-90',
        clientEmail: 'jan@testcompany.pl',
        eventName: 'Test Event 2026',
        eventDate: '15 czerwca 2026',
        eventLocation: 'Warszawa, Test Arena',
        selectedPackage: 'standard',
        additionalServices: ['drone'],
        totalPrice: 4500,
        advancePayment: 2250,
        signDate: '01.12.2025'
    };

    test('should generate contract document', async () => {
        const doc = await generateContract(sampleContractData);
        expect(doc).toBeDefined();
    });

    test('should generate valid docx buffer', async () => {
        const doc = await generateContract(sampleContractData);
        const buffer = await Packer.toBuffer(doc);
        
        expect(buffer).toBeInstanceOf(Buffer);
        expect(buffer.length).toBeGreaterThan(0);
    });

    test('should work with all packages', async () => {
        for (const pkgKey of ['basic', 'standard', 'premium', 'enterprise']) {
            const data = { ...sampleContractData, selectedPackage: pkgKey };
            const doc = await generateContract(data);
            expect(doc).toBeDefined();
        }
    });

    test('should handle different total prices', async () => {
        const testPrices = [990, 2490, 4990, 10000, 50000];
        
        for (const price of testPrices) {
            const data = { 
                ...sampleContractData, 
                totalPrice: price,
                advancePayment: price / 2
            };
            const doc = await generateContract(data);
            expect(doc).toBeDefined();
        }
    });
});

// ============= TESTY ZAPISU PLIKÓW =============

describe('File Generation', () => {
    const testOutputDir = path.join(__dirname, 'test_output');

    beforeAll(() => {
        if (!fs.existsSync(testOutputDir)) {
            fs.mkdirSync(testOutputDir, { recursive: true });
        }
    });

    afterAll(() => {
        // Cleanup test files
        if (fs.existsSync(testOutputDir)) {
            fs.readdirSync(testOutputDir).forEach(file => {
                fs.unlinkSync(path.join(testOutputDir, file));
            });
            fs.rmdirSync(testOutputDir);
        }
    });

    test('should save offer to file', async () => {
        const offerData = {
            clientName: 'Test',
            clientCompany: 'Test Co',
            clientEmail: 'test@test.pl',
            clientPhone: '+48500000000',
            eventName: 'Test Event',
            eventDate: '2026-01-01',
            eventLocation: 'Test Location',
            eventDescription: 'Test',
            selectedPackage: 'basic',
            additionalServices: [],
            customNotes: '',
            validDays: 14,
            discount: 0
        };

        const doc = await generateOffer(offerData);
        const buffer = await Packer.toBuffer(doc);
        const filePath = path.join(testOutputDir, 'test_offer.docx');
        
        fs.writeFileSync(filePath, buffer);
        
        expect(fs.existsSync(filePath)).toBe(true);
        expect(fs.statSync(filePath).size).toBeGreaterThan(0);
    });

    test('should save contract to file', async () => {
        const contractData = {
            contractNumber: 'TEST/001',
            clientName: 'Test',
            clientCompany: 'Test Co',
            clientAddress: 'Test Address',
            clientNIP: '000-000-00-00',
            clientEmail: 'test@test.pl',
            eventName: 'Test Event',
            eventDate: '2026-01-01',
            eventLocation: 'Test Location',
            selectedPackage: 'basic',
            additionalServices: [],
            totalPrice: 990,
            advancePayment: 495,
            signDate: '2025-12-01'
        };

        const doc = await generateContract(contractData);
        const buffer = await Packer.toBuffer(doc);
        const filePath = path.join(testOutputDir, 'test_contract.docx');
        
        fs.writeFileSync(filePath, buffer);
        
        expect(fs.existsSync(filePath)).toBe(true);
        expect(fs.statSync(filePath).size).toBeGreaterThan(0);
    });
});

// ============= TESTY KALKULACJI CEN =============

describe('Price Calculations', () => {
    test('should calculate correct total for basic package', () => {
        const basePrice = SERVICE_PACKAGES.basic.price;
        expect(basePrice).toBe(990);
    });

    test('should calculate correct total with additional services', () => {
        const basePrice = SERVICE_PACKAGES.standard.price;
        const dronePrice = ADDITIONAL_SERVICES.drone.price;
        const highlightsPrice = ADDITIONAL_SERVICES.highlights.price;
        
        const expectedTotal = basePrice + dronePrice + highlightsPrice;
        expect(expectedTotal).toBe(2490 + 800 + 500); // 3790
    });

    test('should calculate correct discount', () => {
        const subtotal = 3790;
        const discountPercent = 10;
        const discountAmount = subtotal * (discountPercent / 100);
        
        expect(discountAmount).toBe(379);
    });

    test('should calculate correct VAT', () => {
        const netTotal = 3411; // 3790 - 379
        const vatAmount = netTotal * 0.23;
        
        expect(Math.round(vatAmount)).toBe(785);
    });

    test('should calculate correct gross total', () => {
        const netTotal = 3411;
        const vatAmount = netTotal * 0.23;
        const grossTotal = netTotal + vatAmount;
        
        expect(Math.round(grossTotal)).toBe(4195);
    });
});

// ============= TESTY WALIDACJI DANYCH =============

describe('Data Validation', () => {
    test('should handle empty client name', async () => {
        const data = {
            clientName: '',
            clientCompany: 'Company',
            clientEmail: 'test@test.pl',
            clientPhone: '+48500000000',
            eventName: 'Event',
            eventDate: '2026-01-01',
            eventLocation: 'Location',
            eventDescription: '',
            selectedPackage: 'basic',
            additionalServices: [],
            customNotes: '',
            validDays: 14,
            discount: 0
        };

        const doc = await generateOffer(data);
        expect(doc).toBeDefined();
    });

    test('should handle special characters in names', async () => {
        const data = {
            clientName: 'Żółć & Gęśl "Test"',
            clientCompany: 'Spółka <O\'Reilly> Sp. z o.o.',
            clientEmail: 'test@test.pl',
            clientPhone: '+48500000000',
            eventName: 'Event with émojis 🏃‍♂️',
            eventDate: '2026-01-01',
            eventLocation: 'Łódź, Śródmieście',
            eventDescription: 'Opis z polskimi znakami: ąęćłńóśźż',
            selectedPackage: 'basic',
            additionalServices: [],
            customNotes: '',
            validDays: 14,
            discount: 0
        };

        const doc = await generateOffer(data);
        expect(doc).toBeDefined();
    });

    test('should handle long text in description', async () => {
        const longDescription = 'Lorem ipsum '.repeat(100);
        
        const data = {
            clientName: 'Test',
            clientCompany: 'Company',
            clientEmail: 'test@test.pl',
            clientPhone: '+48500000000',
            eventName: 'Event',
            eventDate: '2026-01-01',
            eventLocation: 'Location',
            eventDescription: longDescription,
            selectedPackage: 'basic',
            additionalServices: [],
            customNotes: '',
            validDays: 14,
            discount: 0
        };

        const doc = await generateOffer(data);
        expect(doc).toBeDefined();
    });
});

// ============= TESTY EDGE CASES =============

describe('Edge Cases', () => {
    test('should handle maximum discount (100%)', async () => {
        const data = {
            clientName: 'Test',
            clientCompany: 'Company',
            clientEmail: 'test@test.pl',
            clientPhone: '+48500000000',
            eventName: 'Event',
            eventDate: '2026-01-01',
            eventLocation: 'Location',
            eventDescription: '',
            selectedPackage: 'basic',
            additionalServices: [],
            customNotes: '',
            validDays: 14,
            discount: 100
        };

        const doc = await generateOffer(data);
        expect(doc).toBeDefined();
    });

    test('should handle all additional services at once', async () => {
        const allServices = Object.keys(ADDITIONAL_SERVICES);
        
        const data = {
            clientName: 'Test',
            clientCompany: 'Company',
            clientEmail: 'test@test.pl',
            clientPhone: '+48500000000',
            eventName: 'Event',
            eventDate: '2026-01-01',
            eventLocation: 'Location',
            eventDescription: '',
            selectedPackage: 'premium',
            additionalServices: allServices,
            customNotes: '',
            validDays: 14,
            discount: 0
        };

        const doc = await generateOffer(data);
        expect(doc).toBeDefined();
    });

    test('should handle very long validity period', async () => {
        const data = {
            clientName: 'Test',
            clientCompany: 'Company',
            clientEmail: 'test@test.pl',
            clientPhone: '+48500000000',
            eventName: 'Event',
            eventDate: '2026-01-01',
            eventLocation: 'Location',
            eventDescription: '',
            selectedPackage: 'basic',
            additionalServices: [],
            customNotes: '',
            validDays: 365,
            discount: 0
        };

        const doc = await generateOffer(data);
        expect(doc).toBeDefined();
    });
});
