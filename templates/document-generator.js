const { 
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, 
    Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
    PageNumber, LevelFormat
} = require('docx');
const fs = require('fs');

/**
 * StreamFlow - Generator Ofert i Umów
 * Generuje profesjonalne dokumenty DOCX dla usług streamingowych
 */

// ============= PAKIETY USŁUG =============
const SERVICE_PACKAGES = {
    basic: {
        name: 'Pakiet BASIC',
        price: 990,
        description: 'Podstawowy streaming jednokamerowy',
        features: [
            '1 kamera statyczna HD',
            'Do 2 godzin transmisji',
            'Streaming na YouTube lub Facebook',
            'Podstawowe nakładki graficzne (logo, timer)',
            'Backup nagrania lokalnego'
        ],
        recommended_for: 'Małe wydarzenia lokalne, treningi, mniejsze zawody'
    },
    standard: {
        name: 'Pakiet STANDARD',
        price: 2490,
        description: 'Profesjonalna realizacja wielokamerowa',
        features: [
            '2-3 kamery HD/4K',
            'Do 4 godzin transmisji',
            'Realizator wizji na żywo',
            'Profesjonalne grafiki i animacje',
            'Replay i slow-motion',
            'Backup nagrania na dysku',
            'Statystyki i raport po wydarzeniu'
        ],
        recommended_for: 'Zawody regionalne, turnieje sportowe, konferencje'
    },
    premium: {
        name: 'Pakiet PREMIUM',
        price: 4990,
        description: 'Pełna produkcja eventowa',
        features: [
            '4+ kamery z operatorami',
            'Cały dzień transmisji (do 10h)',
            'Wóz transmisyjny OB',
            'LiveU bonding 4G/5G',
            'Komentator/prowadzący',
            'Dedykowane studio graficzne',
            'Post-produkcja highlights',
            'Streaming multi-platform'
        ],
        recommended_for: 'Duże wydarzenia, mistrzostwa, gale, festiwale'
    },
    enterprise: {
        name: 'Pakiet ENTERPRISE',
        price: 0, // Wycena indywidualna
        description: 'Rozwiązanie szyte na miarę',
        features: [
            'Nieograniczona liczba kamer',
            'Wielodniowa transmisja',
            'Dedykowany zespół produkcyjny',
            'Własna infrastruktura sieciowa',
            'Transmisja satelitarna/uplink',
            'Pełna integracja z systemami klienta',
            'Wsparcie 24/7',
            'SLA z gwarancją dostępności'
        ],
        recommended_for: 'Ligi profesjonalne, duże sieci wydarzeń, stałe współprace'
    }
};

const ADDITIONAL_SERVICES = {
    drone: { name: 'Dron z operatorem', price: 800, unit: 'dzień' },
    commentator: { name: 'Komentator sportowy', price: 600, unit: 'dzień' },
    graphics_custom: { name: 'Dedykowane grafiki', price: 400, unit: 'komplet' },
    highlights: { name: 'Montaż highlights (do 5 min)', price: 500, unit: 'szt' },
    multistream: { name: 'Multi-platform streaming', price: 300, unit: 'platforma' },
    vod: { name: 'Archiwum VOD na 30 dni', price: 200, unit: 'wydarzenie' },
    led_screen: { name: 'Ekran LED mobilny', price: 1500, unit: 'dzień' },
    sound_system: { name: 'Nagłośnienie eventowe', price: 800, unit: 'dzień' },
    photographer: { name: 'Fotograf eventowy', price: 700, unit: 'dzień' },
    transcript: { name: 'Transkrypcja i napisy', price: 350, unit: 'godzina' }
};

// ============= GENERATOR OFERTY =============

