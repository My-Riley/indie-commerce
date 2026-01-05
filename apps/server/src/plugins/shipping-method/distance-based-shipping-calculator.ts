import { 
  VendurePlugin, 
  ShippingCalculator, 
  LanguageCode, 
  RequestContext, 
  Order, 
  Injector, 
  InternalServerError,
  Logger,
  TaxCategoryService,
  TaxRateService
} from '@vendure/core';
import { PluginCommonModule } from '@vendure/core';
import { loggerCtx } from '@pinelab/vendure-plugin-shipping-extensions/dist/constants';
import { getDistanceBetweenPointsInKMs } from '@pinelab/vendure-plugin-shipping-extensions/dist/util/get-distance-between-points';
import { getHighestTaxRateOfOrder } from '@pinelab/vendure-plugin-shipping-extensions/dist/config/shipping/shipping-util';
import { ShippingExtensionsPlugin } from './shipping-extensions-plugin';

let injector: Injector;

export const customDistanceBasedShippingCalculator = new ShippingCalculator({
    code: 'custom-distance-based-shipping-calculator',
    description: [
        {
            languageCode: LanguageCode.en,
            value: 'Distance Based Shipping Calculator',
        },
    ],
    args: {
        storeLatitude: {
            type: 'float',
            ui: { component: 'number-form-input', min: -90, max: 90 },
            label: [{ languageCode: LanguageCode.en, value: 'Store Latitude' }],
        },
        storeLongitude: {
            type: 'float',
            ui: { component: 'number-form-input', min: -180, max: 180 },
            label: [{ languageCode: LanguageCode.en, value: 'Store Longitude' }],
        },
        pricePerKm: {
            type: 'int',
            ui: { component: 'currency-form-input' },
            label: [{ languageCode: LanguageCode.en, value: 'Price per KM' }],
        },
        minPrice: {
            type: 'int',
            ui: { component: 'currency-form-input' },
            label: [
                {
                    languageCode: LanguageCode.en,
                    value: 'MinimumPrice',
                },
            ],
        },
        taxCategory: {
            type: 'string',
            ui: { component: 'select-form-input', options: [] },
            label: [{ languageCode: LanguageCode.en, value: 'Tax Category' }],
            description: [{ languageCode: LanguageCode.en, value: 'The tax category for shipping costs' }],
        },
    },
    async init(_injector) {
        injector = _injector;
        // Populate the taxCategory arg list
        const ctx = RequestContext.empty();
        const taxCategoryService = _injector.get(TaxCategoryService);
        const taxCategories = await taxCategoryService.findAll(ctx);
        this.args.taxCategory.ui.options = taxCategories.items.map((c: any) => ({
            value: c.id,
            label: [
                {
                    languageCode: LanguageCode.en,
                    value: c.name,
                },
            ],
        })) as any;
    },
    calculate: async (ctx, order, args, method) => {
        if (!ShippingExtensionsPlugin.options?.orderAddressToGeolocationStrategy) {
            throw new InternalServerError('OrderAddress to geolocation conversion strategy not configured');
        }
        
        // Get tax rate based on selected tax category or fallback to highest tax rate
        let taxRate = 0;
        if (args.taxCategory) {
            const taxCategoryService = injector.get(TaxCategoryService);
            const taxCategory = await taxCategoryService.findOne(ctx, args.taxCategory);
            if (taxCategory) {
                // Get tax rate for the selected tax category
                const taxRateService = injector.get(TaxRateService);
                // Use default zone (usually the channel's default zone) to get applicable tax rate
                const zone = ctx.channel.defaultTaxZone;
                if (zone) {
                    const applicableTaxRate = await taxRateService.getApplicableTaxRate(ctx, zone.id, taxCategory.id);
                    taxRate = applicableTaxRate.value;
                }
            }
        } else {
            // Fallback to highest tax rate of order
            taxRate = await getHighestTaxRateOfOrder(ctx, injector, order);
        }
        
        const storeGeoLocation = {
            latitude: args.storeLatitude,
            longitude: args.storeLongitude,
        };
        // Used as fallback when order shipping address is not available or something goes wrong
        const minimumPrice = {
            price: args.minPrice,
            priceIncludesTax: ctx.channel.pricesIncludeTax,
            taxRate,
            metadata: { storeGeoLocation },
        };
        if (!order?.shippingAddress?.postalCode ||
            !order.shippingAddress?.countryCode) {
            return minimumPrice;
        }
        try {
            const shippingAddressGeoLocation = await ShippingExtensionsPlugin.options.orderAddressToGeolocationStrategy.getGeoLocationForAddress(order.shippingAddress);
            if (!shippingAddressGeoLocation) {
                return minimumPrice;
            }
            const distance = getDistanceBetweenPointsInKMs(shippingAddressGeoLocation, storeGeoLocation);
            let price = distance * args.pricePerKm;
            if (price < args.minPrice) {
                price = args.minPrice;
            }
            return {
                price,
                priceIncludesTax: ctx.channel.pricesIncludeTax,
                taxRate,
                metadata: { shippingAddressGeoLocation, storeGeoLocation },
            };
        }
        catch (e: any) {
            Logger.error(
              `Failed to calculate shipping for ${method.name}: ${e?.message}`, loggerCtx);
            return minimumPrice;
        }
    },
});

@VendurePlugin({
    imports: [PluginCommonModule],
    configuration: (config) => {
        // Remove the original distanceBasedShippingCalculator and add our custom calculator
        config.shippingOptions.shippingCalculators = config.shippingOptions.shippingCalculators.filter(
            calculator => calculator.code !== 'distance-based-shipping-calculator'
        );
        config.shippingOptions.shippingCalculators.push(customDistanceBasedShippingCalculator);
        
        return config;
    },
    compatibility: '>=2.2.0',
})
export class DistanceBasedShippingCalculatorPlugin {
    static init() {
        return DistanceBasedShippingCalculatorPlugin;
    }
}