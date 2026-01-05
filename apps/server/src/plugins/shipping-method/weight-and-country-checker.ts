import { 
  VendurePlugin, 
  ShippingEligibilityChecker, 
  LanguageCode, 
  RequestContext, 
  Order, 
  Injector, 
  CountryService, 
  OrderService,
  assertFound
} from '@vendure/core';
import { PluginCommonModule } from '@vendure/core';
import { isEligibleForCountry } from '@pinelab/vendure-plugin-shipping-extensions/dist/config/shipping/shipping-util';
import { ShippingExtensionsPlugin } from './shipping-extensions-plugin';

function calculateOrderWeight(order: Order): number {
    return order.lines.reduce((acc, line) => {
        //eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const weight: number =
            //eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
            (line.productVariant.customFields as any)?.weight ??
            //eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
            (line.productVariant.product?.customFields as any)?.weight ??
            0;
        const lineWeight = weight * line.quantity;
        return acc + lineWeight;
    }, 0);
}

let injector: Injector;

export const customWeightAndCountryChecker = new ShippingEligibilityChecker({
    code: 'custom-shipping-by-weight-and-country',
    description: [
        {
            languageCode: LanguageCode.en,
            value: 'Check by weight and country',
        },
    ],
    args: {
        minWeight: {
            type: 'float',
            description: [{ languageCode: LanguageCode.en, value: `Minimum weight` }],
        },
        maxWeight: {
            type: 'float',
            description: [{ languageCode: LanguageCode.en, value: `Maximum weight` }],
        },
        countries: {
            type: 'string',
            list: true,
            ui: {
                component: 'select-form-input',
                options: [],
            },
        },
        excludeCountries: {
            type: 'boolean',
            description: [
                {
                    languageCode: LanguageCode.en,
                    value: 'Eligible for all countries except the ones listed above',
                },
            ],
            ui: {
                component: 'boolean-form-input',
            },
        },
    },
    async init(_injector) {
        injector = _injector;
        const ctx = RequestContext.empty();
        // Populate the countries arg list
        const countryService = injector.get(CountryService);
        const countries = await countryService.findAll(ctx);
        this.args.countries.ui.options = countries.items.map((c: any) => ({
            value: c.code,
            label: [
                {
                    languageCode: LanguageCode.en,
                    value: c.name,
                },
            ],
        })) as any;

        // Set the description based on the given weight unit.
        // This needs to happen in `init`, because plugin.options are otherwise not available
        const weightUnit = ShippingExtensionsPlugin.options?.weightUnit || 'grams';
        this.args.minWeight.description = [
            {
                languageCode: LanguageCode.en,
                value: `Minimum weight in ${weightUnit}`,
            },
        ];
        this.args.maxWeight.description = [
            {
                languageCode: LanguageCode.en,
                value: `Maximum weight in ${weightUnit}`,
            },
        ];
    },
    async check(ctx, _order, { minWeight, maxWeight, countries, excludeCountries }, method) {
        const isEligibleByCountry = isEligibleForCountry(_order, countries, excludeCountries);
        if (isEligibleByCountry === false) {
            return false;
        }
        
        // Shipping country is allowed, continue checking order weight
        // Fix for test shipping method: use the order directly if it doesn't have an ID (test order)
        let hydratedOrder = _order;
        if (_order.id) {
            try {
                const orderService = injector.get(OrderService);
                const foundOrder = await orderService.findOne(ctx, _order.id, [
                    'lines',
                    'lines.productVariant',
                    'lines.productVariant.product',
                ]);
                if (foundOrder) {
                    hydratedOrder = foundOrder;
                }
            } catch (error) {
                // If we can't hydrate the order (e.g., in test mode), use the order as-is
                hydratedOrder = _order;
            }
        }
        
        // Use custom weight calculation function if provided
        let totalOrderWeight = 0;
        if (ShippingExtensionsPlugin.options?.weightCalculationFunction) {
            totalOrderWeight = await ShippingExtensionsPlugin.options.weightCalculationFunction(ctx, hydratedOrder, injector);
        } else {
            totalOrderWeight = calculateOrderWeight(hydratedOrder);
        }
        
        const isBetweenWeights = totalOrderWeight <= maxWeight && totalOrderWeight >= minWeight;
        
        if (!isBetweenWeights) {
            return false;
        }
        
        // Check for additional consumer provided isEligible check as final option to block eligibility
        const additionalIsEligible = await ShippingExtensionsPlugin.options?.additionalShippingEligibilityCheck?.(ctx, injector, hydratedOrder, method);
        if (additionalIsEligible === false) {
            return false;
        }
        
        return true;
    },
});

@VendurePlugin({
    imports: [PluginCommonModule],
    configuration: (config) => {
        // Remove the original weightAndCountryChecker and add our custom checker
        config.shippingOptions.shippingEligibilityCheckers = config.shippingOptions.shippingEligibilityCheckers.filter(
            checker => checker.code !== 'shipping-by-weight-and-country'
        );
        config.shippingOptions.shippingEligibilityCheckers.push(customWeightAndCountryChecker);
        
        return config;
    },
    compatibility: '>=2.2.0',
})
export class WeightAndCountryCheckerPlugin {
    static init() {
        return WeightAndCountryCheckerPlugin;
    }
}