async function generateOffer(data) {
    const {
        clientName,
        clientCompany,
        clientEmail,
        clientPhone,
        eventName,
        eventDate,
        eventLocation,
        eventDescription,
        selectedPackage,
        additionalServices = [],
        customNotes = '',
        validDays = 14,
        discount = 0
    } = data;

    const pkg = SERVICE_PACKAGES[selectedPackage];
    const today = new Date();
    const validUntil = new Date(today.getTime() + validDays * 24 * 60 * 60 * 1000);

    // Obliczenia cenowe
    let basePrice = pkg.price;
    let additionalTotal = 0;
    const additionalDetails = additionalServices.map(serviceId => {
        const service = ADDITIONAL_SERVICES[serviceId];
        additionalTotal += service.price;
        return service;
    });
    const subtotal = basePrice + additionalTotal;
    const discountAmount = subtotal * (discount / 100);
    const netTotal = subtotal - discountAmount;
    const vatAmount = netTotal * 0.23;
    const grossTotal = netTotal + vatAmount;

    const doc = new Document({
        styles: {
            default: {
                document: {
                    run: { font: 'Arial', size: 22 }
                }
            },
            paragraphStyles: [
                {
                    id: 'Title',
                    name: 'Title',
                    basedOn: 'Normal',
                    run: { size: 48, bold: true, color: '10B981' },
                    paragraph: { spacing: { after: 200 }, alignment: AlignmentType.CENTER }
                },
                {
                    id: 'Heading1',
                    name: 'Heading 1',
                    basedOn: 'Normal',
                    run: { size: 28, bold: true, color: '1F2937' },
                    paragraph: { spacing: { before: 300, after: 150 } }
                },
                {
                    id: 'Heading2',
                    name: 'Heading 2',
                    basedOn: 'Normal',
                    run: { size: 24, bold: true, color: '374151' },
                    paragraph: { spacing: { before: 200, after: 100 } }
                }
            ]
        },
        numbering: {
            config: [{
                reference: 'features-list',
                levels: [{
                    level: 0,
                    format: LevelFormat.BULLET,
                    text: '✓',
                    alignment: AlignmentType.LEFT,
                    style: { paragraph: { indent: { left: 720, hanging: 360 } } }
                }]
            }]
        },
        sections: [{
            properties: {
                page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } }
            },
            headers: {
                default: new Header({
                    children: [new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        children: [
                            new TextRun({ text: 'StreamFlow | ', color: '10B981', bold: true }),
                            new TextRun({ text: 'Profesjonalny streaming wydarzeń', color: '6B7280', size: 18 })
                        ]
                    })]
                })
            },
            footers: {
                default: new Footer({
                    children: [new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                            new TextRun({ text: 'Strona ', size: 18, color: '9CA3AF' }),
                            new TextRun({ children: [PageNumber.CURRENT], size: 18, color: '9CA3AF' }),
                            new TextRun({ text: ' | StreamFlow - prototypowanie.pl | kontakt@streamflow.pl', size: 18, color: '9CA3AF' })
                        ]
                    })]
                })
            },
            children: [
                // TYTUŁ
                new Paragraph({
                    heading: HeadingLevel.TITLE,
                    children: [new TextRun({ text: 'OFERTA USŁUG STREAMINGOWYCH', bold: true })]
                }),
                
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 400 },
                    children: [
                        new TextRun({ text: `Numer: OF/${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, '0')}/${Math.floor(Math.random() * 1000)}`, color: '6B7280' })
                    ]
                }),

                // DANE KLIENTA
                new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('Dane klienta')] }),
                
                createInfoTable([
                    ['Firma / Organizacja:', clientCompany],
                    ['Osoba kontaktowa:', clientName],
                    ['Email:', clientEmail],
                    ['Telefon:', clientPhone]
                ]),

                // INFORMACJE O WYDARZENIU
                new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('Informacje o wydarzeniu')] }),
                
                createInfoTable([
                    ['Nazwa wydarzenia:', eventName],
                    ['Data:', eventDate],
                    ['Lokalizacja:', eventLocation],
                    ['Opis:', eventDescription || 'Brak szczegółowego opisu']
                ]),

                // WYBRANY PAKIET
                new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('Proponowany pakiet')] }),
                
                new Paragraph({
                    spacing: { after: 100 },
                    children: [
                        new TextRun({ text: pkg.name, bold: true, size: 28, color: '10B981' }),
                        new TextRun({ text: ` — ${pkg.description}`, size: 22, color: '6B7280' })
                    ]
                }),

                new Paragraph({
                    spacing: { after: 200 },
                    children: [new TextRun({ text: `Cena bazowa: ${pkg.price.toLocaleString()} PLN netto`, bold: true, size: 24 })]
                }),

                new Paragraph({
                    spacing: { after: 100 },
                    children: [new TextRun({ text: 'W pakiecie zawarte:', bold: true })]
                }),

                ...pkg.features.map(feature => 
                    new Paragraph({
                        numbering: { reference: 'features-list', level: 0 },
                        children: [new TextRun({ text: feature, color: '374151' })]
                    })
                ),

                // USŁUGI DODATKOWE
                ...(additionalDetails.length > 0 ? [
                    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('Usługi dodatkowe')] }),
                    
                    ...additionalDetails.map(service =>
                        new Paragraph({
                            numbering: { reference: 'features-list', level: 0 },
                            children: [
                                new TextRun({ text: `${service.name}: `, color: '374151' }),
                                new TextRun({ text: `${service.price} PLN/${service.unit}`, bold: true, color: '10B981' })
                            ]
                        })
                    )
                ] : []),

                // PODSUMOWANIE CENOWE
                new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('Podsumowanie cenowe')] }),

                createPriceTable([
                    ['Pakiet bazowy', `${basePrice.toLocaleString()} PLN`],
                    ['Usługi dodatkowe', `${additionalTotal.toLocaleString()} PLN`],
                    ...(discount > 0 ? [['Rabat (' + discount + '%)', `- ${discountAmount.toLocaleString()} PLN`]] : []),
                    ['RAZEM NETTO', `${netTotal.toLocaleString()} PLN`],
                    ['VAT (23%)', `${vatAmount.toLocaleString()} PLN`],
                    ['RAZEM BRUTTO', `${grossTotal.toLocaleString()} PLN`]
                ]),

                // WARUNKI
                new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('Warunki oferty')] }),

                new Paragraph({
                    spacing: { after: 100 },
                    children: [
                        new TextRun({ text: 'Oferta ważna do: ', color: '374151' }),
                        new TextRun({ text: validUntil.toLocaleDateString('pl-PL'), bold: true, color: 'DC2626' })
                    ]
                }),

                new Paragraph({
                    spacing: { after: 100 },
                    children: [new TextRun({ text: 'Warunki płatności: 50% zaliczka przy podpisaniu umowy, 50% po realizacji', color: '374151' })]
                }),

                new Paragraph({
                    spacing: { after: 100 },
                    children: [new TextRun({ text: 'Cena nie zawiera: dojazdu poza Trójmiasto (rozliczenie wg stawki 1,50 PLN/km)', color: '374151' })]
                }),

                // NOTATKI
                ...(customNotes ? [
                    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Dodatkowe uwagi')] }),
                    new Paragraph({
                        spacing: { after: 200 },
                        children: [new TextRun({ text: customNotes, color: '374151' })]
                    })
                ] : []),

                // PODPIS
                new Paragraph({ spacing: { before: 600 } }),
                
                new Paragraph({
                    children: [new TextRun({ text: 'Z poważaniem,', color: '374151' })]
                }),
                
                new Paragraph({
                    spacing: { before: 200 },
                    children: [
                        new TextRun({ text: 'Zespół StreamFlow', bold: true, size: 24 })
                    ]
                }),
                
                new Paragraph({
                    children: [new TextRun({ text: 'prototypowanie.pl | kontakt@streamflow.pl | +48 xxx xxx xxx', color: '6B7280', size: 18 })]
                })
            ]
        }]
    });

    return doc;
}

