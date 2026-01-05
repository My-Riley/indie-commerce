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
    Product: [
        {
            name: 'productDetails',
            type: 'localeText' as const,
            label: [
                { languageCode: LanguageCode.en, value: 'Product Details' },
                { languageCode: LanguageCode.zh_Hans, value: '产品详情' },
            ],
            ui: { component: 'rich-text-form-input', tab: 'Details' },
            nullable: true,
        },
        {
            name: 'sizeGuide',
            type: 'localeText' as const,
            label: [
                { languageCode: LanguageCode.en, value: 'Size Guide' },
                { languageCode: LanguageCode.zh_Hans, value: '尺码指南' },
            ],
            ui: { component: 'rich-text-form-input', tab: 'Size' },
            nullable: true,
        }
    ],
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