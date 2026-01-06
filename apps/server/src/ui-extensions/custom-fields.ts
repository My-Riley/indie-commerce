import { LanguageCode } from '@vendure/core';

/**
 * Custom field configuration
 * Used for the unified management of all custom field definitions
 */
export const customFieldsConfig = {
    Address: [],
    Administrator: [],
    Asset: [],
    Channel: [],
    Collection: [],
    Customer: [],
    CustomerGroup: [],
    Facet: [],
    FacetValue: [],
    Fulfillment: [],
    GlobalSettings: [],
    Order: [],
    OrderLine: [],
    Payment: [],
    PaymentMethod: [],
    Product: [],
    ProductOption: [],
    ProductOptionGroup: [],
    ProductVariant: [
        {
            name: 'weight',
            type: 'float' as const,
            label: [
                { languageCode: LanguageCode.en, value: 'Weight (grams)' },
                { languageCode: LanguageCode.zh_Hans, value: '重量（克）' },
            ]
        }
    ],
    Promotion: [],
    Region: [],
    Role: [],
    Seller: [],
    ShippingMethod: [],
    StockLocation: [],
    Tag: [],
    TaxCategory: [],
    TaxRate: [],
    User: [],
    Zone: []
};