// ============= GENERATOR UMOWY =============

async function generateContract(data) {
    const {
        contractNumber,
        clientName,
        clientCompany,
        clientAddress,
        clientNIP,
        clientEmail,
        eventName,
        eventDate,
        eventLocation,
        selectedPackage,
        additionalServices = [],
        totalPrice,
        advancePayment,
        signDate
    } = data;

    const pkg = SERVICE_PACKAGES[selectedPackage];

    const doc = new Document({
        styles: {
            default: { document: { run: { font: 'Arial', size: 22 } } },
            paragraphStyles: [
                {
                    id: 'Title',
                    name: 'Title',
                    basedOn: 'Normal',
                    run: { size: 36, bold: true },
                    paragraph: { spacing: { after: 200 }, alignment: AlignmentType.CENTER }
                },
                {
                    id: 'Heading1',
                    name: 'Heading 1',
                    basedOn: 'Normal',
                    run: { size: 24, bold: true },
                    paragraph: { spacing: { before: 300, after: 150 }, alignment: AlignmentType.CENTER }
                }
            ]
        },
        numbering: {
            config: [{
                reference: 'contract-list',
                levels: [{
                    level: 0,
                    format: LevelFormat.DECIMAL,
                    text: '%1.',
                    alignment: AlignmentType.LEFT,
                    style: { paragraph: { indent: { left: 720, hanging: 360 } } }
                }]
            }]
        },
        sections: [{
            properties: {
                page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } }
            },
            children: [
                // NAGŁÓWEK
                new Paragraph({
                    heading: HeadingLevel.TITLE,
                    children: [new TextRun('UMOWA O ŚWIADCZENIE USŁUG STREAMINGOWYCH')]
                }),

                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 400 },
                    children: [new TextRun({ text: `Nr ${contractNumber}`, size: 20 })]
                }),

                new Paragraph({
                    spacing: { after: 300 },
                    children: [
                        new TextRun({ text: `Zawarta w dniu ${signDate} pomiędzy:` })
                    ]
                }),

                // STRONY UMOWY
                new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('§1 Strony umowy')] }),

                new Paragraph({
                    spacing: { after: 200 },
                    children: [
                        new TextRun({ text: '1. Wykonawca: ', bold: true }),
                        new TextRun('Softreck / prototypowanie.pl, '),
                        new TextRun('ul. Przykładowa 1, 80-001 Gdańsk, '),
                        new TextRun('NIP: 000-000-00-00, '),
                        new TextRun('reprezentowany przez: [Imię i Nazwisko]')
                    ]
                }),

                new Paragraph({
                    spacing: { after: 300 },
                    children: [
                        new TextRun({ text: '2. Zamawiający: ', bold: true }),
                        new TextRun(`${clientCompany}, `),
                        new TextRun(`${clientAddress}, `),
                        new TextRun(`NIP: ${clientNIP}, `),
                        new TextRun(`reprezentowany przez: ${clientName}`)
                    ]
                }),

                // PRZEDMIOT UMOWY
                new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('§2 Przedmiot umowy')] }),

                new Paragraph({
                    numbering: { reference: 'contract-list', level: 0 },
                    children: [new TextRun(`Wykonawca zobowiązuje się do realizacji usługi transmisji strumieniowej (streaming) wydarzenia: "${eventName}".`)]
                }),

                new Paragraph({
                    numbering: { reference: 'contract-list', level: 0 },
                    children: [new TextRun(`Data wydarzenia: ${eventDate}`)]
                }),

                new Paragraph({
                    numbering: { reference: 'contract-list', level: 0 },
                    children: [new TextRun(`Miejsce wydarzenia: ${eventLocation}`)]
                }),

                new Paragraph({
                    numbering: { reference: 'contract-list', level: 0 },
                    spacing: { after: 300 },
                    children: [new TextRun(`Zakres usług obejmuje: ${pkg.name} - ${pkg.description}`)]
                }),

                // WYNAGRODZENIE
                new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('§3 Wynagrodzenie')] }),

                new Paragraph({
                    numbering: { reference: 'contract-list', level: 0 },
                    children: [new TextRun(`Całkowite wynagrodzenie za realizację przedmiotu umowy wynosi: ${totalPrice.toLocaleString()} PLN brutto.`)]
                }),

                new Paragraph({
                    numbering: { reference: 'contract-list', level: 0 },
                    children: [new TextRun(`Zaliczka w wysokości ${advancePayment.toLocaleString()} PLN płatna w terminie 7 dni od podpisania umowy.`)]
                }),

                new Paragraph({
                    numbering: { reference: 'contract-list', level: 0 },
                    spacing: { after: 300 },
                    children: [new TextRun('Pozostała kwota płatna w terminie 14 dni od daty realizacji wydarzenia.')]
                }),

                // OBOWIĄZKI
                new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('§4 Obowiązki stron')] }),

                new Paragraph({
                    spacing: { after: 100 },
                    children: [new TextRun({ text: 'Wykonawca zobowiązuje się do:', bold: true })]
                }),

                new Paragraph({
                    numbering: { reference: 'contract-list', level: 0 },
                    children: [new TextRun('Profesjonalnej realizacji transmisji zgodnie z wybranym pakietem')]
                }),

                new Paragraph({
                    numbering: { reference: 'contract-list', level: 0 },
                    children: [new TextRun('Zapewnienia niezbędnego sprzętu technicznego')]
                }),

                new Paragraph({
                    numbering: { reference: 'contract-list', level: 0 },
                    children: [new TextRun('Przybycia na miejsce minimum 2 godziny przed rozpoczęciem wydarzenia')]
                }),

                new Paragraph({
                    spacing: { before: 200, after: 100 },
                    children: [new TextRun({ text: 'Zamawiający zobowiązuje się do:', bold: true })]
                }),

                new Paragraph({
                    numbering: { reference: 'contract-list', level: 0 },
                    children: [new TextRun('Zapewnienia dostępu do miejsca wydarzenia')]
                }),

                new Paragraph({
                    numbering: { reference: 'contract-list', level: 0 },
                    children: [new TextRun('Zapewnienia zasilania elektrycznego 230V')]
                }),

                new Paragraph({
                    numbering: { reference: 'contract-list', level: 0 },
                    spacing: { after: 300 },
                    children: [new TextRun('Dostarczenia materiałów graficznych (logo, grafiki) min. 5 dni przed wydarzeniem')]
                }),

                // POSTANOWIENIA KOŃCOWE
                new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('§5 Postanowienia końcowe')] }),

                new Paragraph({
                    numbering: { reference: 'contract-list', level: 0 },
                    children: [new TextRun('Wszelkie zmiany umowy wymagają formy pisemnej pod rygorem nieważności.')]
                }),

                new Paragraph({
                    numbering: { reference: 'contract-list', level: 0 },
                    children: [new TextRun('W sprawach nieuregulowanych stosuje się przepisy Kodeksu Cywilnego.')]
                }),

                new Paragraph({
                    numbering: { reference: 'contract-list', level: 0 },
                    children: [new TextRun('Umowę sporządzono w dwóch jednobrzmiących egzemplarzach.')]
                }),

                // PODPISY
                new Paragraph({ spacing: { before: 600 } }),

                new Table({
                    columnWidths: [4680, 4680],
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({
                                    borders: noBorders(),
                                    children: [
                                        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun('_______________________')] }),
                                        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100 }, children: [new TextRun({ text: 'Wykonawca', bold: true })] })
                                    ]
                                }),
                                new TableCell({
                                    borders: noBorders(),
                                    children: [
                                        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun('_______________________')] }),
                                        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100 }, children: [new TextRun({ text: 'Zamawiający', bold: true })] })
                                    ]
                                })
                            ]
                        })
                    ]
                })
            ]
        }]
    });

    return doc;
}

// ============= FUNKCJE POMOCNICZE =============

function createInfoTable(rows) {
    const tableBorder = { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' };
    const cellBorders = { top: tableBorder, bottom: tableBorder, left: tableBorder, right: tableBorder };

    return new Table({
        columnWidths: [3000, 6360],
        rows: rows.map(([label, value]) =>
            new TableRow({
                children: [
                    new TableCell({
                        borders: cellBorders,
                        width: { size: 3000, type: WidthType.DXA },
                        children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, color: '6B7280' })] })]
                    }),
                    new TableCell({
                        borders: cellBorders,
                        width: { size: 6360, type: WidthType.DXA },
                        children: [new Paragraph({ children: [new TextRun({ text: value || '—', color: '1F2937' })] })]
                    })
                ]
            })
        )
    });
}

function createPriceTable(rows) {
    const tableBorder = { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' };
    const cellBorders = { top: tableBorder, bottom: tableBorder, left: tableBorder, right: tableBorder };

    return new Table({
        columnWidths: [6360, 3000],
        rows: rows.map(([label, value], index) => {
            const isTotal = label.includes('RAZEM');
            return new TableRow({
                children: [
                    new TableCell({
                        borders: cellBorders,
                        width: { size: 6360, type: WidthType.DXA },
                        children: [new Paragraph({
                            alignment: AlignmentType.RIGHT,
                            children: [new TextRun({ text: label, bold: isTotal, color: isTotal ? '1F2937' : '6B7280' })]
                        })]
                    }),
                    new TableCell({
                        borders: cellBorders,
                        width: { size: 3000, type: WidthType.DXA },
                        children: [new Paragraph({
                            alignment: AlignmentType.RIGHT,
                            children: [new TextRun({ 
                                text: value, 
                                bold: isTotal, 
                                color: isTotal ? '10B981' : '1F2937',
                                size: isTotal ? 26 : 22
                            })]
                        })]
                    })
                ]
            });
        })
    });
}

function noBorders() {
    return {
        top: { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.NONE },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE }
    };
}

// ============= EKSPORT I UŻYCIE =============

async function main() {
    // Przykład generowania oferty
    const offerData = {
        clientName: 'Jan Kowalski',
        clientCompany: 'Runmageddon Sp. z o.o.',
        clientEmail: 'jan@runmageddon.pl',
        clientPhone: '+48 500 000 000',
        eventName: 'Runmageddon Warszawa 2026',
        eventDate: '15 marca 2026',
        eventLocation: 'Tor Wyścigów Konnych Służewiec, Warszawa',
        eventDescription: 'Zawody OCR z udziałem 3000 uczestników w 4 dystansach',
        selectedPackage: 'standard',
        additionalServices: ['drone', 'highlights', 'multistream'],
        customNotes: 'Możliwość negocjacji przy stałej współpracy na sezon 2026.',
        discount: 10
    };

    const offerDoc = await generateOffer(offerData);
    const offerBuffer = await Packer.toBuffer(offerDoc);
    fs.writeFileSync('oferta_runmageddon.docx', offerBuffer);
    console.log('Wygenerowano: oferta_runmageddon.docx');

    // Przykład generowania umowy
    const contractData = {
        contractNumber: 'STREAM/2026/001',
        clientName: 'Jan Kowalski',
        clientCompany: 'Runmageddon Sp. z o.o.',
        clientAddress: 'ul. Sportowa 10, 00-001 Warszawa',
        clientNIP: '123-456-78-90',
        clientEmail: 'jan@runmageddon.pl',
        eventName: 'Runmageddon Warszawa 2026',
        eventDate: '15 marca 2026',
        eventLocation: 'Tor Wyścigów Konnych Służewiec, Warszawa',
        selectedPackage: 'standard',
        totalPrice: 4500,
        advancePayment: 2250,
        signDate: new Date().toLocaleDateString('pl-PL')
    };

    const contractDoc = await generateContract(contractData);
    const contractBuffer = await Packer.toBuffer(contractDoc);
    fs.writeFileSync('umowa_runmageddon.docx', contractBuffer);
    console.log('Wygenerowano: umowa_runmageddon.docx');
}

// Eksport dla użycia jako moduł
module.exports = { generateOffer, generateContract, SERVICE_PACKAGES, ADDITIONAL_SERVICES };

// Uruchom jeśli wywołane bezpośrednio
if (require.main === module) {
    main().catch(console.error);
}
